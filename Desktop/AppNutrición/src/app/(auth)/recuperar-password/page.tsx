"use client";

import { useState } from "react";
import Link from "next/link";
import { Leaf, ArrowLeft, Loader2, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { solicitarRecuperacion } from "@/app/actions/recovery";

export default function RecuperarPasswordPage() {
  const t = useTranslations("auth.recuperarPassword");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await solicitarRecuperacion(email, window.location.origin);

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8 pt-safe pb-safe">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <Leaf className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold">Annonia</span>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 mx-auto">
              <Mail className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{t("title")}</h2>
              <p className="text-muted-foreground text-sm">
                {t("successMessage")}
              </p>
            </div>
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-input hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-2">{t("title")}</h2>
            <p className="text-muted-foreground text-sm mb-8">
              {t("subtitle")}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                  {t("emailLabel")}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                  maxLength={200}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? t("submitting") : t("submitButton")}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("backToLogin")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
