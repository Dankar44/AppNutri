"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Mail, Smartphone, Loader2, Shield, Check, AlertTriangle, Copy, ExternalLink, Info, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn, withTimeout, isNextNavigation } from "@/lib/utils";
import { enviarAccesoPortal } from "@/app/actions/email";
import { crearAccesoPaciente, getAccesoEstado } from "@/app/actions/paciente-auth";
import { setOcultarCalorias } from "@/app/actions/pacientes";

interface Props {
  pacienteId: string;
  pacienteEmail?: string | null;
  esDemo?: boolean;
  ocultarCaloriasInicial?: boolean;
}

export function PortalPacienteTab({ pacienteId, pacienteEmail, esDemo, ocultarCaloriasInicial }: Props) {
  const t = useTranslations("patients.portal");
  const [sendingAcceso, startSendingAcceso] = useTransition();
  const [ocultarCalorias, setOcultarCaloriasState] = useState(ocultarCaloriasInicial ?? false);
  const [savingCalorias, setSavingCalorias] = useState(false);
  const [accesoEstado, setAccesoEstado] = useState<{
    email: string;
    activo: boolean;
    tienePassword: boolean;
    perfilCompleto: boolean;
  } | null>(null);
  const [pinEmail, setPinEmail] = useState(pacienteEmail || "");
  const [generatingPin, setGeneratingPin] = useState(false);
  const [pinGenerado, setPinGenerado] = useState<string | null>(null);
  const [showConfirmRegen, setShowConfirmRegen] = useState(false);
  const [showConfirmEnvio, setShowConfirmEnvio] = useState(false);

  const loadAcceso = useCallback(async () => {
    const estado = await getAccesoEstado(pacienteId);
    setAccesoEstado(estado);
    if (estado?.email) setPinEmail(estado.email);
  }, [pacienteId]);

  useEffect(() => { loadAcceso(); }, [loadAcceso]);

  function handleEnviarAcceso() {
    if (!pacienteEmail) {
      toast.error(t("sinEmailRegistradoError"));
      return;
    }
    setShowConfirmEnvio(false);
    startSendingAcceso(async () => {
      const res = await enviarAccesoPortal(pacienteId);
      if (res.ok) {
        toast.success(t("instruccionesEnviadas"));
      } else {
        toast.error(res.error || t("errorConfigurarAcceso"));
      }
    });
  }

  async function regenerarPin() {
    setShowConfirmRegen(false);
    setGeneratingPin(true);
    try {
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      await crearAccesoPaciente(pacienteId, pinEmail, pin);
      setPinGenerado(pin);
      await loadAcceso();
      toast.success(t("pinGenerado"));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : t("errorConfigurarAcceso"));
    } finally {
      setGeneratingPin(false);
    }
  }

  async function handleToggleCalorias() {
    const nuevo = !ocultarCalorias;
    setOcultarCaloriasState(nuevo);
    setSavingCalorias(true);
    try {
      await withTimeout(setOcultarCalorias(pacienteId, nuevo));
      toast.success(nuevo ? t("caloriasOcultadas") : t("caloriasVisibles"));
    } catch (error) {
      if (isNextNavigation(error)) throw error;
      setOcultarCaloriasState(!nuevo);
      toast.error(t("errorGuardarCalorias"));
    } finally {
      setSavingCalorias(false);
    }
  }

  return (
    <>
      {/* Banner visible SOLO en el paciente de ejemplo — explica cómo entrar al portal */}
      {esDemo && accesoEstado?.email && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-5 mb-4">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center">
              <Info className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                {t("pacienteEjemploPortal")}
              </h3>
              <p className="text-xs text-amber-800/90 mb-3">
                {t("pacienteEjemploDescripcion")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mb-2">
                <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-card px-3 py-2 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-amber-900 dark:text-amber-200 shrink-0">{t("email")}</span>
                  <code className="text-xs font-mono text-foreground truncate flex-1">
                    {accesoEstado.email}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(accesoEstado.email);
                      toast.success(t("emailCopiado"));
                    }}
                    className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition-colors shrink-0"
                    title={t("copiarEmail")}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="rounded-lg border border-amber-200 dark:border-amber-500/30 bg-card px-3 py-2 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-amber-900 dark:text-amber-200 shrink-0">PIN</span>
                  <code className="text-base font-mono font-bold text-foreground">123456</code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("123456");
                      toast.success(t("pinCopiado"));
                    }}
                    className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 transition-colors shrink-0"
                    title={t("copiarPin")}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <a
                href="/paciente/login"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 hover:text-amber-900 underline underline-offset-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t("abrirPortalNuevaPestana")}
              </a>
            </div>
          </div>
        </div>
      )}

      {!pacienteEmail && !esDemo && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                {t("sinEmailRegistradoError")}
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                {t("sinEmailExplicacion")}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">
          {t("aplicacionCliente")}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda: enviar instrucciones */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              {t("enviarInstruccionesAcceso")}
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (!pacienteEmail) { toast.error(t("sinEmailRegistradoError")); return; }
                  setShowConfirmEnvio(true);
                }}
                disabled={sendingAcceso || !pacienteEmail}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors",
                  pacienteEmail
                    ? "hover:bg-muted/60 cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">
                  {sendingAcceso ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t("enviarPorEmail")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {pacienteEmail || t("sinEmailRegistrado")}
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled
                className="w-full flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-left opacity-50 cursor-not-allowed"
              >
                <div className="rounded-lg bg-muted p-2.5 text-muted-foreground shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t("enviarPorMensaje")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("proximamente")}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Columna derecha: estado + regenerar PIN */}
          <div className="space-y-5 lg:border-l lg:border-border lg:pl-6">
            {accesoEstado && (
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-primary" />
                  {t("estadoAcceso")}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("email")}</span>
                    <span className="font-medium">{accesoEstado.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("estado")}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", accesoEstado.activo ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400")}>
                      {accesoEstado.activo ? t("activo") : t("inactivo")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("contrasena")}</span>
                    <span className="font-medium">{accesoEstado.tienePassword ? t("configurada") : t("sinConfigurar")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("perfil")}</span>
                    <span className="font-medium">{accesoEstado.perfilCompleto ? t("completado") : t("pendiente")}</span>
                  </div>
                </div>
              </div>
            )}

            <div className={accesoEstado ? "pt-5 border-t border-border" : ""}>
              <h3 className="text-sm font-semibold mb-3">
                {accesoEstado ? t("regenerarPin") : t("oGeneraContrasena")}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">{t("emailPacienteLabel")}</label>
                  <input
                    type="email"
                    value={pinEmail}
                    onChange={(e) => setPinEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    maxLength={200}
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">{t("emailLoginHint")}</p>
                </div>
                <button
                  type="button"
                  disabled={generatingPin || !pinEmail.includes("@")}
                  onClick={() => {
                    if (accesoEstado) setShowConfirmRegen(true);
                    else regenerarPin();
                  }}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {generatingPin ? t("generando") : accesoEstado ? t("regenerarPin") : t("crearContrasena")}
                </button>
                {pinGenerado && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm">PIN generado: <strong className="font-mono text-lg">{pinGenerado}</strong></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Privacidad: ocultar calorías y macros al paciente */}
      <div className="rounded-xl border border-border bg-card p-5 mt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">
              <EyeOff className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">
                {t("ocultarCaloriasTitulo")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t("ocultarCaloriasDescripcion")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleCalorias}
            disabled={savingCalorias}
            className={cn(
              "relative w-12 h-6 rounded-full transition-colors shrink-0 mt-1 disabled:opacity-50",
              ocultarCalorias ? "bg-emerald-600" : "bg-muted-foreground/30",
            )}
            aria-pressed={ocultarCalorias}
            aria-label={ocultarCalorias ? t("mostrarCaloriasAria") : t("ocultarCaloriasAria")}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                ocultarCalorias ? "translate-x-6" : "translate-x-0",
              )}
            />
          </button>
        </div>
      </div>

      {/* Modal confirmación regenerar PIN */}
      {showConfirmRegen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowConfirmRegen(false)}>
          <div
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-full bg-amber-100 dark:bg-amber-500/15 p-2.5 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">
                  {t("regenerarPinPregunta")}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("regenerarPinAviso")}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t("accionNoDeshacer")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowConfirmRegen(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                {t("cancelar")}
              </button>
              <button
                type="button"
                onClick={regenerarPin}
                disabled={generatingPin}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {generatingPin ? t("generando") : t("siRegenerarPin")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación enviar acceso (genera un PIN nuevo) */}
      {showConfirmEnvio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowConfirmEnvio(false)}>
          <div
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="rounded-full bg-amber-100 dark:bg-amber-500/15 p-2.5 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-base">{t("envioConfirmTitulo")}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t("envioConfirmAviso")}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowConfirmEnvio(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                {t("cancelar")}
              </button>
              <button
                type="button"
                onClick={handleEnviarAcceso}
                disabled={sendingAcceso}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {sendingAcceso ? t("generando") : t("siEnviarAcceso")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
