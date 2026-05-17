"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { loginPaciente } from "@/app/actions/paciente-auth";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function PatientLoginPage() {
  const t = useTranslations("patient-portal");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const credencial = form.get("credencial") as string;

    try {
      const result = await loginPaciente(email, credencial);
      if (result?.error) {
        toast.error(result.error);
        setLoading(false);
      }
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("login.errorGenerico"));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Leaf className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-xl sm:text-2xl font-bold">{t("login.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("login.subtitle")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("login.emailLabel")}</label>
            <input
              name="email"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("login.passwordLabel")}</label>
            <div className="relative">
              <input
                name="credencial"
                type={showPassword ? "text" : "password"}
                required
                maxLength={128}
                placeholder={t("login.passwordPlaceholder")}
                autoComplete="current-password"
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
            <p className="text-xs text-muted-foreground mt-1">
              {t("login.pinHint")}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            {t("login.esDietista")}{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              {t("login.accedeProfesional")}
            </Link>
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <LanguageSwitcher dropDirection="up" />
        </div>
      </div>
    </div>
  );
}
