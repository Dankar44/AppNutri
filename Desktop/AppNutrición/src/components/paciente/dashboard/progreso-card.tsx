"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown, Minus, LineChart as LineChartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  Tooltip,
} from "recharts";

export interface SparkPoint {
  fechaISO: string;
  peso: number | null;
}

interface KPI {
  label: string;
  unit: string;
  actual: number | null;
  delta: number | null;
  periodoLabel: string;
  color: string;
  downIsGood: boolean;
}

interface Props {
  peso: KPI;
  imc: KPI;
  grasa: KPI;
  sparkData: SparkPoint[];
  className?: string;
}

export function ProgresoCard({ peso, imc, grasa, sparkData, className = "" }: Props) {
  const t = useTranslations("patient-portal.dashboard.progresoCard");
  const chartData = sparkData.filter((p) => p.peso !== null).map((p) => ({ peso: p.peso }));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <section data-tour="portal-progreso-card" className={`rounded-2xl border border-border bg-card overflow-hidden flex flex-col ${className}`}>
      <header className="flex items-center justify-between gap-3 p-5 pb-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground">
            <TrendingUp className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-base font-semibold">{t("title")}</h2>
            <p className="text-[11px] text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <Link
          href="/paciente/portal/evolucion"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {t("verTodo")}
          <ArrowRight className="w-3 h-3" />
        </Link>
      </header>

      <div className="px-5 pb-2 flex-1 flex flex-col justify-end">
        {chartData.length >= 2 && mounted ? (
          <div className="h-20 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={peso.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={peso.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={["dataMin - 0.5", "dataMax + 0.5"]} />
                <Tooltip content={<SparkTooltip unit={peso.unit} />} cursor={false} />
                <Area
                  type="monotone"
                  dataKey="peso"
                  stroke={peso.color}
                  strokeWidth={2}
                  fill="url(#spark-grad)"
                  dot={false}
                  activeDot={{ r: 3, fill: peso.color }}
                  isAnimationActive
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-20 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
            <LineChartIcon className="w-4 h-4 mr-1.5" />
            {t("sinDatos")}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 border-t border-border">
        <Kpi kpi={peso} />
        <Kpi kpi={imc} className="border-l border-r border-border" />
        <Kpi kpi={grasa} />
      </div>
    </section>
  );
}

function Kpi({ kpi, className }: { kpi: KPI; className?: string }) {
  const { label, unit, actual, delta, periodoLabel, color, downIsGood } = kpi;
  const esBueno = delta === null ? null : downIsGood ? delta < 0 : delta > 0;
  const esNeutro = delta !== null && Math.abs(delta) < 0.05;
  const Icon = delta === null || esNeutro ? Minus : delta < 0 ? TrendingDown : TrendingUp;
  const deltaCls = esNeutro
    ? "text-muted-foreground"
    : esBueno
    ? "text-green-600 dark:text-green-400"
    : "text-red-600 dark:text-red-400";

  return (
    <div className={`py-3 px-2 text-center ${className ?? ""}`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums mt-0.5" style={{ color: actual !== null ? color : undefined }}>
        {actual !== null ? actual.toFixed(1) : "—"}
        {actual !== null && unit && (
          <span className="text-xs font-medium text-muted-foreground ml-0.5">{unit}</span>
        )}
      </p>
      {delta !== null && !esNeutro ? (
        <p className={`text-[10px] font-semibold tabular-nums inline-flex items-center gap-0.5 ${deltaCls}`}>
          <Icon className="w-2.5 h-2.5" />
          {delta > 0 ? "+" : ""}
          {delta.toFixed(1)} {unit}
        </p>
      ) : (
        <p className="text-[10px] text-muted-foreground">{periodoLabel}</p>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SparkTooltip(props: any) {
  const { active, payload, unit } = props as {
    active?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any[];
    unit: string;
  };
  if (!active || !payload || payload.length === 0) return null;
  const val = payload[0]?.value;
  return (
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm shadow-sm px-2 py-1 text-[11px] tabular-nums">
      {typeof val === "number" ? val.toFixed(1) : val} {unit}
    </div>
  );
}
