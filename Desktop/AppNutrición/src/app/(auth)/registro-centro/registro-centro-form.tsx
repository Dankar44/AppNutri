"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Leaf,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function RegistroCentroForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [paso, setPaso] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    password: "",
    centroNombre: "",
    centroDescripcion: "",
  });

  function updateForm(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSiguiente(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim() || !form.apellidos.trim() || !form.email.trim()) {
      toast.error(t("registro.form.errorFieldsRequired"));
      return;
    }
    if (form.password.length < 6) {
      toast.error(t("registro.form.errorPasswordLength"));
      return;
    }
    setPaso(2);
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    if (!form.centroNombre.trim()) {
      toast.error(t("registroCentro.errorCentroNombre"));
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        data: {
          nombre: form.nombre,
          apellidos: form.apellidos,
          tipoCuenta: "centro",
          centroNombre: form.centroNombre,
          centroDescripcion: form.centroDescripcion,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(t("registro.form.successAccountCreated"));
    router.push("/login");
  }

  return (
    <div className="min-h-dvh lg:h-dvh flex lg:overflow-hidden">
      {/* Panel izquierdo decorativo (fijo, centrado en pantalla) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-green-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <Building2 className="w-16 h-16 mb-8" />
          <h1 className="text-5xl font-bold mb-4">Annonia</h1>
          <p className="text-xl text-green-100 max-w-md">
            {paso === 1
              ? t("registroCentro.heroStep1")
              : t("registroCentro.heroStep2")}
          </p>
        </div>
      </div>

      {/* Panel derecho (única columna con scroll propio) */}
      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-6 sm:py-12 pb-safe lg:h-dvh lg:overflow-y-auto">
        <div className="w-full max-w-md mx-auto my-auto">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold">Annonia</span>
          </div>

          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= paso ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {paso === 1 && (
            <form onSubmit={handleSiguiente} className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">{t("registroCentro.step1Title")}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("registroCentro.step1Desc")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("registro.form.step1.nombreLabel")}
                  </label>
                  <input
                    type="text"
                    value={form.nombre}
                    onChange={(e) => updateForm("nombre", e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t("registro.form.step1.apellidosLabel")}
                  </label>
                  <input
                    type="text"
                    value={form.apellidos}
                    onChange={(e) => updateForm("apellidos", e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("registro.form.step1.emailLabel")}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("registro.form.step1.passwordLabel")}
                </label>
                <div className="relative mt-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateForm("password", e.target.value)}
                    minLength={6}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                {t("registro.form.step1.nextButton")}
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-sm text-muted-foreground">
                {t("registro.form.hasAccountPrompt")}{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  {t("registro.form.loginLink")}
                </Link>
              </p>
            </form>
          )}

          {paso === 2 && (
            <form onSubmit={handleRegistro} className="space-y-5">
              <div>
                <button
                  type="button"
                  onClick={() => setPaso(1)}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("registro.form.step2.backButton")}
                </button>
                <h2 className="text-2xl font-bold">{t("registroCentro.step2Title")}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  {t("registroCentro.step2Desc")}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("registroCentro.centroNombreLabel")}
                </label>
                <input
                  type="text"
                  value={form.centroNombre}
                  onChange={(e) => updateForm("centroNombre", e.target.value)}
                  placeholder={t("registroCentro.centroNombrePlaceholder")}
                  required
                  maxLength={200}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("registroCentro.centroDescripcionLabel")}
                </label>
                <textarea
                  value={form.centroDescripcion}
                  onChange={(e) => updateForm("centroDescripcion", e.target.value)}
                  placeholder={t("registroCentro.centroDescripcionPlaceholder")}
                  maxLength={500}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
                {t("registroCentro.crearCentro")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
