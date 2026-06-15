"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Flame, Droplets, Circle, Diamond, Triangle, Minus, Plus } from "lucide-react";
import { CantidadInput } from "@/components/cantidad-input";

interface Props {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  porcionDefault: number;
}

const ROWS = [
  { key: "calorias", labelKey: "energia" as const, unit: "kcal", icon: Flame, color: "#a78bfa", bg: "bg-purple-50 dark:bg-purple-500/10" },
  { key: "grasas", labelKey: "grasa" as const, unit: "g", icon: Droplets, color: "#f0b845", bg: "bg-yellow-50 dark:bg-yellow-500/10" },
  { key: "carbohidratos", labelKey: "hidratos" as const, unit: "g", icon: Circle, color: "#d9956a", bg: "bg-orange-50 dark:bg-orange-500/10" },
  { key: "proteinas", labelKey: "proteina" as const, unit: "g", icon: Diamond, color: "#7eaadf", bg: "bg-blue-50 dark:bg-blue-500/10" },
  { key: "fibra", labelKey: "fibra" as const, unit: "g", icon: Triangle, color: "#4ec4a0", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
] as const;

const PRESETS = [50, 100, 150, 200];

export function PorcionCalculator({ calorias, proteinas, carbohidratos, grasas, fibra, porcionDefault }: Props) {
  const t = useTranslations("foods");
  const searchParams = useSearchParams();
  const cantidadUrl = searchParams.get("cantidad");
  const [gramos, setGramos] = useState<number>(() =>
    cantidadUrl ? Number(cantidadUrl) : (porcionDefault || 100)
  );

  useEffect(() => {
    if (cantidadUrl) setGramos(Number(cantidadUrl));
  }, [cantidadUrl]);

  const factor = gramos / 100;
  const values: Record<string, number> = {
    calorias: calorias * factor,
    grasas: grasas * factor,
    carbohidratos: carbohidratos * factor,
    proteinas: proteinas * factor,
    fibra: fibra * factor,
  };

  const clamp = (n: number) => Math.max(0, Math.min(10000, n));

  return (
    <section className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t("calculadora.calculadoraPorcion")}</h2>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setGramos((g) => clamp(g - 10))}
          className="w-9 h-9 shrink-0 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
          aria-label={t("calculadora.restar10g")}
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="flex-1 relative">
          <CantidadInput
            min={0}
            max={10000}
            value={gramos}
            onChange={setGramos}
            className="w-full h-11 px-4 pr-10 rounded-lg border border-border bg-background text-center text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">g</span>
        </div>
        <button
          onClick={() => setGramos((g) => clamp(g + 10))}
          className="w-9 h-9 shrink-0 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
          aria-label={t("calculadora.sumar10g")}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setGramos(p)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              gramos === p
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {p}g
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {ROWS.map((row) => {
          const Icon = row.icon;
          const v = values[row.key];
          return (
            <div
              key={row.key}
              className={`flex items-center justify-between gap-3 ${row.bg} rounded-lg px-3 py-2.5`}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon className="w-3.5 h-3.5" style={{ color: row.color }} />
                {t(`macros.${row.labelKey}`)}
              </div>
              <div className="tabular-nums">
                <span className="text-base font-bold" style={{ color: row.color }}>
                  {row.key === "calorias" ? Math.round(v) : (Math.round(v * 10) / 10).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground ml-1">{row.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
