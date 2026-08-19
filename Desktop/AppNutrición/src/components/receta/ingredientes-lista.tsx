"use client";

import { useTranslations } from "next-intl";
import { Droplets, Circle, Diamond, Flame, Carrot, ListChecks } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { calcularMacrosPorcion, convertirAGramos } from "@/lib/macros";
import { formatQuantity } from "@/lib/units";
import { ingredientesDeReceta } from "@/lib/receta-porciones";

const MACRO_COLORS = {
  grasas: "#f0b845",
  carbohidratos: "#d9956a",
  proteinas: "#7eaadf",
};

export interface IngredienteItem {
  id: string;
  cantidad: number;
  unidad?: string;
  alimento: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    fibra: number;
    porcion?: number;
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
  const t = useTranslations("recipes.ingredientes");
  const searchParams = useSearchParams();
  const urlPorcionesRaw = searchParams.get("porciones");
  const urlPorcionesNum = urlPorcionesRaw ? Number(urlPorcionesRaw) : NaN;
  const racionesPedidas = Number.isFinite(urlPorcionesNum) && urlPorcionesNum > 0 ? urlPorcionesNum : porciones;
  // Misma regla que el plan y el PDF (src/lib/receta-porciones.ts): un plato se escala a
  // las raciones pedidas; una tanda se muestra entera, porque no se cocina 1/8 de bizcocho.
  // Sin esto la ficha decía "31 g de harina" donde el PDF dice 250 g para el mismo plato.
  const { factor, rindeRaciones } = ingredientesDeReceta(racionesPedidas, porciones);
  const displayPorciones = rindeRaciones ?? racionesPedidas;

  const totalPeso = ingredientes.reduce((acc, i) => acc + convertirAGramos(i.cantidad || 0, i.unidad || "GRAMOS", i.alimento.porcion || 100), 0) * factor;
  const pasos = instrucciones ? parseInstrucciones(instrucciones) : [];

  return (
    <section className="bg-card rounded-xl border border-border p-6 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Carrot className="w-5 h-5 text-primary" />
              {t("titulo")}
              <span className="text-muted-foreground font-normal text-sm">
                ({ingredientes.length})
              </span>
            </h2>
            <span className="text-xs text-muted-foreground">
              {t("gTotales", { peso: Math.round(totalPeso) })}
              {displayPorciones > 1 ? ` · ${t("gPorPorcion", { peso: Math.round(totalPeso / displayPorciones) })}` : ""}
            </span>
          </div>

          {ingredientes.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {t("sinIngredientes")}
            </p>
          ) : (
            <div className="divide-y divide-border/50">
              {ingredientes.map((ing) => {
                const scaledCantidad = ing.cantidad * factor;
                const gramos = convertirAGramos(scaledCantidad, ing.unidad || "GRAMOS", ing.alimento.porcion || 100);
                const macros = calcularMacrosPorcion(
                  {
                    calorias: ing.alimento.calorias,
                    proteinas: ing.alimento.proteinas,
                    carbohidratos: ing.alimento.carbohidratos,
                    grasas: ing.alimento.grasas,
                    fibra: ing.alimento.fibra,
                  },
                  gramos,
                );
                return (
                  <div key={ing.id} className="flex flex-wrap items-start gap-3 py-3">
                    <div className="min-w-0 flex-1 basis-48">
                      <p className="text-sm font-medium whitespace-normal break-words">{ing.alimento.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatQuantity(scaledCantidad, ing.unidad || "GRAMOS")}
                        {displayPorciones > 1
                          ? ` · ${t("gPorPorcion", { peso: Math.round(gramos / displayPorciones) })}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex max-w-full shrink-0 flex-wrap items-center justify-end gap-1.5">
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium tabular-nums bg-purple-100/60 text-purple-700 dark:text-purple-400">
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
              {t("instrucciones")}
            </h2>
            {pasos.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {pasos.length !== 1 ? t("pasoCountPlural", { count: pasos.length }) : t("pasoCount", { count: pasos.length })}
              </span>
            )}
          </div>
          {pasos.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {t("sinInstrucciones")}
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
