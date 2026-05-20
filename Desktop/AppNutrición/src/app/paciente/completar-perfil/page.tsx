"use client";

import { useState } from "react";
import { Leaf, Eye, EyeOff, Camera } from "lucide-react";
import { completarPerfilPaciente } from "@/app/actions/paciente-auth";
import { toast } from "sonner";
import { compressImage, IMAGE_PRESETS } from "@/lib/image-compress";
import { useTranslations } from "next-intl";
import { isNextNavigation } from "@/lib/utils";

export default function CompletarPerfilPage() {
  const t = useTranslations("patient-portal");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("completarPerfil.toast.imagenGrande"));
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const compressed = await compressImage(reader.result as string, IMAGE_PRESETS.PROFILE_PHOTO);
        setFotoPreview(compressed);
      } catch {
        setFotoPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (password.length < 6) {
      toast.error(t("completarPerfil.toast.passwordCorta"));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("completarPerfil.toast.passwordNoCoincide"));
      setLoading(false);
      return;
    }

    try {
      await completarPerfilPaciente(password, fotoPreview || undefined);
      toast.success(t("completarPerfil.toast.perfilCompletado"));
    } catch (error) {
      if (isNextNavigation(error)) throw error;
      toast.error(t("completarPerfil.toast.errorCompletar"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Leaf className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-xl sm:text-2xl font-bold">{t("completarPerfil.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("completarPerfil.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto de perfil */}
          <div className="flex flex-col items-center">
            <label className="cursor-pointer group relative">
              <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden group-hover:border-primary transition-colors">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              {fotoPreview ? t("completarPerfil.fotoClickCambiar") : t("completarPerfil.fotoLabel")}
            </p>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("completarPerfil.passwordLabel")}
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                maxLength={128}
                placeholder={t("completarPerfil.passwordPlaceholder")}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("completarPerfil.confirmPasswordLabel")}
            </label>
            <input
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              maxLength={128}
              placeholder={t("completarPerfil.confirmPasswordPlaceholder")}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? t("completarPerfil.submitting") : t("completarPerfil.submit")}
          </button>

          <p className="text-xs text-muted-foreground text-center">
            {t("completarPerfil.futuroAcceso")}
          </p>
        </form>
      </div>
    </div>
  );
}
