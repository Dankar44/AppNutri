"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { AlimentoSearch } from "./alimento-search";
import { MacroBadges } from "./macro-badge";
import { MacroResumen } from "./macro-resumen";
import { calcularMacrosPorcion, sumarMacros, type Macros } from "@/lib/macros";
import { buscarAlimentosParaReceta } from "@/app/actions/recetas";

export interface IngredienteItem {
  alimentoId: string;
  nombre: string;
  cantidad: number;
  unidad: string;
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
  function addIngrediente(alimento: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    porcion: number;
  }) {
    onChange([
      ...ingredientes,
      {
        alimentoId: alimento.id,
        nombre: alimento.nombre,
        cantidad: alimento.porcion,
        unidad: "GRAMOS",
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

  const macrosTotales = sumarMacros(
    ingredientes.map((ing) =>
      calcularMacrosPorcion(ing.macrosPor100g, ing.cantidad)
    )
  );

  const macrosPorPorcion = porciones > 0
    ? {
        calorias: Math.round((macrosTotales.calorias / porciones) * 10) / 10,
        proteinas: Math.round((macrosTotales.proteinas / porciones) * 10) / 10,
        carbohidratos: Math.round((macrosTotales.carbohidratos / porciones) * 10) / 10,
        grasas: Math.round((macrosTotales.grasas / porciones) * 10) / 10,
        fibra: Math.round((macrosTotales.fibra / porciones) * 10) / 10,
      }
    : macrosTotales;

  return (
    <div className="space-y-4">
      <AlimentoSearch
        onSelect={addIngrediente}
        placeholder="Buscar alimento para añadir..."
        searchAction={buscarAlimentosParaReceta}
      />

      {ingredientes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Añade ingredientes buscando alimentos arriba
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {ingredientes.map((ing, index) => {
              const macros = calcularMacrosPorcion(ing.macrosPor100g, ing.cantidad);
              return (
                <div
                  key={`${ing.alimentoId}-${index}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ing.nombre}</p>
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
                      type="number"
                      value={ing.cantidad}
                      onChange={(e) =>
                        updateCantidad(index, parseFloat(e.target.value) || 0)
                      }
                      min="0"
                      step="1"
                      className="w-20 px-2 py-1 text-sm rounded border border-border bg-background text-center"
                    />
                    <span className="text-xs text-muted-foreground">g</span>
                    <button
                      onClick={() => removeIngrediente(index)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <MacroResumen
              label={`Macros por porción (${porciones} porc.)`}
              calorias={macrosPorPorcion.calorias}
              proteinas={macrosPorPorcion.proteinas}
              carbohidratos={macrosPorPorcion.carbohidratos}
              grasas={macrosPorPorcion.grasas}
              fibra={macrosPorPorcion.fibra}
            />
          </div>
        </>
      )}
    </div>
  );
}
