"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { Leaf, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { GoogleGlyph } from "@/components/google-glyph";
import { InAppBrowserNotice, useInAppBrowser } from "@/components/in-app-browser-notice";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { inApp } = useInAppBrowser();

  useEffect(() => {
    const err = searchParams.get("error");
    const verified = searchParams.get("verified");
    if (err) {
      // Mapear códigos técnicos del callback de OAuth a mensajes legibles. Los textos
      // que ya vienen traducidos (p. ej. "email registrado como paciente") contienen
      // espacios y se muestran tal cual; un código suelto (snake_case) usa el genérico.
      const mapaErrores: Record<string, string> = {
        exchange_failed: t("login.errorOAuthIncompleto"),
        missing_code: t("login.errorOAuthIncompleto"),
        access_denied: t("login.errorGoogleCancelado"),
      };
      const mensaje = mapaErrores[err] ?? (err.includes(" ") ? err : t("login.errorGenerico"));
      toast.error(mensaje);
      window.history.replaceState({}, "", "/login");
    }
    if (verified === "true") {
      toast.success(t("login.emailVerified"));
      window.history.replaceState({}, "", "/login");
    }
  }, [searchParams, t]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message?.includes("Email not confirmed")) {
        toast.error(t("login.errorEmailNotConfirmed"));
      } else {
        toast.error(t("login.errorInvalidCredentials"));
      }
      setLoading(false);
      return;
    }

    toast.success(t("login.successWelcome"));
    window.location.href = "/dashboard";
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) {
      toast.error(t("login.errorGoogleLogin"));
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex">
      {/* Panel izquierdo decorativo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="/images/landing/banner.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 to-green-700/90" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Leaf className="w-16 h-16 mb-8" />
          <h1 className="text-5xl font-bold mb-4">{t("login.heroTitle")}</h1>
          <p className="text-xl text-green-100 max-w-md">
            {t("login.heroSubtitle")}
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>{t("login.heroFeature1")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>{t("login.heroFeature2")}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                ✓
              </div>
              <span>{t("login.heroFeature3")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho con formulario */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pt-safe pb-safe">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-6 sm:mb-8">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="text-xl sm:text-2xl font-bold">Annonia</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t("login.title")}</h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8">
            {t("login.subtitle")}
          </p>

          <InAppBrowserNotice />

          {!inApp && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="w-full mb-5 flex items-center justify-center gap-3 rounded-lg border border-input bg-card py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-60"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GoogleGlyph />
                )}
                {t("login.continueWithGoogle")}
              </button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
                <div className="flex-1 h-px bg-border" />
                {t("login.orWithEmail")}
                <div className="flex-1 h-px bg-border" />
              </div>
            </>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
              >
                {t("login.emailLabel")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("login.emailPlaceholder")}
                required
                maxLength={200}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
              >
                {t("login.passwordLabel")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("login.passwordPlaceholder")}
                  required
                  maxLength={128}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href="/recuperar-password"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t("login.forgotPasswordLink")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t("login.submitting") : t("login.submitButton")}
            </button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            {t("login.noAccountPrompt")}{" "}
            <Link
              href="/registro"
              className="text-primary font-medium hover:underline"
            >
              {t("login.registerLink")}
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              {t("login.patientPrompt")}{" "}
              <Link
                href="/paciente/login"
                className="text-primary font-medium hover:underline"
              >
                {t("login.patientLink")}
              </Link>
            </p>
          </div>

          <p className="text-center mt-2 text-xs text-muted-foreground">
            {tc("soporte.problemas")}{" "}
            <a href="mailto:annonianutri@gmail.com" className="text-primary hover:underline">
              annonianutri@gmail.com
            </a>
          </p>

          <div className="mt-6 flex justify-center">
            <LanguageSwitcher dropDirection="up" />
          </div>
        </div>
      </div>
    </div>
  );
}
