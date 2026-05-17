"use client";

import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProgressRing } from "@/components/paciente/seguimiento/progress-ring";
import { formatMlCorto } from "@/lib/seguimiento";

interface Props {
  comidasCumplidas: number;
  comidasTotal: number;
  aguaML: number;
  aguaObjetivo: number;
  ejercicio: boolean;
  ejercicioMinutos: number;
  haRegistrado: boolean;
  racha?: number;
  className?: string;
}

export function HoyCard({
  comidasCumplidas,
  comidasTotal,
  aguaML,
  aguaObjetivo,
  ejercicio,
  ejercicioMinutos,
  haRegistrado,
  racha,
  className = "",
}: Props) {
  const t = useTranslations("patient-portal.dashboard.hoyCard");
  const comidasPct = comidasTotal > 0 ? (comidasCumplidas / comidasTotal) * 100 : 0;
  const aguaPct = aguaObjetivo > 0 ? (aguaML / aguaObjetivo) * 100 : 0;
  const ejercicioPct = ejercicio ? Math.min(100, (ejercicioMinutos / 30) * 100) : 0;
  const globalPct = Math.round((comidasPct + aguaPct + ejercicioPct) / 3);

  const ctaLabel = haRegistrado ? t("continuar") : t("registrarDia");

  return (
    <section data-tour="portal-hoy-card" className={`rounded-2xl border border-border bg-card overflow-hidden flex flex-col ${className}`}>
      <header className="flex items-center justify-between gap-3 p-5 pb-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground">
            <BookOpen className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-base font-semibold">{t("title")}</h2>
            <p className="text-[11px] text-muted-foreground">
              {haRegistrado ? t("haRegistrado") : t("noHaRegistrado")}
            </p>
          </div>
        </div>
        {typeof racha === "number" && racha > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-2.5 py-0.5 text-[11px] font-semibold">
            {t("diasSeguidos", { count: racha })}
          </span>
        )}
      </header>

      <div className="px-5 pb-2 flex items-center gap-5">
        <ProgressRing
          value={globalPct}
          max={100}
          size={104}
          stroke={9}
          color="text-primary"
          bg="text-primary/10"
          label={`${globalPct}% ${t("delDia")}`}
        >
          <div className="text-center">
            <p className="text-xl font-bold leading-none tabular-nums">{globalPct}%</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">
              {t("delDia")}
            </p>
          </div>
        </ProgressRing>

        <div className="flex-1 space-y-2.5">
          <Metric
            label={t("comidas")}
            value={`${comidasCumplidas}/${comidasTotal}`}
            pct={comidasPct}
            tint="green"
          />
          <Metric
            label={t("agua")}
            value={formatMlCorto(aguaML)}
            pct={aguaPct}
            tint="blue"
          />
          <Metric
            label={t("ejercicio")}
            value={ejercicio ? `${ejercicioMinutos} min` : "—"}
            pct={ejercicioPct}
            tint="emerald"
          />
        </div>
      </div>

      <div className="p-5 pt-3 mt-auto">
        <Link
          href="/paciente/portal/seguimiento"
          className="inline-flex items-center justify-center gap-1.5 w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 text-sm font-medium transition-colors"
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  pct,
  tint,
}: {
  label: string;
  value: string;
  pct: number;
  tint: "green" | "blue" | "emerald";
}) {
  const bar = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
  }[tint];
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className="text-xs font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${bar}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
