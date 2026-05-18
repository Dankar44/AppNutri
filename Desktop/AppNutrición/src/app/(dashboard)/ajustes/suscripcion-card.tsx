"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Clock, ArrowUpRight, Check } from "lucide-react";
import { cambiarPlan } from "@/app/actions/suscripcion";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { intlTag, type Locale } from "@/i18n/config";

interface Props {
  plan: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string | null;
}

const ESTADO_COLORS: Record<string, string> = {
  ACTIVA: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400",
  PRUEBA: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
  CANCELADA: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400",
  EXPIRADA: "bg-muted text-muted-foreground",
};

export function SuscripcionCard({ plan, estado, fechaInicio, fechaFin }: Props) {
  const t = useTranslations("settings.suscripcion");
  const tComp = useTranslations("settings.suscripcion.comparativa");
  const locale = useLocale() as Locale;
  const tag = intlTag(locale);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const planKey = (plan === "BASICO" || plan === "PROFESIONAL") ? plan : "BASICO";
  const estadoKey = (estado in ESTADO_COLORS) ? estado : "PRUEBA";
  const estadoColor = ESTADO_COLORS[estadoKey];
  const otroPlan = plan === "BASICO" ? "PROFESIONAL" : "BASICO";
  const esLicenciaCompleta = plan === "PROFESIONAL" && estado === "ACTIVA" && !fechaFin;

  // Calcular días restantes
  let diasRestantes: number | null = null;
  if (fechaFin) {
    const diff = new Date(fechaFin).getTime() - Date.now();
    diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  async function handleCambiarPlan() {
    setLoading(true);
    try {
      await cambiarPlan(otroPlan);
      toast.success(t("toastPlanCambiado", { nombre: t(`planes.${otroPlan}.nombre`) }));
      router.refresh();
    } catch {
      toast.error(t("toastErrorCambiarPlan"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Plan actual */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${plan === "PROFESIONAL" ? "bg-amber-50 dark:bg-amber-500/10" : "bg-primary/10"}`}>
            <Crown className={`w-5 h-5 ${plan === "PROFESIONAL" ? "text-amber-600 dark:text-amber-400" : "text-primary"}`} />
          </div>
          <div>
            <p className="font-semibold">{t("planLabel", { nombre: t(`planes.${planKey}.nombre`) })}</p>
            <p className="text-sm text-muted-foreground">{esLicenciaCompleta ? t("precioGratis") : t(`planes.${planKey}.precio`)}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${esLicenciaCompleta ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" : estadoColor}`}>
          {esLicenciaCompleta ? t("estadoPermanente") : t(`estados.${estadoKey}`)}
        </span>
      </div>

      {/* Licencia completa o días restantes */}
      {esLicenciaCompleta ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">{t("licenciaCompleta")}</span>
        </div>
      ) : diasRestantes !== null ? (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
          diasRestantes <= 3 ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" : "bg-muted/50"
        }`}>
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            {diasRestantes === 0
              ? estado === "PRUEBA"
                ? t("pruebaExpirada")
                : t("suscripcionExpirada")
              : estado === "PRUEBA"
                ? t("diasPruebaRestantes", { dias: diasRestantes, plural: diasRestantes !== 1 ? "s" : "" })
                : t("diasRenovacion", { dias: diasRestantes, plural: diasRestantes !== 1 ? "s" : "" })}
          </span>
        </div>
      ) : null}

      {/* Info de fechas */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">{t("inicioLabel")}</p>
          <p className="font-medium">
            {new Date(fechaInicio).toLocaleDateString(tag, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        {fechaFin && (
          <div>
            <p className="text-muted-foreground text-xs">
              {estado === "PRUEBA" ? t("finPruebaLabel") : t("proximaRenovacionLabel")}
            </p>
            <p className="font-medium">
              {new Date(fechaFin).toLocaleDateString(tag, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </div>

      {/* Comparativa + cambiar plan */}
      {!esLicenciaCompleta && (
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {plan === "BASICO" ? t("pasaAProfesional") : t("cambiarABasico")}
            </p>
            <p className="text-xs text-muted-foreground">
              {plan === "BASICO"
                ? t("upgradeDescripcion")
                : t("downgradeDescripcion")}
            </p>
          </div>
          <button
            onClick={handleCambiarPlan}
            disabled={loading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              plan === "BASICO"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border hover:bg-muted"
            }`}
          >
            {plan === "BASICO" ? (
              <>
                <ArrowUpRight className="w-4 h-4" />
                {t("mejorarPlan")}
              </>
            ) : (
              t("cambiarABasico")
            )}
          </button>
        </div>
      </div>
      )}

      {/* Comparativa rápida */}
      {!esLicenciaCompleta && (
      <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1.5">
        <div className="grid grid-cols-3 gap-2 font-semibold text-muted-foreground">
          <span></span>
          <span className="text-center">{tComp("basico")}</span>
          <span className="text-center">{tComp("profesional")}</span>
        </div>
        {[
          [tComp("features.pacientes"), tComp("features.basico25"), tComp("features.ilimitados")],
          [tComp("features.planesRecetas"), tComp("features.ilimitados"), tComp("features.ilimitados")],
          [tComp("features.portalPaciente"), "check", "check"],
          [tComp("features.generacionIA"), "no", "check"],
          [tComp("features.informesPDF"), "no", "check"],
          [tComp("features.soportePrioritario"), "no", "check"],
        ].map(([feature, basico, pro]) => (
          <div key={feature} className="grid grid-cols-3 gap-2 items-center">
            <span>{feature}</span>
            <span className="text-center">
              {basico === "check" ? (
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mx-auto" />
              ) : basico === "no" ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                basico
              )}
            </span>
            <span className="text-center">
              {pro === "check" ? (
                <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400 mx-auto" />
              ) : (
                pro
              )}
            </span>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
