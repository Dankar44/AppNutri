"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useCallback } from "react";
import { X, Search, ArrowUp, ArrowDown, Minus, Plus, ChevronLeft, ChevronRight, Replace, ListFilter, Check } from "lucide-react";
import { buscarEquivalentes } from "@/app/actions/alimentos";
import { buscarEquivalentesReceta } from "@/app/actions/recetas";
import { CantidadInput } from "@/components/cantidad-input";

interface EquivalentePanelProps {
  alimentoId: string;
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  cantidad: number;
  /** Si true, busca recetas equivalentes y ajusta en RACIONES (no gramos) (#5). */
  esReceta?: boolean;
  /** Sustituir el ítem por el equivalente elegido. */
  onSelect: (id: string, nombre: string, cantidad: number) => void;
  /** Añadir el equivalente como alternativa ("o ...") en vez de sustituir (#5). */
  onAgregarAlternativa?: (id: string, nombre: string, cantidad: number) => void;
  /** Abre el catálogo completo (favoritos, mis alimentos/recetas, app). */
  onMasOpciones?: () => void;
  onClose: () => void;
}

interface Equivalente {
  id: string;
  nombre: string;
  cantidadEq: number;
  // Macros base (por 100 g en alimentos; por ración en recetas) para recalcular al editar la cantidad.
  baseCal: number;
  baseGras: number;
  baseCarb: number;
  baseProt: number;
}

// Redondeo "de consulta": 82 → 80 (gramos a múltiplos de 5 si ≥20; si no, enteros).
export function redondearGramos(g: number): number {
  if (g >= 20) return Math.max(5, Math.round(g / 5) * 5);
  return Math.max(1, Math.round(g));
}

const PAGE_SIZE = 6;
const GRID = "grid grid-cols-[minmax(0,1fr)_52px_42px_42px_42px_124px] gap-1";

