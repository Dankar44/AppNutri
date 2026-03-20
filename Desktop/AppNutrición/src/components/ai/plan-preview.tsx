"use client";

import { MacroBadges } from "@/components/macro-badge";
import type { AIPlanGenerado, AIDia } from "@/lib/ai/types";

const DIA_LABELS: Record<string, string> = {
  LUNES: "Lun", MARTES: "Mar", MIERCOLES: "Mié",
  JUEVES: "Jue", VIERNES: "Vie", SABADO: "Sáb", DOMINGO: "Dom",
};

const TIPO_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno", MEDIA_MANANA: "Media mañana", ALMUERZO: "Almuerzo",
  MERIENDA: "Merienda", CENA: "Cena", RECENA: "Recena",
};

const TIPOS_ORDEN = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"];

function calcularMacrosDia(dia: AIDia) {
  let cal = 0, prot = 0, carb = 0, gras = 0;
  for (const c of dia.comidas) {
    for (const a of c.alimentos) {
      cal += a.estimacion.calorias || 0;
      prot += a.estimacion.proteinas || 0;
      carb += a.estimacion.carbohidratos || 0;
      gras += a.estimacion.grasas || 0;
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
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between sticky top-0 bg-background z-10 py-2">
        <h3 className="text-lg font-semibold">{plan.nombre}</h3>
        <div className="flex gap-2">
          <button
            onClick={onReject}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
          >
            Descartar
          </button>
          <button
            onClick={onAccept}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Creando plan..." : "Aceptar y crear plan"}
          </button>
        </div>
      </div>

      {/* Grid semanal horizontal scrollable */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-2 min-w-max">
          {plan.dias.map((dia) => {
            const macros = calcularMacrosDia(dia);
            const comidasMap = new Map(dia.comidas.map((c) => [c.tipo, c]));

            return (
              <div key={dia.dia} className="w-[200px] shrink-0 flex flex-col">
                {/* Header del día */}
                <div className="text-center font-semibold text-sm py-2 bg-muted/50 rounded-t-lg border-b border-border">
                  {DIA_LABELS[dia.dia] || dia.dia}
                </div>

                {/* Comidas */}
                <div className="flex-1 border-x border-border p-1.5 space-y-2">
                  {TIPOS_ORDEN.map((tipo) => {
                    const comida = comidasMap.get(tipo);
                    return (
                      <div key={tipo}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                          {TIPO_LABELS[tipo]}
                        </p>
                        {comida && comida.alimentos.length > 0 ? (
                          <div className="space-y-0.5">
                            {comida.alimentos.map((a, i) => (
                              <p key={i} className="text-[11px] leading-tight">
                                {a.nombre} <span className="text-muted-foreground">({a.cantidadGramos}g)</span>
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">-</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Resumen macros del día */}
                <div className="border border-border rounded-b-lg p-2 space-y-1 bg-muted/30">
                  <div className="text-center">
                    <span className="text-sm font-bold text-amber-600">{macros.cal}</span>
                    <span className="text-[10px] text-muted-foreground ml-0.5">kcal</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-blue-600 font-medium">P: {macros.prot}g</span>
                    <span className="text-green-600 font-medium">C: {macros.carb}g</span>
                    <span className="text-red-600 font-medium">G: {macros.gras}g</span>
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
