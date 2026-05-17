"use client";

import { MacroBadges } from "@/components/macro-badge";
import { calcularMacrosPorcion, sumarMacros, convertirAGramos } from "@/lib/macros";
import { formatQuantity } from "@/lib/pdf/generate-plan-pdf";
import { Printer, CookingPot, ExternalLink, Image as ImageLinkIcon, Leaf } from "lucide-react";
import { useTranslations } from "next-intl";

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
  unidad?: string;
  alimento: { nombre: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number; porcion?: number; enlaceProducto?: string | null; imagenUrl?: string | null } | null;
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
  brandName?: string | null;
  dietistaNombre?: string | null;
}

function RecetaInline({ receta, cantidad }: { receta: RecetaDetalle; cantidad: number }) {
  const t = useTranslations("diets");
  return (
    <div className="rounded-lg border border-purple-200 dark:border-purple-500/30 bg-purple-50/30 overflow-hidden">
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-1.5">
          <CookingPot className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-200">{receta.nombre}</span>
          <span className="text-xs text-purple-500">({t("readOnly.portions", { count: cantidad })})</span>
        </div>

        {receta.descripcion && (
          <p className="text-xs text-purple-700 dark:text-purple-400 italic mb-2">{receta.descripcion}</p>
        )}

        {receta.ingredientes.length > 0 && (
          <div className="ml-5 space-y-0.5">
            {receta.ingredientes.map((ing, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-purple-800 dark:text-purple-300">{ing.alimento.nombre}</span>
                <span className="text-purple-500">{formatQuantity(ing.cantidad, ing.unidad || "GRAMOS")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PlanReadOnly({ nombre, pacienteNombre, dias, showPrint = true, brandName, dietistaNombre }: PlanReadOnlyProps) {
  const t = useTranslations("diets");
  const showBranding = brandName || dietistaNombre;

  return (
    <div>
      {showBranding && (
        <div className="text-center mb-6 pb-4 border-b border-border">
          {brandName && (
            <p className="text-lg font-semibold text-foreground">{brandName}</p>
          )}
          {dietistaNombre && (
            <p className="text-sm text-muted-foreground">{dietistaNombre}</p>
          )}
        </div>
      )}

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
            {t("readOnly.print")}
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
                  convertirAGramos(a.cantidad, a.unidad || "GRAMOS", a.alimento.porcion || 100)
                );
              }
              return { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 };
            })
          );

          return (
            <div key={dia.dia} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                <h3 className="font-semibold">{t(`editor.dayLabels.${dia.dia}` as never) || dia.dia}</h3>
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
                      {t(`comidaSlot.tipoLabels.${comida.tipo}` as never) || comida.tipo}
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
                            return <RecetaInline key={ai} receta={a.receta} cantidad={a.cantidad} />;
                          }
                          return (
                            <div key={ai} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-1">
                                {a.alimento?.nombre || t("readOnly.noName")}
                                {a.alimento?.enlaceProducto && (
                                  <a href={a.alimento.enlaceProducto} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-3 h-3 text-primary/60 hover:text-primary" />
                                  </a>
                                )}
                                {a.alimento?.imagenUrl && (
                                  <a href={a.alimento.imagenUrl} target="_blank" rel="noopener noreferrer">
                                    <ImageLinkIcon className="w-3 h-3 text-violet-400 hover:text-violet-600" />
                                  </a>
                                )}
                              </span>
                              <span className="text-muted-foreground text-xs">{formatQuantity(a.cantidad, a.unidad || "GRAMOS")}</span>
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

      <div className="mt-10 pt-6 border-t border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Leaf className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold text-primary">Annonia</span>
        </div>
        <p className="text-xs text-muted-foreground">{t("readOnly.generatedWith")}</p>
      </div>
    </div>
  );
}
