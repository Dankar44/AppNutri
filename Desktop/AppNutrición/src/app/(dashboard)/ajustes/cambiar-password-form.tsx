"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { cambiarPassword } from "@/app/actions/perfil";

export function CambiarPasswordForm() {
  const t = useTranslations("settings");
  const [loading, setLoading] = useState(false);
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const actual = form.get("actual") as string;
    const nueva = form.get("nueva") as string;
    const confirmar = form.get("confirmar") as string;

    if (nueva !== confirmar) {
      toast.error(t("cambiarPassword.toastErrorNoCoinciden"));
      return;
    }

    setLoading(true);
    try {
      const res = await cambiarPassword({ actual, nueva });
      if (res.ok) {
        toast.success(t("cambiarPassword.toastSuccess"));
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(res.error || t("cambiarPassword.toastErrorGenerico"));
      }
    } catch {
      toast.error(t("cambiarPassword.toastErrorGenerico"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t("cambiarPassword.actualLabel")}</label>
        <div className="relative">
          <input
            name="actual"
            type={showActual ? "text" : "password"}
            required
            maxLength={100}
            className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowActual(!showActual)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
          >
            {showActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t("cambiarPassword.nuevaLabel")}</label>
          <div className="relative">
            <input
              name="nueva"
              type={showNueva ? "text" : "password"}
              required
              minLength={6}
              maxLength={100}
              className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowNueva(!showNueva)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t("cambiarPassword.confirmarLabel")}</label>
          <input
            name="confirmar"
            type={showNueva ? "text" : "password"}
            required
            minLength={6}
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {loading ? t("cambiarPassword.cambiando") : t("cambiarPassword.cambiarContrasena")}
      </button>
    </form>
  );
}
