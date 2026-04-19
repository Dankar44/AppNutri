"use client";

import { Droplets, Circle, Diamond, Flame, Carrot, ListChecks } from "lucide-react";
import { calcularMacrosPorcion } from "@/lib/macros";

const MACRO_COLORS = {
  grasas: "#f0b845",
  carbohidratos: "#d9956a",
  proteinas: "#7eaadf",
};

export interface IngredienteItem {
  id: string;
  cantidad: number;
  alimento: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    fibra: number;
  };
}

interface Props {
  ingredientes: IngredienteItem[];
  porciones: number;
  instrucciones?: string | null;
}

function parseInstrucciones(text: string): string[] {
  const lineas = text
    .split(/\r?\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^\s*(?:\d+[.)\-:]|[-•*])\s*/, ""));
  return lineas;
}

export function IngredientesLista({ ingredientes, porciones, instrucciones }: Props) {
  const totalPeso = ingredientes.reduce((acc, i) => acc + (i.cantidad || 0), 0);
  const pasos = instrucciones ? parseInstrucciones(instrucciones) : [];

  return (
    <section className="bg-card rounded-xl border border-border p-6 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Carrot className="w-5 h-5 text-primary" />
              Ingredientes
              <span className="text-muted-foreground font-normal text-sm">
                ({ingredientes.length})
              </span>
            </h2>
            <span className="text-xs text-muted-foreground">
              {Math.round(totalPeso)} g totales
              {porciones > 1 ? ` · ${Math.round(totalPeso / porciones)} g / porción` : ""}
            </span>
          </div>

          {ingredientes.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Esta receta no tiene ingredientes.
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {ingredientes.map((ing) => {
                const macros = calcularMacrosPorcion(
                  {
                    calorias: ing.alimento.calorias,
                    proteinas: ing.alimento.proteinas,
                    carbohidratos: ing.alimento.carbohidratos,
                    grasas: ing.alimento.grasas,
                    fibra: ing.alimento.fibra,
                  },
                  ing.cantidad,
                );
                return (
                  <div key={ing.id} className="flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ing.alimento.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {ing.cantidad} g
                        {porciones > 1
                          ? ` · ${Math.round(ing.cantidad / porciones)} g / porción`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums"
                        style={{ color: MACRO_COLORS.grasas, background: MACRO_COLORS.grasas + "22" }}
                      >
                        <Droplets className="w-2.5 h-2.5" />
                        {macros.grasas.toFixed(1)}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums"
                        style={{
                          color: MACRO_COLORS.carbohidratos,
                          background: MACRO_COLORS.carbohidratos + "22",
                        }}
                      >
                        <Circle className="w-2.5 h-2.5" />
                        {macros.carbohidratos.toFixed(1)}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums"
                        style={{
                          color: MACRO_COLORS.proteinas,
                          background: MACRO_COLORS.proteinas + "22",
                        }}
                      >
                        <Diamond className="w-2.5 h-2.5" />
                        {macros.proteinas.toFixed(1)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums bg-purple-100/60 text-purple-700">
                        <Flame className="w-2.5 h-2.5" />
                        {Math.round(macros.calorias)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:border-l lg:border-border/60 lg:pl-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary" />
              Instrucciones
            </h2>
            {pasos.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {pasos.length} paso{pasos.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {pasos.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Esta receta todavía no tiene instrucciones.
            </p>
          ) : (
            <ol className="space-y-3">
              {pasos.map((paso, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-semibold tabular-nums">
                    {idx + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-foreground/90">{paso}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
