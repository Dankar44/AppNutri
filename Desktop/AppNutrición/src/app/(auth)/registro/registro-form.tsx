"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Eye, EyeOff, Loader2, Info, MailCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/language-switcher";
import { registrarCuenta, reenviarVerificacion } from "@/app/actions/registro";
import { createClient } from "@/lib/supabase/client";
import { GoogleGlyph } from "@/components/google-glyph";
import { InAppBrowserNotice, useInAppBrowser } from "@/components/in-app-browser-notice";

export default function RegistroForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { inApp } = useInAppBrowser();
  const [showPassword2, setShowPassword2] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    password2: "",
    especialidad: "",
  });

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleGoogleRegistro() {
    // Con Google "registrarse" e "iniciar sesión" son el mismo flujo: si la cuenta no
    // existe se crea, y si existe entra. Por eso es el mismo signInWithOAuth que en /login.
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

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellidos.trim() || !form.email.trim()) {
      toast.error(t("registro.form.errorFieldsRequired"));
      return;
    }
    if (form.password.length < 6) {
      toast.error(t("registro.form.errorPasswordLength"));
      return;
    }
    if (form.password !== form.password2) {
      toast.error(t("registro.form.errorPasswordMismatch"));
      return;
    }

    setLoading(true);

    const result = await registrarCuenta({
      nombre: form.nombre.trim(),
      apellidos: form.apellidos.trim(),
      email: form.email.trim(),
      password: form.password,
      especialidad: form.especialidad.trim() || undefined,
    });

    if (!result.ok) {
      toast.error(result.error || t("registro.form.errorFieldsRequired"));
      setLoading(false);
      return;
    }

    toast.success(t("registro.form.successAccountCreated"));
    setRegistrado(true);
    setLoading(false);
  }

  async function handleReenviar() {
    setReenviando(true);
    try {
      const res = await reenviarVerificacion(form.email.trim());
      if (res.ok) toast.success(t("registro.form.exito.reenviado"));
      else toast.error(res.error || t("registro.form.errorFieldsRequired"));
    } catch {
      toast.error(t("registro.form.errorFieldsRequired"));
    } finally {
      setReenviando(false);
    }
  }

  if (registrado) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 py-8 pt-safe pb-safe">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <MailCheck className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("registro.form.exito.titulo")}</h2>
          <p className="text-muted-foreground mb-1">
            {t("registro.form.exito.enviadoA", { email: form.email.trim() })}
          </p>
          <p className="text-muted-foreground text-sm mb-6">{t("registro.form.exito.instruccion")}</p>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-left mb-6">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              {t("registro.form.exito.spam")}
            </p>
          </div>

          <button
            onClick={handleReenviar}
            disabled={reenviando}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
          >
            {reenviando && <Loader2 className="w-4 h-4 animate-spin" />}
            {reenviando ? t("registro.form.exito.reenviando") : t("registro.form.exito.reenviar")}
          </button>
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-primary font-medium hover:underline"
          >
            {t("registro.form.exito.irLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh lg:h-dvh flex lg:overflow-hidden">
      {/* Panel izquierdo decorativo (fijo, centrado en pantalla) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-green-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Leaf className="w-16 h-16 mb-8" />
          <h1 className="text-5xl font-bold mb-4">Annonia</h1>
          <p className="text-xl text-green-100 max-w-md">
            {t("registro.form.step1.heroText")}
          </p>
        </div>
      </div>

      {/* Panel derecho (única columna con scroll propio) */}
      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-safe lg:h-dvh lg:overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-auto">
          <div className="lg:hidden flex items-center gap-2 mb-6 sm:mb-8">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="text-xl sm:text-2xl font-bold">Annonia</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-2">{t("registro.title")}</h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-6">
            {t("registro.subtitle")}
          </p>

          <InAppBrowserNotice />

          {!inApp && (
            <>
              <button
                type="button"
                onClick={handleGoogleRegistro}
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

          <form onSubmit={handleRegistro} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium mb-1.5">
                  {t("registro.form.step1.nombreLabel")}
                </label>
                <input
                  id="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={(e) => updateForm("nombre", e.target.value)}
                  placeholder={t("registro.form.step1.nombrePlaceholder")}
                  required
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>
              <div>
                <label htmlFor="apellidos" className="block text-sm font-medium mb-1.5">
                  {t("registro.form.step1.apellidosLabel")}
                </label>
                <input
                  id="apellidos"
                  type="text"
                  value={form.apellidos}
                  onChange={(e) => updateForm("apellidos", e.target.value)}
                  placeholder={t("registro.form.step1.apellidosPlaceholder")}
                  required
                  maxLength={100}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                {t("registro.form.step1.nombreRealAviso")}
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                {t("registro.form.step1.emailLabel")}
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                placeholder={t("registro.form.step1.emailPlaceholder")}
                required
                maxLength={200}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            <div>
              <label htmlFor="especialidad" className="block text-sm font-medium mb-1.5">
                {t("registro.form.step1.especialidadLabel")}
                <span className="text-muted-foreground font-normal"> {t("registro.form.step1.especialidadOpcional")}</span>
              </label>
              <input
                id="especialidad"
                type="text"
                value={form.especialidad}
                onChange={(e) => updateForm("especialidad", e.target.value)}
                placeholder={t("registro.form.step1.especialidadPlaceholder")}
                maxLength={200}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                {t("registro.form.step1.passwordLabel")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  placeholder={t("registro.form.step1.passwordPlaceholder")}
                  required
                  minLength={6}
                  maxLength={128}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow pr-12"
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
              <label htmlFor="password2" className="block text-sm font-medium mb-1.5">
                {t("registro.form.step1.passwordConfirmLabel")}
              </label>
              <div className="relative">
                <input
                  id="password2"
                  type={showPassword2 ? "text" : "password"}
                  value={form.password2}
                  onChange={(e) => updateForm("password2", e.target.value)}
                  placeholder={t("registro.form.step1.passwordConfirmPlaceholder")}
                  required
                  minLength={6}
                  maxLength={128}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword2 ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.password2.length > 0 && form.password !== form.password2 && (
                <p className="text-xs text-red-500 mt-1">{t("registro.form.errorPasswordMismatch")}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t("registro.form.step3.submitting") : t("registro.form.step3.submitButton")}
            </button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            {t("registro.form.hasAccountPrompt")}{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t("registro.form.loginLink")}
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              {t("registro.form.patientPrompt")}{" "}
              <Link href="/paciente/login" className="text-primary font-medium hover:underline">
                {t("registro.form.patientLink")}
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
