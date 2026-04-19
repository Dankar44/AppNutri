"use client";

import { useState } from "react";
import { Flame, Droplets, Circle, Diamond, Triangle, Minus, Plus, Users } from "lucide-react";

interface Props {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  porcionesReceta: number;
}

const ROWS = [
  { key: "calorias", label: "Energía", unit: "kcal", icon: Flame, color: "#a78bfa", bg: "bg-purple-50" },
  { key: "grasas", label: "Grasa", unit: "g", icon: Droplets, color: "#f0b845", bg: "bg-yellow-50" },
  { key: "carbohidratos", label: "Hidratos", unit: "g", icon: Circle, color: "#d9956a", bg: "bg-orange-50" },
  { key: "proteinas", label: "Proteína", unit: "g", icon: Diamond, color: "#7eaadf", bg: "bg-blue-50" },
  { key: "fibra", label: "Fibra", unit: "g", icon: Triangle, color: "#4ec4a0", bg: "bg-emerald-50" },
] as const;

export function PorcionesCalculadora({
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  fibra,
  porcionesReceta,
}: Props) {
  const [porciones, setPorciones] = useState<number>(1);
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
        <h2 className="text-lg font-semibold">Calculadora de porciones</h2>
        <span className="text-xs text-muted-foreground">receta base: {porcionesReceta}</span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setPorciones((p) => clamp(p - 0.5))}
          className="w-9 h-9 shrink-0 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
          aria-label="Menos porción"
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
            porc.
          </span>
        </div>
        <button
          onClick={() => setPorciones((p) => clamp(p + 0.5))}
          className="w-9 h-9 shrink-0 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
          aria-label="Más porción"
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
            {p === porcionesReceta ? `${p} (receta)` : `${p} porc.`}
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
                {row.label}
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
