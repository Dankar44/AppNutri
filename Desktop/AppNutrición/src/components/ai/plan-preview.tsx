"use client";

import type { AIPlanGenerado, AIDia } from "@/lib/ai/types";
import { formatQuantity } from "@/lib/units";
import { useTranslations } from "next-intl";

const TIPOS_ORDEN = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"];

function calcularMacrosDia(dia: AIDia) {
  let cal = 0, prot = 0, carb = 0, gras = 0;
  for (const c of (dia.comidas || [])) {
    for (const a of (c.alimentos || [])) {
      const e = a.estimacion || {};
      cal += e.calorias || 0;
      prot += e.proteinas || 0;
      carb += e.carbohidratos || 0;
      gras += e.grasas || 0;
    }
  }
  return { cal: Math.round(cal), prot: Math.round(prot), carb: Math.round(carb), gras: Math.round(gras) };
}

interface PlanPreviewProps {
  plan: AIPlanGenerado;
  onAccept: () => void;
  onReject: () => void;
  loading?: boolean;
}

export function PlanPreview({ plan, onAccept, onReject, loading }: PlanPreviewProps) {
  const t = useTranslations("diets");
  const tipoEmojis = t.raw("planPreview.tipoEmojis") as Record<string, string>;
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-3 border-b border-border -mx-1 px-1">
        <div>
          <h3 className="text-lg font-bold">{plan.nombre}</h3>
          <p className="text-sm text-muted-foreground">{t("planPreview.reviewBefore")}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReject}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
          >
            {t("planPreview.discard")}
          </button>
          <button
            onClick={onAccept}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? t("planPreview.creating") : t("planPreview.acceptAndCreate")}
          </button>
        </div>
      </div>

      {/* Grid semanal — 3 dias visibles, scroll horizontal */}
      <div className="overflow-x-auto pb-4 scroll-smooth">
        <div className="flex gap-4" style={{ width: `calc(((100% + 1rem) / 3) * 7 - 1rem)` }}>
          {plan.dias.map((dia) => {
            const macros = calcularMacrosDia(dia);
            const comidasMap = new Map(dia.comidas.map((c) => [c.tipo, c]));

            return (
              <div key={dia.dia} className="flex-1 min-w-0 bg-card rounded-xl border border-border overflow-hidden flex flex-col">
                {/* Header del dia */}
                <div className="text-center font-semibold text-sm py-2.5 bg-muted/50 border-b border-border">
                  {t(`editor.dayLabels.${dia.dia}` as never) || dia.dia}
                </div>

                {/* Comidas */}
                <div className="flex-1 p-3 space-y-3">
                  {TIPOS_ORDEN.map((tipo) => {
                    const comida = comidasMap.get(tipo);
                    const tieneAlimentos = comida && comida.alimentos.length > 0;

                    return (
                      <div key={tipo} className={`rounded-lg p-2.5 ${tieneAlimentos ? "bg-muted/30" : ""}`}>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 mb-1">
                          <span>{tipoEmojis[tipo] ?? ""}</span>
                          {t(`comidaSlot.tipoLabels.${tipo}` as never)}
                        </p>
                        {tieneAlimentos ? (
                          <>
                            <p className="text-sm font-medium text-foreground mb-1.5">
                              {comida.descripcion || comida.alimentos.map((a) => a.nombre).join(" con ")}
                            </p>
                            <div className="space-y-0.5">
                              {comida.alimentos.map((a, i) => (
                                <p key={i} className="text-xs text-muted-foreground">
                                  {a.nombre} · {formatQuantity(a.cantidadGramos, "GRAMOS")}
                                </p>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground/50">—</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Resumen macros */}
                <div className="border-t border-border px-3 py-2.5 bg-muted/20">
                  <div className="text-center mb-1">
                    <span className="text-base font-bold text-amber-600 dark:text-amber-400">{macros.cal}</span>
                    <span className="text-xs text-muted-foreground ml-0.5">kcal</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-blue-600 dark:text-blue-400 font-medium">P: {macros.prot}g</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">C: {macros.carb}g</span>
                    <span className="text-red-500 font-medium">G: {macros.gras}g</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