export function DiffIndicator({ value }: { value: number }) {
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
  esReceta = false,
  onSelect,
  onAgregarAlternativa,
  onMasOpciones,
  onClose,
}: EquivalentePanelProps) {
  const t = useTranslations("diets");
  const [busqueda, setBusqueda] = useState("");
  const [allResults, setAllResults] = useState<Equivalente[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  // Cantidad de referencia EDITABLE: al cambiarla se recalculan las equivalencias.
  const [cantidadRef, setCantidadRef] = useState(cantidad);
  // Cantidad editada a mano por fila (si no, la equivalente calculada).
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  // Filas ya añadidas como alternativa (el panel NO se cierra: se pueden añadir varias).
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // En recetas, los macros son por ración → factor = nº de raciones. En alimentos, por 100 g.
  const factorRef = esReceta ? cantidadRef : cantidadRef / 100;
  const calRef = calorias * factorRef;
  const protRef = proteinas * factorRef;
  const carbRef = carbohidratos * factorRef;
  const grasRef = grasas * factorRef;

  const unidadCorta = esReceta ? t("equivalentePanel.unitRaciones") : "g";
  const paso = esReceta ? 0.5 : 5;
  const minRef = esReceta ? 0.5 : 1;

  const loadData = useCallback(async () => {
    setLoading(true);
    setPage(0);
    const res = esReceta
      ? await buscarEquivalentesReceta(alimentoId, calRef, busqueda || undefined)
      : await buscarEquivalentes(alimentoId, calRef, busqueda || undefined);
    const equivalentes: Equivalente[] = (res as any[]).map((r) => {
      const cantEq = esReceta
        ? (r.calorias > 0 ? Math.max(0.5, Math.round((calRef / r.calorias) * 2) / 2) : 1)
        : (r.calorias > 0 ? redondearGramos((calRef / r.calorias) * 100) : 100);
      return {
        id: r.id,
        nombre: r.nombre,
        cantidadEq: cantEq,
        baseCal: r.calorias,
        baseGras: r.grasas,
        baseCarb: r.carbohidratos,
        baseProt: r.proteinas,
      };
    });
    setAllResults(equivalentes);
    setOverrides({});
    setLoading(false);
  }, [alimentoId, calRef, busqueda, esReceta]);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const totalPages = Math.ceil(allResults.length / PAGE_SIZE);
  const visible = allResults.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function ajustar(delta: number) {
    // Ajustar al SIGUIENTE múltiplo del paso (82 → 85 / 80), no sumar a ciegas (82 → 87).
    setCantidadRef((c) => {
      const objetivo = delta > 0
        ? Math.floor((c + 0.001) / paso) * paso + paso
        : Math.ceil((c - 0.001) / paso) * paso - paso;
      return Math.max(minRef, Math.round(objetivo * 10) / 10);
    });
  }

  return (
    <div className="border border-primary/20 rounded-xl bg-card shadow-lg overflow-hidden my-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-primary/10">
        <h4 className="text-sm font-semibold">{esReceta ? t("equivalentePanel.titleRecipe") : t("equivalentePanel.addTitle")}</h4>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search bar + Más opciones */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={esReceta ? t("equivalentePanel.searchRecipe") : t("equivalentePanel.searchFood")}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              maxLength={100}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          {onMasOpciones && (
            <button
              type="button"
              onClick={onMasOpciones}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors whitespace-nowrap"
              title={t("equivalentePanel.masOpciones")}
            >
              <ListFilter className="w-3.5 h-3.5" />
              {t("equivalentePanel.masOpciones")}
            </button>
          )}
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
                onClick={() => ajustar(-paso)}
                className="px-1.5 py-1 hover:bg-muted text-muted-foreground transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <CantidadInput
                value={cantidadRef}
                onChange={setCantidadRef}
                className="w-14 text-center text-sm tabular-nums bg-transparent border-x border-border py-1 focus:outline-none"
                min={minRef}
                max={10000}
                step={paso}
                redondearA={esReceta ? 0.5 : undefined}
              />
              <span className="px-1 text-[11px] text-muted-foreground">{unidadCorta}</span>
              <button
                type="button"
                onClick={() => ajustar(paso)}
                className="px-1.5 py-1 hover:bg-muted text-muted-foreground transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        <div className={`${GRID} text-[10px] font-semibold text-muted-foreground`}>
          <span>{esReceta ? t("equivalentePanel.columnRecipe") : t("equivalentePanel.columnFood")}</span>
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
          <p className="text-[10px] text-muted-foreground">{cantidadRef}{esReceta ? " " : ""}{unidadCorta} · {t("equivalentePanel.reference")}</p>
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
          visible.map((eq) => {
            const qty = overrides[eq.id] ?? eq.cantidadEq;
            const factor = esReceta ? qty : qty / 100;
            const cal = eq.baseCal * factor;
            const gras = eq.baseGras * factor;
            const carb = eq.baseCarb * factor;
            const prot = eq.baseProt * factor;
            const added = addedIds.has(eq.id);
            return (
              <div key={eq.id} className={`${GRID} items-center px-4 py-2.5 hover:bg-muted/30 transition-colors text-xs`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{eq.nombre}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CantidadInput
                      value={qty}
                      onChange={(v) => setOverrides((o) => ({ ...o, [eq.id]: v }))}
                      // min=0 ancla la rejilla del step en múltiplos limpios (100→105→110,
                      // no 101→106 como pasaba con min=1). CantidadInput ya descarta v≤0.
                      min={esReceta ? 0.5 : 0}
                      max={10000}
                      step={esReceta ? 0.5 : 5}
                      redondearA={esReceta ? 0.5 : undefined}
                      className="w-14 px-1 py-0.5 text-[11px] rounded border border-border/60 bg-background text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
                    />
                    <span className="text-[10px] text-muted-foreground">{unidadCorta}</span>
                  </div>
                </div>
                <div className="text-center space-y-0.5">
                  <p className="font-bold tabular-nums">{Math.round(cal)} kcal</p>
                  <DiffIndicator value={cal - calRef} />
                </div>
                <div className="text-center space-y-0.5">
                  <p className="tabular-nums font-medium">{Math.round(gras)} g</p>
                  <DiffIndicator value={gras - grasRef} />
                </div>
                <div className="text-center space-y-0.5">
                  <p className="tabular-nums font-medium">{Math.round(carb)} g</p>
                  <DiffIndicator value={carb - carbRef} />
                </div>
                <div className="text-center space-y-0.5">
                  <p className="tabular-nums font-medium">{Math.round(prot)} g</p>
                  <DiffIndicator value={prot - protRef} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelect(eq.id, eq.nombre, qty)}
                    className="w-full inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg border border-border text-[10px] font-medium text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors whitespace-nowrap overflow-hidden"
                    title={t("equivalentePanel.substitute")}
                  >
                    <Replace className="w-3 h-3 shrink-0" />
                    <span className="truncate">{t("equivalentePanel.substitute")}</span>
                  </button>
                  {onAgregarAlternativa && (
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => {
                        onAgregarAlternativa(eq.id, eq.nombre, qty);
                        setAddedIds((s) => new Set(s).add(eq.id));
                      }}
                      className={`w-full inline-flex items-center justify-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors whitespace-nowrap overflow-hidden ${
                        added
                          ? "bg-primary/10 text-primary cursor-default"
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                      title={added ? t("equivalentePanel.added") : t("equivalentePanel.addAlternativaBtn")}
                    >
                      {added ? <Check className="w-3 h-3 shrink-0" /> : <Plus className="w-3 h-3 shrink-0" />}
                      <span className="truncate">{added ? t("equivalentePanel.added") : t("equivalentePanel.addAlternativaBtn")}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
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
