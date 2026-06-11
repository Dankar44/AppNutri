"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { X, RotateCcw, Save } from "lucide-react";
import { DiffIndicator, redondearGramos } from "./equivalente-panel";
import { getUnidadLabel } from "@/lib/units";
import { convertirAGramos } from "@/lib/macros";
import { cn } from "@/lib/utils";

interface AltRevision {
  id: string;
  nombre: string;
  cantidad: number;
  unidad?: string;
  esReceta?: boolean;
  calorias?: number;
  proteinas?: number;
  carbohidratos?: number;
  grasas?: number;
  porcion?: number;
}

interface RevisionEquivalenciasPanelProps {
  principal: {
    nombre: string;
    cantidad: number;
    unidad: string;
    esReceta: boolean;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    porcion: number;
  };
  alternativas: AltRevision[];
  onGuardar: (cantidadPrincipal: number, cambios: { id: string; cantidad: number }[]) => void;
  onClose: () => void;
}

const GRID = "grid grid-cols-[88px_minmax(0,1fr)_56px_44px_44px_44px] gap-1";

// Macros de un ítem a una cantidad dada (alimentos: por 100 g; recetas: por ración).
function macrosA(
  base: { calorias?: number; proteinas?: number; carbohidratos?: number; grasas?: number },
  cantidad: number,
  unidad: string,
  porcion: number,
  esReceta: boolean,
) {
  const factor = esReceta ? cantidad : convertirAGramos(cantidad, unidad, porcion) / 100;
  return {
    cal: (base.calorias ?? 0) * factor,
    prot: (base.proteinas ?? 0) * factor,
    carb: (base.carbohidratos ?? 0) * factor,
    gras: (base.grasas ?? 0) * factor,
  };
}

/**
 * Panel de REVISIÓN de equivalencias (#5): el alimento principal y todas sus
 * alternativas en una tabla, cada una con su cantidad editable y sus macros en
 * vivo. Cambiar la cantidad del principal recalcula todas las alternativas para
 * igualar sus calorías (y se ve el porqué). "Guardar" persiste todo de golpe.
 */
