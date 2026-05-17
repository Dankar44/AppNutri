"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Flame, Droplets, Circle, Diamond, Triangle, Minus, Plus, Users } from "lucide-react";

interface Props {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  porcionesReceta: number;
}

const ROW_DEFS = [
  { key: "calorias", labelKey: "energia", unit: "kcal", icon: Flame, color: "#a78bfa", bg: "bg-purple-50 dark:bg-purple-500/10" },
  { key: "grasas", labelKey: "grasa", unit: "g", icon: Droplets, color: "#f0b845", bg: "bg-yellow-50 dark:bg-yellow-500/10" },
  { key: "carbohidratos", labelKey: "hidratos", unit: "g", icon: Circle, color: "#d9956a", bg: "bg-orange-50 dark:bg-orange-500/10" },
  { key: "proteinas", labelKey: "proteina", unit: "g", icon: Diamond, color: "#7eaadf", bg: "bg-blue-50 dark:bg-blue-500/10" },
  { key: "fibra", labelKey: "fibra", unit: "g", icon: Triangle, color: "#4ec4a0", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
] as const;

export function PorcionesCalculadora({
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  fibra,
  porcionesReceta,
}: Props) {
  const t = useTranslations("recipes.porcionesCalc");
  const searchParams = useSearchParams();
  const porcionesUrl = searchParams.get("porciones");
  const [porciones, setPorciones] = useState<number>(() =>
    porcionesUrl ? Number(porcionesUrl) : 1
  );

  useEffect(() => {
    if (porcionesUrl) setPorciones(Number(porcionesUrl));
  }, [porcionesUrl]);

  const presets = Array.from(new Set([1, 2, 4, porcionesReceta])).sort((a, b) => a - b);

  const clamp = (n: number) => Math.max(0.5, Math.min(50, n));

  const values: Record<string, number> = {
    calorias: calorias * porciones,
    grasas: grasas * porciones,
    carbohidratos: carbohidratos * porciones,
    proteinas: proteinas * porciones,
    fibra: fibra * porciones,
  };

  return (
    <section className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <span className="text-xs text-muted-foreground">{t("recetaBase", { count: porcionesReceta })}</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setPorciones((p) => clamp(p - 0.5))}
          className="w-9 h-9 shrink-0 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
          aria-label={t("menosPorcion")}
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="flex-1 relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="number" inputMode="decimal"
            min={0.5}
            max={50}
            step={0.5}
            value={porciones}
            onChange={(e) => setPorciones(clamp(Number(e.target.value) || 1))}
            className="w-full h-11 pl-10 pr-12 rounded-lg border border-border bg-background text-center text-lg font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            {t("porc")}
          </span>
        </div>
        <button
          onClick={() => setPorciones((p) => clamp(p + 0.5))}
          className="w-9 h-9 shrink-0 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
          aria-label={t("masPorcion")}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setPorciones(p)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              porciones === p
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            {p === porcionesReceta ? t("recetaPreset", { count: p }) : t("porcPreset", { count: p })}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {ROW_DEFS.map((row) => {
          const Icon = row.icon;
          const v = values[row.key];
          return (
            <div
              key={row.key}
              className={`flex items-center justify-between gap-3 ${row.bg} rounded-lg px-3 py-2.5`}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon className="w-3.5 h-3.5" style={{ color: row.color }} />
                {t(`macroLabels.${row.labelKey}`)}
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
