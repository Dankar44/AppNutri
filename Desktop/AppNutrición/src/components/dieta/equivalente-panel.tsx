"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { X, Search, ArrowUp, ArrowDown, Minus, Plus, ChevronLeft, ChevronRight, Replace } from "lucide-react";
import { buscarEquivalentes } from "@/app/actions/alimentos";

interface EquivalentePanelProps {
  alimentoId: string;
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  cantidad: number;
  /** Sustituir el alimento por el equivalente elegido. */
  onSelect: (alimentoId: string, nombre: string, cantidad: number) => void;
  /** Añadir el equivalente como alternativa ("o ...") en vez de sustituir (#5). */
  onAgregarAlternativa?: (alimentoId: string, nombre: string, cantidad: number) => void;
  onClose: () => void;
}

interface Equivalente {
  id: string;
  nombre: string;
  cantidadG: number;
  cal: number;
  gras: number;
  carb: number;
  prot: number;
  diffCal: number;
  diffGras: number;
  diffCarb: number;
  diffProt: number;
}

const PAGE_SIZE = 6;
const GRID = "grid grid-cols-[minmax(0,1fr)_52px_42px_42px_42px_124px] gap-1";

function DiffIndicator({ value }: { value: number }) {
  const rounded = Math.round(value);
  if (Math.abs(rounded) < 1) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-primary font-medium bg-primary/10 rounded-full px-1.5 py-0.5">
        <Minus className="w-2.5 h-2.5" />
      </span>
    );
  }
  const isUp = rounded > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium rounded-full px-1.5 py-0.5 ${
      isUp ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10" : "text-primary bg-primary/10"
    }`}>
      {isUp ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
      {Math.abs(rounded)}
    </span>
  );
}

export function EquivalentePanel({
  alimentoId,
  nombre,
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  cantidad,
  onSelect,
  onAgregarAlternativa,
  onClose,
}: EquivalentePanelProps) {
  const t = useTranslations("diets");
  const [busqueda, setBusqueda] = useState("");
  const [allResults, setAllResults] = useState<Equivalente[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  // Cantidad de referencia EDITABLE: al cambiarla se recalculan las equivalencias.
  const [cantidadRef, setCantidadRef] = useState(cantidad);

  const calRef = (calorias * cantidadRef) / 100;
  const protRef = (proteinas * cantidadRef) / 100;
  const carbRef = (carbohidratos * cantidadRef) / 100;
  const grasRef = (grasas * cantidadRef) / 100;

  const loadData = useCallback(async () => {
    setLoading(true);
    setPage(0);
    const res = await buscarEquivalentes(alimentoId, calRef, busqueda || undefined);
    const equivalentes: Equivalente[] = (res as any[]).map((r) => {
      const cantG = r.calorias > 0 ? Math.round((calRef / r.calorias) * 100) : 100;
      const factor = cantG / 100;
      return {
        id: r.id,
        nombre: r.nombre,
        cantidadG: cantG,
        cal: Math.round(r.calorias * factor),
        gras: Math.round(r.grasas * factor * 10) / 10,
        carb: Math.round(r.carbohidratos * factor * 10) / 10,
        prot: Math.round(r.proteinas * factor * 10) / 10,
        diffCal: Math.round(r.calorias * factor - calRef),
        diffGras: Math.round((r.grasas * factor - grasRef) * 10) / 10,
        diffCarb: Math.round((r.carbohidratos * factor - carbRef) * 10) / 10,
        diffProt: Math.round((r.proteinas * factor - protRef) * 10) / 10,
      };
    });
    setAllResults(equivalentes);
    setLoading(false);
  }, [alimentoId, calRef, protRef, carbRef, grasRef, busqueda]);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const totalPages = Math.ceil(allResults.length / PAGE_SIZE);
  const visible = allResults.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function ajustar(delta: number) {
    setCantidadRef((c) => Math.max(1, Math.round((c + delta) * 10) / 10));
  }

  return (
    <div className="border border-primary/20 rounded-xl bg-card shadow-lg overflow-hidden my-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-primary/10">
        <h4 className="text-sm font-semibold">{t("equivalentePanel.addTitle")}</h4>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("equivalentePanel.searchFood")}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            maxLength={100}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
      </div>

      {/* Cantidad de referencia EDITABLE (−/+) + nota + cabeceras de columna */}
      <div className="px-4 pt-3 pb-2 border-b border-border/50 bg-muted/10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs text-primary font-medium">{t("equivalentePanel.calculationNote")}</p>
          <div className="inline-flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-muted-foreground">{t("equivalentePanel.referenceQty")}</span>
            <div className="inline-flex items-center rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => ajustar(-5)}
                className="px-1.5 py-1 hover:bg-muted text-muted-foreground transition-colors"
                title="-5 g"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                inputMode="decimal"
                value={cantidadRef}
                onChange={(e) => setCantidadRef(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-14 text-center text-sm tabular-nums bg-transparent border-x border-border py-1 focus:outline-none"
                min={1}
                max={10000}
              />
              <span className="px-1 text-[11px] text-muted-foreground">g</span>
              <button
                type="button"
                onClick={() => ajustar(5)}
                className="px-1.5 py-1 hover:bg-muted text-muted-foreground transition-colors"
                title="+5 g"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        <div className={`${GRID} text-[10px] font-semibold text-muted-foreground`}>
          <span>{t("equivalentePanel.columnFood")}</span>
          <span className="text-center bg-primary/10 text-primary rounded px-1 py-0.5">{t("equivalentePanel.columnEnergy")}</span>
          <span className="text-center">{t("equivalentePanel.columnFat")}</span>
          <span className="text-center">{t("equivalentePanel.columnCarbs")}</span>
          <span className="text-center">{t("equivalentePanel.columnProtein")}</span>
          <span></span>
        </div>
      </div>

      {/* Reference row (recalculada en vivo) */}
      <div className={`${GRID} items-center px-4 py-2 bg-primary/5 border-b border-primary/10 text-xs`}>
        <div className="min-w-0">
          <p className="font-semibold truncate text-primary">{nombre}</p>
          <p className="text-[10px] text-muted-foreground">{cantidadRef}g · {t("equivalentePanel.reference")}</p>
        </div>
        <p className="text-center font-bold tabular-nums">{Math.round(calRef)} kcal</p>
        <p className="text-center tabular-nums">{Math.round(grasRef)} g</p>
        <p className="text-center tabular-nums">{Math.round(carbRef)} g</p>
        <p className="text-center tabular-nums">{Math.round(protRef)} g</p>
        <span></span>
      </div>

      {/* Results */}
      <div className="divide-y divide-border/40">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t("equivalentePanel.searching")}</div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">{t("equivalentePanel.noResults")}</div>
        ) : (
          visible.map((eq) => (
            <div key={eq.id} className={`${GRID} items-center px-4 py-2.5 hover:bg-muted/30 transition-colors text-xs`}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{eq.nombre}</p>
                <p className="text-[10px] text-muted-foreground">{eq.cantidadG}g</p>
              </div>
              <div className="text-center space-y-0.5">
                <p className="font-bold tabular-nums">{eq.cal} kcal</p>
                <DiffIndicator value={eq.diffCal} />
              </div>
              <div className="text-center space-y-0.5">
                <p className="tabular-nums font-medium">{Math.round(eq.gras)} g</p>
                <DiffIndicator value={eq.diffGras} />
              </div>
              <div className="text-center space-y-0.5">
                <p className="tabular-nums font-medium">{Math.round(eq.carb)} g</p>
                <DiffIndicator value={eq.diffCarb} />
              </div>
              <div className="text-center space-y-0.5">
                <p className="tabular-nums font-medium">{Math.round(eq.prot)} g</p>
                <DiffIndicator value={eq.diffProt} />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onSelect(eq.id, eq.nombre, eq.cantidadG)}
                  className="w-full inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors whitespace-nowrap overflow-hidden"
                  title={t("equivalentePanel.substitute")}
                >
                  <Replace className="w-3 h-3 shrink-0" />
                  <span className="truncate">{t("equivalentePanel.substitute")}</span>
                </button>
                {onAgregarAlternativa && (
                  <button
                    type="button"
                    onClick={() => onAgregarAlternativa(eq.id, eq.nombre, eq.cantidadG)}
                    className="w-full inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg bg-primary text-primary-foreground text-[10px] font-medium hover:bg-primary/90 transition-colors whitespace-nowrap overflow-hidden"
                    title={t("equivalentePanel.addAlternativaBtn")}
                  >
                    <Plus className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t("equivalentePanel.addAlternativaBtn")}</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1 px-4 py-2.5 border-t border-border/50 bg-muted/10">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = totalPages <= 5 ? i : Math.min(Math.max(page - 2, 0), totalPages - 5) + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {p + 1}
              </button>
            );
          })}
          {totalPages > 5 && <span className="text-xs text-muted-foreground px-1">...</span>}
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