export function RevisionEquivalenciasPanel({ principal, alternativas, onGuardar, onClose }: RevisionEquivalenciasPanelProps) {
  const t = useTranslations("diets");
  const [cantPrincipal, setCantPrincipal] = useState(principal.cantidad);
  const [cants, setCants] = useState<Record<string, number>>(
    () => Object.fromEntries(alternativas.map((a) => [a.id, a.cantidad])),
  );

  const mP = macrosA(principal, cantPrincipal, principal.unidad, principal.porcion, principal.esReceta);

  // Recalcular TODAS las alternativas para igualar las kcal del principal a la cantidad dada.
  function recalcularTodas(nuevaCantPrincipal: number) {
    const objetivo = macrosA(principal, nuevaCantPrincipal, principal.unidad, principal.porcion, principal.esReceta).cal;
    setCants((prev) => {
      const next = { ...prev };
      for (const alt of alternativas) {
        const calBase = alt.calorias ?? 0;
        if (calBase <= 0) continue; // sin datos: no tocar
        next[alt.id] = alt.esReceta
          ? Math.max(0.5, Math.round((objetivo / calBase) * 2) / 2)
          : redondearGramos((objetivo / calBase) * 100);
      }
      return next;
    });
  }

  function handlePrincipalChange(v: number) {
    if (!Number.isFinite(v) || v <= 0) return;
    setCantPrincipal(v);
    recalcularTodas(v);
  }

  const pasoP = principal.esReceta ? 0.5 : 5;

  return (
    <div className="border border-primary/20 rounded-xl bg-card shadow-lg overflow-hidden my-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-primary/10">
        <h4 className="text-sm font-semibold">{t("revisionPanel.title")}</h4>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nota + cabeceras */}
      <div className="px-4 pt-3 pb-2 border-b border-border/50 bg-muted/10">
        <p className="text-xs text-primary font-medium mb-2">{t("revisionPanel.nota")}</p>
        <div className={`${GRID} text-[10px] font-semibold text-muted-foreground`}>
          <span>{t("revisionPanel.columnaCantidad")}</span>
          <span>{t("equivalentePanel.columnFood")}</span>
          <span className="text-center bg-primary/10 text-primary rounded px-1 py-0.5">{t("equivalentePanel.columnEnergy")}</span>
          <span className="text-center">{t("equivalentePanel.columnFat")}</span>
          <span className="text-center">{t("equivalentePanel.columnCarbs")}</span>
          <span className="text-center">{t("equivalentePanel.columnProtein")}</span>
        </div>
      </div>

      {/* Fila del principal (referencia, editable) */}
      <div className={`${GRID} items-center px-4 py-2.5 bg-primary/5 border-b border-primary/10 text-xs`}>
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="decimal"
            value={cantPrincipal}
            onChange={(e) => handlePrincipalChange(parseFloat(e.target.value))}
            min={principal.esReceta ? 0.5 : 0}
            max={10000}
            step={pasoP}
            className="w-14 px-1 py-1 text-[11px] rounded border border-primary/40 bg-background text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
          <span className="text-[10px] text-muted-foreground">{getUnidadLabel(principal.unidad, principal.esReceta)}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate text-primary">{principal.nombre}</p>
          <p className="text-[10px] text-muted-foreground">{t("equivalentePanel.reference")}</p>
        </div>
        <p className="text-center font-bold tabular-nums">{Math.round(mP.cal)} kcal</p>
        <p className="text-center tabular-nums">{Math.round(mP.gras)} g</p>
        <p className="text-center tabular-nums">{Math.round(mP.carb)} g</p>
        <p className="text-center tabular-nums">{Math.round(mP.prot)} g</p>
      </div>

      {/* Filas de alternativas (editables, macros y diferencias en vivo) */}
      <div className="divide-y divide-border/40">
        {alternativas.map((alt) => {
          const qty = cants[alt.id] ?? alt.cantidad;
          const m = macrosA(alt, qty, alt.unidad || "GRAMOS", alt.porcion ?? 100, !!alt.esReceta);
          const sinDatos = (alt.calorias ?? 0) <= 0;
          return (
            <div key={alt.id} className={`${GRID} items-center px-4 py-2.5 hover:bg-muted/30 transition-colors text-xs`}>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="decimal"
                  value={qty}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (Number.isFinite(v) && v > 0) setCants((prev) => ({ ...prev, [alt.id]: v }));
                  }}
                  min={alt.esReceta ? 0.5 : 0}
                  max={10000}
                  step={alt.esReceta ? 0.5 : 5}
                  className="w-14 px-1 py-1 text-[11px] rounded border border-border/60 bg-background text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
                />
                <span className="text-[10px] text-muted-foreground">{getUnidadLabel(alt.unidad || "GRAMOS", alt.esReceta)}</span>
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm font-medium truncate", alt.esReceta && "text-purple-600 dark:text-purple-400")}>{alt.nombre}</p>
              </div>
              {sinDatos ? (
                <p className="col-span-4 text-center text-[10px] text-muted-foreground italic">{t("revisionPanel.sinDatos")}</p>
              ) : (
                <>
                  <div className="text-center space-y-0.5">
                    <p className="font-bold tabular-nums">{Math.round(m.cal)} kcal</p>
                    <DiffIndicator value={m.cal - mP.cal} />
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="tabular-nums font-medium">{Math.round(m.gras)} g</p>
                    <DiffIndicator value={m.gras - mP.gras} />
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="tabular-nums font-medium">{Math.round(m.carb)} g</p>
                    <DiffIndicator value={m.carb - mP.carb} />
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className="tabular-nums font-medium">{Math.round(m.prot)} g</p>
                    <DiffIndicator value={m.prot - mP.prot} />
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-border/50 bg-muted/10">
        <button
          type="button"
          onClick={() => recalcularTodas(cantPrincipal)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors"
          title={t("revisionPanel.recalcular")}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t("revisionPanel.recalcular")}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            {t("revisionPanel.cancelar")}
          </button>
          <button
            type="button"
            onClick={() => onGuardar(cantPrincipal, alternativas.map((a) => ({ id: a.id, cantidad: cants[a.id] ?? a.cantidad })))}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {t("revisionPanel.guardar")}
          </button>
        </div>
      </div>
    </div>
  );
}
