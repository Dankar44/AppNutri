"use client";

import { useMemo, useState } from "react";
import { Ruler } from "lucide-react";
import { EvolucionChart } from "@/components/evolucion-chart";

export interface PerimetroPoint {
  fechaISO: string;
  cintura: number | null;
  cadera: number | null;
  brazo: number | null;
}

interface Props {
  data: PerimetroPoint[];
}

const SERIES = [
  { key: "cintura", label: "Cintura", color: "#8b5cf6" },
  { key: "cadera", label: "Cadera", color: "#ec4899" },
  { key: "brazo", label: "Brazo", color: "#14b8a6" },
] as const;

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

export function PerimetrosCard({ data }: Props) {
  const seriesDisponibles = useMemo(
    () =>
      SERIES.filter((s) =>
        data.some((p) => p[s.key] !== null && p[s.key] !== undefined)
      ),
    [data]
  );

  const [activas, setActivas] = useState<Set<string>>(
    () => new Set(seriesDisponibles.map((s) => s.key))
  );

  const chartData = useMemo(
    () =>
      data.map((p) => ({
        fecha: formatFechaCorta(p.fechaISO),
        cintura: p.cintura,
        cadera: p.cadera,
        brazo: p.brazo,
      })),
    [data]
  );

  const ultima = data[data.length - 1];

  function toggle(key: string) {
    setActivas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  if (seriesDisponibles.length === 0) {
    return null;
  }

  return (
    <section className="lg:rounded-2xl lg:border lg:border-border lg:bg-card overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 p-5 pb-2">
        <div className="flex items-start gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground shrink-0">
            <Ruler className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Perímetros</h2>
            {ultima && (
              <p className="text-[11px] text-muted-foreground">
                Última medición:{" "}
                <span className="tabular-nums">{formatFechaLarga(ultima.fechaISO)}</span>
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="px-5 pt-2 flex flex-wrap gap-2">
        {seriesDisponibles.map((s) => {
          const active = activas.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-medium border transition-all ${
                active
                  ? "bg-card shadow-sm"
                  : "bg-muted/40 opacity-60"
              }`}
              style={
                active
                  ? { borderColor: s.color, color: s.color }
                  : { borderColor: "transparent" }
              }
              aria-pressed={active}
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
              {ultima && ultima[s.key] !== null && (
                <span className="tabular-nums opacity-75">
                  {ultima[s.key]!.toFixed(0)} cm
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-2 pb-3 pt-1">
        <EvolucionChart
          data={chartData}
          height={240}
          hideLegend
          lines={seriesDisponibles
            .filter((s) => activas.has(s.key))
            .map((s) => ({
              key: s.key,
              label: s.label,
              color: s.color,
              unit: "cm",
              decimals: 1,
            }))}
        />
      </div>

      {ultima && data.length > 1 && (
        <footer className="grid grid-cols-3 border-t border-border text-center text-[11px]">
          {SERIES.map((s) => {
            const valores = data.map((p) => p[s.key]).filter((v): v is number => v !== null);
            if (valores.length === 0) {
              return (
                <div key={s.key} className="py-2.5 border-r last:border-r-0 border-border">
                  <p className="uppercase text-muted-foreground text-[10px] tracking-wide">
                    {s.label}
                  </p>
                  <p className="text-xs text-muted-foreground">—</p>
                </div>
              );
            }
            const actual = valores[valores.length - 1];
            const inicial = valores[0];
            const delta = actual - inicial;
            return (
              <div key={s.key} className="py-2.5 border-r last:border-r-0 border-border">
                <p className="uppercase text-muted-foreground text-[10px] tracking-wide">
                  {s.label}
                </p>
                <p className="font-semibold tabular-nums text-sm" style={{ color: s.color }}>
                  {actual.toFixed(1)} cm
                </p>
                {valores.length > 1 && Math.abs(delta) >= 0.1 && (
                  <p
                    className={`text-[10px] tabular-nums ${
                      delta < 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta.toFixed(1)} cm
                  </p>
                )}
              </div>
            );
          })}
        </footer>
      )}
    </section>
  );
}
