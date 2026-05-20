"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Key, Check, AlertTriangle, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { crearAccesoPaciente } from "@/app/actions/paciente-auth";
import { toast } from "sonner";
import { isNextNavigation, withTimeout } from "@/lib/utils";

interface Props {
  pacienteId: string;
  emailDefault: string;
  accesoExistente: {
    email: string;
    activo: boolean;
    tienePassword: boolean;
    perfilCompleto: boolean;
  } | null;
}

function generarPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function PortalConfig({ pacienteId, emailDefault, accesoExistente }: Props) {
  const router = useRouter();
  const t = useTranslations("patients");
  const [loading, setLoading] = useState(false);
  const [pinGenerado, setPinGenerado] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [emailForm, setEmailForm] = useState(accesoExistente?.email || emailDefault);

  const yaTieneCuenta = accesoExistente?.perfilCompleto || accesoExistente?.tienePassword;

  async function handleGenerar() {
    setLoading(true);
    const pin = generarPin();

    try {
      await withTimeout(crearAccesoPaciente(pacienteId, emailForm, pin));
      setPinGenerado(pin);
      setConfirmando(false);
      toast.success(t("portal.pinGenerado"));
      router.refresh();
    } catch (error) { if (isNextNavigation(error)) throw error;
      toast.error(t("portal.errorConfigurarAcceso"));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Si ya tiene cuenta con contraseña, pedir confirmación
    if (yaTieneCuenta) {
      setConfirmando(true);
    } else {
      handleGenerar();
    }
  }

  return (
    <div className="max-w-md space-y-6">
      {/* Estado actual */}
      {accesoExistente && !pinGenerado && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">{t("portal.estadoAcceso")}</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("portal.email")}</span>
              <span className="font-medium">{accesoExistente.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("portal.estado")}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${accesoExistente.activo ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                {accesoExistente.activo ? t("list.activo") : t("list.inactivo")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("portal.contrasena")}</span>
              <span className="text-xs font-medium">
                {accesoExistente.tienePassword ? t("portal.configurada") : t("portal.soloPIN")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("portal.perfil")}</span>
              <span className="text-xs font-medium">
                {accesoExistente.perfilCompleto ? t("portal.completado") : t("portal.pendiente")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* PIN generado */}
      {pinGenerado && (
        <div className="bg-primary/5 border-2 border-primary rounded-lg p-6 text-center">
          <Key className="w-8 h-8 text-primary mx-auto mb-3" />
          <p className="text-sm font-medium mb-2">{t("portal.nuevoPinGenerado")}</p>
          <p className="text-3xl font-bold tracking-[0.3em] text-primary mb-3">
            {pinGenerado}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("portal.compartePinConPaciente")}
          </p>
        </div>
      )}

      {/* Diálogo de confirmación */}
      {confirmando && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-lg p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {t("portal.pacienteConContrasena")}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                {t("portal.generarNuevoPinAviso")}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleGenerar}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {loading ? t("portal.generando") : t("portal.siGenerarNuevoPin")}
                </button>
                <button
                  onClick={() => setConfirmando(false)}
                  className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  {t("portal.cancelar")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      {!confirmando && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {accesoExistente ? t("portal.regenerarPin") : t("portal.crearAcceso")}
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1">{t("portal.emailPacienteLabel")}</label>
            <input
              name="email"
              type="email"
              required
              maxLength={200}
              value={emailForm}
              onChange={(e) => setEmailForm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("portal.emailLoginHint")}
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? t("portal.generando") : accesoExistente ? t("portal.regenerarPin") : t("portal.generarPinCrearAcceso")}
          </button>
        </form>
      )}
    </div>
  );
}
