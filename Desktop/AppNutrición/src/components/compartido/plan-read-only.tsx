"use client";

import { useState } from "react";
import { MacroBadges } from "@/components/macro-badge";
import { calcularMacrosPorcion, sumarMacros } from "@/lib/macros";
import { Printer, CookingPot, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const DIA_LABELS: Record<string, string> = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles",
  JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo",
};

const TIPO_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno", MEDIA_MANANA: "Media mañana", ALMUERZO: "Almuerzo",
  MERIENDA: "Merienda", CENA: "Cena", RECENA: "Recena",
};

interface RecetaDetalle {
  nombre: string;
  descripcion?: string | null;
  instrucciones?: string | null;
  porciones: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  ingredientes: { alimento: { nombre: string }; cantidad: number; unidad: string }[];
}

interface AlimentoData {
  cantidad: number;
  alimento: { nombre: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number; enlaceProducto?: string | null } | null;
  receta: RecetaDetalle | null;
}

interface ComidaData {
  tipo: string;
  descripcion?: string | null;
  alimentos: AlimentoData[];
}

interface DiaData {
  dia: string;
  comidas: ComidaData[];
}

interface PlanReadOnlyProps {
  nombre: string;
  pacienteNombre?: string;
  dias: DiaData[];
  showPrint?: boolean;
}

function RecetaDesplegable({ receta, cantidad }: { receta: RecetaDetalle; cantidad: number }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-500/30 bg-purple-50/30 overflow-hidden">
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-500/15 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <CookingPot className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-200">{receta.nombre}</span>
          <span className="text-xs text-purple-500">({cantidad} porc.)</span>
        </div>
        {abierto ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
      </button>

      {abierto && (
        <div className="px-3 pb-3 border-t border-purple-100 pt-2 space-y-2">
          {receta.descripcion && (
            <p className="text-xs text-purple-700 dark:text-purple-400 italic">{receta.descripcion}</p>
          )}

          <div>
            <p className="text-[11px] sm:text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">Ingredientes</p>
            <div className="space-y-0.5">
              {receta.ingredientes.map((ing, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-purple-800 dark:text-purple-300">{ing.alimento.nombre}</span>
                  <span className="text-purple-500">{ing.cantidad}g</span>
                </div>
              ))}
            </div>
          </div>

          {receta.instrucciones && (
            <div>
              <p className="text-[11px] sm:text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase mb-1">Preparación</p>
              <p className="text-xs text-purple-800 dark:text-purple-300 whitespace-pre-wrap">{receta.instrucciones}</p>
            </div>
          )}

          <div className="pt-1">
            <MacroBadges
              calorias={receta.calorias}
              proteinas={receta.proteinas}
              carbohidratos={receta.carbohidratos}
              grasas={receta.grasas}
            />
            <p className="text-[11px] sm:text-[10px] text-purple-500 mt-0.5">Macros por porción</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function PlanReadOnly({ nombre, pacienteNombre, dias, showPrint = true }: PlanReadOnlyProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{nombre}</h2>
          {pacienteNombre && (
            <p className="text-sm text-muted-foreground">{pacienteNombre}</p>
          )}
        </div>
        {showPrint && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium print:hidden"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        )}
      </div>

      <div className="space-y-6">
        {dias.map((dia) => {
          const todosAlimentos = dia.comidas.flatMap((c) => c.alimentos);
          const macrosDia = sumarMacros(
            todosAlimentos.map((a) => {
              if (a.receta) {
                return {
                  calorias: Math.round(a.receta.calorias * a.cantidad * 10) / 10,
                  proteinas: Math.round(a.receta.proteinas * a.cantidad * 10) / 10,
                  carbohidratos: Math.round(a.receta.carbohidratos * a.cantidad * 10) / 10,
                  grasas: Math.round(a.receta.grasas * a.cantidad * 10) / 10,
                  fibra: 0,
                };
              }
              if (a.alimento) {
                return calcularMacrosPorcion(
                  { calorias: a.alimento.calorias, proteinas: a.alimento.proteinas, carbohidratos: a.alimento.carbohidratos, grasas: a.alimento.grasas, fibra: 0 },
                  a.cantidad
                );
              }
              return { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 };
            })
          );

          return (
            <div key={dia.dia} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                <h3 className="font-semibold">{DIA_LABELS[dia.dia] || dia.dia}</h3>
                <MacroBadges
                  calorias={macrosDia.calorias}
                  proteinas={macrosDia.proteinas}
                  carbohidratos={macrosDia.carbohidratos}
                  grasas={macrosDia.grasas}
                />
              </div>
              <div className="divide-y divide-border">
                {dia.comidas.map((comida, ci) => (
                  <div key={ci} className="px-4 py-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                      {TIPO_LABELS[comida.tipo] || comida.tipo}
                    </h4>
                    {comida.descripcion && (
                      <p className="text-xs text-muted-foreground italic mb-2">{comida.descripcion}</p>
                    )}
                    {comida.alimentos.length === 0 ? (
                      <p className="text-xs text-muted-foreground">-</p>
                    ) : (
                      <div className="space-y-1.5">
                        {comida.alimentos.map((a, ai) => {
                          if (a.receta) {
                            return <RecetaDesplegable key={ai} receta={a.receta} cantidad={a.cantidad} />;
                          }
                          return (
                            <div key={ai} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1">
                                {a.alimento?.nombre || "Sin nombre"}
                                {a.alimento?.enlaceProducto && (
                                  <a href={a.alimento.enlaceProducto} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3 text-primary/60 hover:text-primary" />
                                  </a>
                                )}
                              </span>
                              <span className="text-muted-foreground text-xs">{a.cantidad}g</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
