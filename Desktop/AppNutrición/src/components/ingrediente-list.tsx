"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AlimentoSearch } from "./alimento-search";
import { MacroBadges } from "./macro-badge";
import { calcularMacrosPorcion, convertirAGramos, type Macros } from "@/lib/macros";
import { getCantidadDefault, UNIDAD_LABELS } from "@/lib/units";
import { buscarAlimentosParaReceta } from "@/app/actions/recetas";

export interface IngredienteItem {
  alimentoId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  porcion?: number;
  macrosPor100g: Macros;
}

interface IngredienteListProps {
  ingredientes: IngredienteItem[];
  onChange: (ingredientes: IngredienteItem[]) => void;
  porciones: number;
}

export function IngredienteList({
  ingredientes,
  onChange,
  porciones,
}: IngredienteListProps) {
  const t = useTranslations("recipes");
  function addIngrediente(alimento: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    porcion: number;
    unidad: string;
  }) {
    onChange([
      ...ingredientes,
      {
        alimentoId: alimento.id,
        nombre: alimento.nombre,
        cantidad: getCantidadDefault(alimento.unidad, alimento.porcion),
        unidad: alimento.unidad,
        porcion: alimento.porcion,
        macrosPor100g: {
          calorias: alimento.calorias,
          proteinas: alimento.proteinas,
          carbohidratos: alimento.carbohidratos,
          grasas: alimento.grasas,
          fibra: 0,
        },
      },
    ]);
  }

  function updateCantidad(index: number, cantidad: number) {
    const updated = [...ingredientes];
    updated[index] = { ...updated[index], cantidad };
    onChange(updated);
  }

  function removeIngrediente(index: number) {
    onChange(ingredientes.filter((_, i) => i !== index));
  }

  const pesoTotal = ingredientes.reduce((sum, ing) => sum + convertirAGramos(ing.cantidad || 0, ing.unidad, ing.porcion || 100), 0);
  void porciones;

  return (
    <div className="space-y-4">
      <AlimentoSearch
        onSelect={addIngrediente}
        placeholder={t("ingredientes.buscarParaAnadir")}
        searchAction={buscarAlimentosParaReceta}
      />

      {ingredientes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("ingredientes.anadirArriba")}
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {ingredientes.map((ing, index) => {
              const gramos = convertirAGramos(ing.cantidad, ing.unidad, ing.porcion || 100);
              const macros = calcularMacrosPorcion(ing.macrosPor100g, gramos);
              const pct = pesoTotal > 0 ? (gramos / pesoTotal) * 100 : 0;
              return (
                <div
                  key={`${ing.alimentoId}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{ing.nombre}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-semibold tabular-nums text-muted-foreground">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1">
                      <MacroBadges
                        calorias={macros.calorias}
                        proteinas={macros.proteinas}
                        carbohidratos={macros.carbohidratos}
                        grasas={macros.grasas}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number" inputMode="decimal"
                      value={ing.cantidad}
                      onChange={(e) =>
                        updateCantidad(index, parseFloat(e.target.value) || 0)
                      }
                      min={0}
                      max={10000}
                      step="1"
                      className="w-20 px-2 py-1 text-sm rounded border border-border bg-background text-center"
                    />
                    <span className="text-xs text-muted-foreground">{UNIDAD_LABELS[ing.unidad] || "g"}</span>
                    <button
                      onClick={() => removeIngrediente(index)}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/15 text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-3 text-xs text-muted-foreground">
            <span>{t("ingredientes.totalReceta")}</span>
            <span className="font-semibold tabular-nums">{t("ingredientes.totalRecetaPeso", { peso: Math.round(pesoTotal) })}</span>
          </div>
        </>
      )}
    </div>
  );
}
