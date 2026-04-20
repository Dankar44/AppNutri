"use client";

import { useMemo, useState } from "react";
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Scale,
  Activity,
  Percent,
  type LucideIcon,
} from "lucide-react";
import { EvolucionChart } from "@/components/evolucion-chart";

const ICONS: Record<string, LucideIcon> = {
  scale: Scale,
  activity: Activity,
  percent: Percent,
};

export interface Medida {
  fechaISO: string; // YYYY-MM-DD
  peso: number | null;
  imc: number | null;
  grasa: number | null;
}

type Metric = "peso" | "imc" | "grasa";

interface Props {
  iconName: keyof typeof ICONS;
  title: string;
  metric: Metric;
  unit: string;
  decimals?: number;
  color: string;
  /** Cuando bajar es positivo (peso, grasa). true por defecto */
  downIsGood?: boolean;
  data: Medida[];
  /** Banda opcional de referencia */
  referenceArea?: { y1: number; y2: number; label?: string };
}

const RANGOS = [
  { value: "1m", label: "1M", days: 31 },
  { value: "3m", label: "3M", days: 92 },
  { value: "6m", label: "6M", days: 183 },
  { value: "1a", label: "1A", days: 366 },
  { value: "all", label: "Todo", days: Infinity },
] as const;

type Rango = typeof RANGOS[number]["value"];

function formatFechaCorta(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

function formatFechaLarga(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function EvolucionCard({
  iconName,
  title,
  metric,
  unit,
  decimals = 1,
  color,
  downIsGood = true,
  data,
  referenceArea,
}: Props) {
  const Icon = ICONS[iconName];
  const [rango, setRango] = useState<Rango>("all");

  const puntos = useMemo(() => {
    const filtrados = data.filter((m) => m[metric] !== null);
    if (rango === "all") return filtrados;
    const r = RANGOS.find((x) => x.value === rango)!;
    const corte = Date.now() - r.days * 24 * 60 * 60 * 1000;
    return filtrados.filter(
      (m) => new Date(m.fechaISO + "T12:00:00").getTime() >= corte
    );
  }, [data, rango, metric]);

  const chartData = useMemo(
    () =>
      puntos.map((p) => ({
        fecha: formatFechaCorta(p.fechaISO),
        fechaFull: formatFechaLarga(p.fechaISO),
        [metric]: p[metric],
      })),
    [puntos, metric]
  );

  const valores = puntos
    .map((p) => p[metric])
    .filter((v): v is number => v !== null);
  const actual = valores[valores.length - 1];
  const inicial = valores[0];
  const delta = actual !== undefined && inicial !== undefined ? actual - inicial : null;
  const min = valores.length > 0 ? Math.min(...valores) : null;
  const max = valores.length > 0 ? Math.max(...valores) : null;

  const deltaEsBueno =
    delta === null ? null : downIsGood ? delta < 0 : delta > 0;
  const deltaEsNeutro = delta !== null && Math.abs(delta) < Math.pow(10, -decimals) / 2;

  const rangosDisponibles = useMemo(() => {
    const span =
      data.length > 1
        ? (new Date(data[data.length - 1].fechaISO).getTime() -
            new Date(data[0].fechaISO).getTime()) /
          (24 * 60 * 60 * 1000)
        : 0;
    return RANGOS.filter((r) => r.days === Infinity || r.days <= span + 1 || span === 0);
  }, [data]);

  return (
    <section className="rounded-2xl border border-border bg-card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 p-5 pb-2">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border shrink-0"
            style={{ color }}
          >
            <Icon className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{title}</h2>
            {puntos.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                Última medición:{" "}
                <span className="tabular-nums">
                  {formatFechaLarga(puntos[puntos.length - 1].fechaISO)}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto flex-wrap">
          {actual !== undefined && (
            <div className="text-right">
              <p
                className="text-2xl font-bold leading-none tabular-nums"
                style={{ color }}
              >
                {actual.toFixed(decimals)}
                <span className="text-sm font-medium text-muted-foreground ml-0.5">
                  {unit}
                </span>
              </p>
              {delta !== null && rangosDisponibles.length > 1 && (
                <DeltaBadge
                  delta={delta}
                  decimals={decimals}
                  unit={unit}
                  good={deltaEsBueno}
                  neutral={deltaEsNeutro}
                />
              )}
            </div>
          )}
        </div>
      </header>

      {rangosDisponibles.length > 1 && (
        <div className="px-5 pt-2 flex justify-end">
          <div
            role="tablist"
            aria-label="Rango temporal"
            className="inline-flex items-center bg-muted/50 rounded-lg p-0.5 text-[11px] font-medium"
          >
            {rangosDisponibles.map((r) => {
              const active = rango === r.value;
              return (
                <button
                  key={r.value}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRango(r.value)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    active
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="px-2 pb-3 pt-1">
        {chartData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            Sin datos en este rango
          </div>
        ) : (
          <EvolucionChart
            data={chartData}
            height={240}
            hideLegend
            referenceArea={referenceArea}
            lines={[
              {
                key: metric,
                label: title,
                color,
                unit,
                decimals,
              },
            ]}
          />
        )}
      </div>

      {min !== null && max !== null && chartData.length > 1 && (
        <footer className="grid grid-cols-3 border-t border-border text-center text-[11px]">
          <StatFoot label="Mínimo" value={min} decimals={decimals} unit={unit} />
          <StatFoot label="Actual" value={actual!} decimals={decimals} unit={unit} highlight color={color} />
          <StatFoot label="Máximo" value={max} decimals={decimals} unit={unit} />
        </footer>
      )}
    </section>
  );
}

function DeltaBadge({
  delta,
  decimals,
  unit,
  good,
  neutral,
}: {
  delta: number;
  decimals: number;
  unit: string;
  good: boolean | null;
  neutral: boolean;
}) {
  let Icon = Minus;
  let cls =
    "bg-muted text-muted-foreground";

  if (!neutral) {
    Icon = delta < 0 ? TrendingDown : TrendingUp;
    if (good === true) {
      cls = "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400";
    } else if (good === false) {
      cls = "bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400";
    }
  }

  const sign = delta > 0 ? "+" : "";
  return (
    <span
      className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${cls}`}
    >
      <Icon className="w-3 h-3" />
      {sign}
      {delta.toFixed(decimals)} {unit}
    </span>
  );
}

function StatFoot({
  label,
  value,
  decimals,
  unit,
  highlight,
  color,
}: {
  label: string;
  value: number;
  decimals: number;
  unit: string;
  highlight?: boolean;
  color?: string;
}) {
  return (
    <div className="py-2.5 border-r last:border-r-0 border-border">
      <p className="uppercase text-muted-foreground text-[10px] tracking-wide">
        {label}
      </p>
      <p
        className={`font-semibold tabular-nums ${highlight ? "text-sm" : "text-xs text-foreground/80"}`}
        style={highlight && color ? { color } : undefined}
      >
        {value.toFixed(decimals)} {unit}
      </p>
    </div>
  );
}
