"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, Copy, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { crearCuentaNutricionista } from "@/app/actions/admin";
import { useUncontrolledFormPersist } from "@/lib/form-persist";

export function CrearCuentaForm() {
  const t = useTranslations("admin.crearCuenta");
  const tc = useTranslations("common.deploy");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creada, setCreada] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { wasRestored, clear: clearDraft } = useUncontrolledFormPersist(
    "admin-crear-cuenta",
    formRef,
  );

  useEffect(() => {
    if (wasRestored) toast.success(tc("datosRestaurados"));
  }, [wasRestored, tc]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = (form.get("email") as string).trim();
    const password = (form.get("password") as string);
    const nombre = (form.get("nombre") as string).trim();
    const apellidos = (form.get("apellidos") as string).trim();
    const fuenteContacto = (form.get("fuenteContacto") as string) || undefined;
    const creadoPorNombre = (form.get("creadoPorNombre") as string)?.trim() || undefined;

    const res = await crearCuentaNutricionista({ email, password, nombre, apellidos, fuenteContacto, creadoPorNombre });

    if (res.ok) {
      clearDraft();
      toast.success(t("toast.cuentaCreada"));
      setCreada({ email, password });
    } else {
      toast.error(res.error || t("toast.errorCrear"));
    }

    setLoading(false);
  }

  function handleCopy() {
    if (!creada) return;
    navigator.clipboard.writeText(`Email: ${creada.email}\nContraseña: ${creada.password}\nLogin: https://annonia.com/login`);
    setCopied(true);
    toast.success(t("toast.credencialesCopiadas"));
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setCreada(null);
    setCopied(false);
  }

  if (creada) {
    return (
      <div className="max-w-lg space-y-6">
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Check className="w-5 h-5" />
            <p className="font-semibold">{t("success.title")}</p>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">{t("success.emailLabel")}</span>{" "}
              <span className="font-medium">{creada.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("success.passwordLabel")}</span>{" "}
              <span className="font-mono font-medium">{creada.password}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("success.loginLabel")}</span>{" "}
              <span className="font-medium">https://annonia.com/login</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t("success.copiado") : t("success.copiarCredenciales")}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              {t("success.crearOtra")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.nombre")}</label>
            <input
              name="nombre"
              required
              maxLength={100}
              placeholder={t("form.nombrePlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.apellidos")}</label>
            <input
              name="apellidos"
              maxLength={100}
              placeholder={t("form.apellidosPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("form.email")}</label>
          <input
            name="email"
            type="email"
            required
            maxLength={200}
            placeholder={t("form.emailPlaceholder")}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("form.fuenteContacto")}</label>
          <select
            name="fuenteContacto"
            required
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
          >
            <option value="">{t("form.fuentePlaceholder")}</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="universidad">Universidad</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("form.creadoPorNombre")}</label>
          <input
            name="creadoPorNombre"
            maxLength={100}
            placeholder={t("form.creadoPorPlaceholder")}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("form.password")}</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              maxLength={100}
              placeholder={t("form.passwordPlaceholder")}
              className="w-full px-3 py-2 pr-10 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
      >
        <UserPlus className="w-4 h-4" />
        {loading ? t("form.submitting") : t("form.submit")}
      </button>
    </form>
  );
}
