"use client";

import { useTranslations } from "next-intl";
import { useState, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { AlimentoCard } from "./alimento-card";
import { EquivalentePanel } from "./equivalente-panel";
import { cn } from "@/lib/utils";
import { actualizarDescripcionComida } from "@/app/actions/planes";
import { calcularMacrosPorcion, convertirAGramos } from "@/lib/macros";
import type { InteractionMode } from "@/components/food-hover-card";

interface AlimentoEnSlot {
  id: string;
  alimentoRealId?: string | null;
  nombre: string;
  cantidad: number;
  unidad?: string;
  porcion?: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra?: number;
  esReceta?: boolean;
  esPropio?: boolean;
  enlaceProducto?: string | null;
  imagenUrl?: string | null;
  recetaIngredientes?: { nombre: string; cantidad: number; unidad: string }[];
  recetaDescripcion?: string | null;
  recetaPorciones?: number;
}

interface ComidaSlotProps {
  comidaId: string;
  tipo: string;
  descripcion?: string | null;
  alimentos: AlimentoEnSlot[];
  onAdd: (comidaId: string) => void;
  onRemove: (alimentoEnComidaId: string) => void;
  onCantidadChange: (alimentoEnComidaId: string, cantidad: number) => void;
  onReemplazar?: (alimentoEnComidaId: string, nuevoAlimentoId: string, nombre: string, cantidad: number) => void;
  compactHeader?: boolean;
  readOnly?: boolean;
  interactionMode?: InteractionMode;
  ocultarCalorias?: boolean;
}

export function ComidaSlot({
  comidaId,
  tipo,
  descripcion,
  alimentos,
  onAdd,
  onRemove,
  onCantidadChange,
  onReemplazar,
  readOnly = false,
  interactionMode = "dashboard",
  ocultarCalorias = false,
}: ComidaSlotProps) {
  const t = useTranslations("diets");

  const { setNodeRef, isOver } = useDroppable({
    id: `comida-${comidaId}`,
    data: { comidaId },
  });

  const [desc, setDesc] = useState(descripcion || "");
  const [hora, setHora] = useState(t(`comidaSlot.horaDefault.${tipo}` as any) || "");
  const [collapsed, setCollapsed] = useState(false);
  const [equivalenteOpen, setEquivalenteOpen] = useState<{
    alimentoEnComidaId: string;
    alimentoRealId: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    cantidad: number;
  } | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  function handleDescChange(value: string) {
    setDesc(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      actualizarDescripcionComida(comidaId, value);
    }, 800);
  }

  const mealTotals = (() => {
    let calorias = 0;
    let proteinas = 0;
    let carbohidratos = 0;
    let grasas = 0;
    let fibra = 0;

    for (const a of alimentos) {
      if (a.esReceta) {
        calorias += Math.round(a.calorias * a.cantidad * 10) / 10;
        proteinas += Math.round(a.proteinas * a.cantidad * 10) / 10;
        carbohidratos += Math.round(a.carbohidratos * a.cantidad * 10) / 10;
        grasas += Math.round(a.grasas * a.cantidad * 10) / 10;
        fibra += Math.round((a.fibra || 0) * a.cantidad * 10) / 10;
      } else {
        const gramos = convertirAGramos(a.cantidad, a.unidad || "GRAMOS", a.porcion || 100);
        const m = calcularMacrosPorcion(
          {
            calorias: a.calorias,
            proteinas: a.proteinas,
            carbohidratos: a.carbohidratos,
            grasas: a.grasas,
            fibra: a.fibra || 0,
          },
          gramos
        );
        calorias += m.calorias;
        proteinas += m.proteinas;
        carbohidratos += m.carbohidratos;
        grasas += m.grasas;
      }
    }

    return {
      calorias: Math.round(calorias * 10) / 10,
      proteinas: Math.round(proteinas * 10) / 10,
      carbohidratos: Math.round(carbohidratos * 10) / 10,
      grasas: Math.round(grasas * 10) / 10,
      fibra: Math.round(fibra * 10) / 10,
    };
  })();

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border border-border/60 bg-card shadow-md overflow-hidden transition-colors",
        isOver && "ring-2 ring-primary/30 border-primary/30"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4">
        <span className="text-sm sm:text-base text-muted-foreground tabular-nums shrink-0">{hora}</span>
        <h4 className="text-base sm:text-lg font-bold text-foreground flex-1 min-w-0 truncate">
          {t(`comidaSlot.tipoLabels.${tipo}` as any) || tipo}
        </h4>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Collapsible content */}
      {!collapsed && (
        <>
          {/* Food items */}
          <div className="divide-y divide-border/30">
            {alimentos.length === 0 ? (
              <div className="px-4 py-3 text-xs text-muted-foreground italic">
                {t("comidaSlot.noFoods")}
              </div>
            ) : (
              alimentos.map((a) => (
                <div key={a.id}>
                  <AlimentoCard
                    id={a.id}
                    alimentoRealId={a.alimentoRealId}
                    nombre={a.nombre}
                    cantidad={a.cantidad}
                    unidad={a.unidad}
                    porcion={a.porcion}
                    calorias={a.calorias}
                    proteinas={a.proteinas}
                    carbohidratos={a.carbohidratos}
                    grasas={a.grasas}
                    fibra={a.fibra}
                    esReceta={a.esReceta}
                    esPropio={a.esPropio}
                    enlaceProducto={a.enlaceProducto}
                    imagenUrl={a.imagenUrl}
                    recetaIngredientes={a.recetaIngredientes}
                    recetaDescripcion={a.recetaDescripcion}
                    recetaPorciones={a.recetaPorciones}
                    readOnly={readOnly}
                    interactionMode={interactionMode}
                    ocultarCalorias={ocultarCalorias}
                    onRemove={onRemove}
                    onCantidadChange={onCantidadChange}
                    onBuscarEquivalente={readOnly ? undefined : (_alimentoEnComidaId, nombre, cal, prot, carb, gras, cant) => {
                      setEquivalenteOpen(
                        equivalenteOpen?.alimentoEnComidaId === a.id
                          ? null
                          : { alimentoEnComidaId: a.id, alimentoRealId: a.alimentoRealId || a.id, nombre, calorias: cal, proteinas: prot, carbohidratos: carb, grasas: gras, cantidad: cant }
                      );
                    }}
                  />
                  {equivalenteOpen?.alimentoEnComidaId === a.id && (
                    <EquivalentePanel
                      alimentoId={equivalenteOpen.alimentoRealId}
                      nombre={equivalenteOpen.nombre}
                      calorias={equivalenteOpen.calorias}
                      proteinas={equivalenteOpen.proteinas}
                      carbohidratos={equivalenteOpen.carbohidratos}
                      grasas={equivalenteOpen.grasas}
                      cantidad={equivalenteOpen.cantidad}
                      onSelect={(nuevoAlimentoId, nombre, cantidad) => {
                        if (onReemplazar) {
                          onReemplazar(a.id, nuevoAlimentoId, nombre, cantidad);
                        }
                        setEquivalenteOpen(null);
                      }}
                      onClose={() => setEquivalenteOpen(null)}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add food bar */}
          {!readOnly && (
            <button
              type="button"
              onClick={() => onAdd(comidaId)}
              className={cn(
                "w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                isOver
                  ? "bg-primary/20 text-primary"
                  : "bg-primary/10 text-primary hover:bg-primary/15"
              )}
            >
              {t("comidaSlot.addFood")}
            </button>
          )}

          {/* Notes */}
          {readOnly ? (
            desc.trim() ? (
              <div className="px-4 py-3 border-t border-border/50">
                <div className="text-sm font-semibold text-foreground mb-1.5">{t("comidaSlot.notes")}</div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{desc}</p>
              </div>
            ) : null
          ) : (
            <div className="px-4 py-3 border-t border-border/50">
              <div className="text-sm font-semibold text-foreground mb-1.5">{t("comidaSlot.notes")}</div>
              <textarea
                value={desc}
                onChange={(e) => handleDescChange(e.target.value)}
                placeholder={t("comidaSlot.notesPlaceholder")}
                maxLength={500}
                rows={2}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-muted/30 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:text-foreground placeholder:italic resize-none"
              />
            </div>
          )}

          {/* Macro pills — totales por comida, ocultos si ocultarCalorias */}
          {!ocultarCalorias && (
          <div className="px-2 sm:px-4 py-2 sm:py-3 border-t border-border/50 bg-muted/10">
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] sm:text-sm font-medium">
                {Math.round(mealTotals.calorias)} kcal
              </span>
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-[10px] sm:text-sm font-medium">
                G {mealTotals.grasas.toFixed(1)}g
              </span>
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-[10px] sm:text-sm font-medium">
                C {mealTotals.carbohidratos.toFixed(1)}g
              </span>
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] sm:text-sm font-medium">
                P {mealTotals.proteinas.toFixed(1)}g
              </span>
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-sm font-medium">
                F {mealTotals.fibra.toFixed(1)}g
              </span>
            </div>
          </div>
          )}
        </>
      )}
    </div>
  );
}
