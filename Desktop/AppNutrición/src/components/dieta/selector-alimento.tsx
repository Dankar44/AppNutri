"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { X, Search, Sparkles, CookingPot, User, Plus, Minus, SlidersHorizontal } from "lucide-react";
import { MacroBadges } from "@/components/macro-badge";
import { buscarAlimentosYRecetas } from "@/app/actions/recetas";
import { getSugerencias } from "@/app/actions/sugerencias";
import type { AlimentoSugerido } from "@/lib/ai/suggest-complement";
import { getCantidadDefault, getUnidadLabel } from "@/lib/units";
import { calcularMacrosPorcion, convertirAGramos } from "@/lib/macros";
import { cn } from "@/lib/utils";

interface SelectorAlimentoProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: {
    alimentoId: string | null;
    recetaId: string | null;
    nombre: string;
    cantidad: number;
    unidad: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
  }) => void;
  comidaId?: string;
  macrosObjetivo?: { calorias: number; proteinas: number; carbohidratos: number; grasas: number };
}

interface AlimentoResult {
  id: string; nombre: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number; porcion: number; unidad: string;
  esPropio: boolean;
}

interface RecetaResult {
  id: string; nombre: string; porciones: number;
  calorias: number; proteinas: number; carbohidratos: number; grasas: number;
  ingredientes: { alimento: { nombre: string }; cantidad: number; unidad: string }[];
  esPropio: boolean;
}

type Filtro = "todos" | "mis-alimentos" | "mis-recetas";

interface ExpandedState {
  id: string;
  type: "alimento" | "receta";
  cantidad: number;
  unidad: string;
  porcion: number;
}

function scaledMacros(
  base: { calorias: number; proteinas: number; carbohidratos: number; grasas: number },
  cantidad: number,
  unidad: string,
  porcion: number,
  esReceta: boolean,
) {
  if (esReceta) {
    return {
      calorias: base.calorias * cantidad,
      proteinas: base.proteinas * cantidad,
      carbohidratos: base.carbohidratos * cantidad,
      grasas: base.grasas * cantidad,
    };
  }
  const gramos = convertirAGramos(cantidad, unidad, porcion || 100);
  const m = calcularMacrosPorcion(
    { calorias: base.calorias, proteinas: base.proteinas, carbohidratos: base.carbohidratos, grasas: base.grasas, fibra: 0 },
    gramos,
  );
  return { calorias: m.calorias, proteinas: m.proteinas, carbohidratos: m.carbohidratos, grasas: m.grasas };
}

export function SelectorAlimento({ open, onClose, onSelect, comidaId, macrosObjetivo }: SelectorAlimentoProps) {
  const t = useTranslations("diets");
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [alimentos, setAlimentos] = useState<AlimentoResult[]>([]);
  const [recetas, setRecetas] = useState<RecetaResult[]>([]);
  const [sugerencias, setSugerencias] = useState<AlimentoSugerido[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedState | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open && comidaId && macrosObjetivo) {
      setLoadingSugerencias(true);
      getSugerencias(comidaId, macrosObjetivo)
        .then(setSugerencias)
        .finally(() => setLoadingSugerencias(false));
    }
    if (!open) {
      setQuery("");
      setFiltro("todos");
      setAlimentos([]);
      setRecetas([]);
      setSugerencias([]);
      setExpanded(null);
    }
  }, [open, comidaId, macrosObjetivo]);

  if (!open) return null;

  function ejecutarBusqueda(q: string, f: Filtro) {
    if (f === "todos" && q.length < 2) {
      setAlimentos([]);
      setRecetas([]);
      return;
    }
    setLoading(true);
    buscarAlimentosYRecetas(q, f)
      .then((data) => {
        setAlimentos(data.alimentos);
        setRecetas(data.recetas);
      })
      .finally(() => setLoading(false));
  }

  function handleSearch(value: string) {
    setQuery(value);
    setExpanded(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2 && filtro === "todos") {
      setAlimentos([]);
      setRecetas([]);
      return;
    }
    debounceRef.current = setTimeout(() => ejecutarBusqueda(value, filtro), 300);
  }

  function handleFiltroChange(nuevoFiltro: Filtro) {
    setFiltro(nuevoFiltro);
    setExpanded(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    ejecutarBusqueda(query, nuevoFiltro);
  }

  function doSelect(
    alimentoId: string | null,
    recetaId: string | null,
    nombre: string,
    cantidad: number,
    unidad: string,
    calorias: number,
    proteinas: number,
    carbohidratos: number,
    grasas: number,
  ) {
    onSelect({ alimentoId, recetaId, nombre, cantidad, unidad, calorias, proteinas, carbohidratos, grasas });
    setQuery("");
    setAlimentos([]);
    setRecetas([]);
    setExpanded(null);
    onClose();
  }

  function quickAddAlimento(item: AlimentoResult | AlimentoSugerido) {
    doSelect(item.id, null, item.nombre, getCantidadDefault(item.unidad, item.porcion), item.unidad, item.calorias, item.proteinas, item.carbohidratos, item.grasas);
  }

  function quickAddReceta(item: RecetaResult) {
    doSelect(null, item.id, item.nombre, 1, "GRAMOS", item.calorias, item.proteinas, item.carbohidratos, item.grasas);
  }

  function toggleExpandAlimento(item: AlimentoResult | AlimentoSugerido) {
    if (expanded?.id === item.id && expanded.type === "alimento") {
      setExpanded(null);
    } else {
      setExpanded({
        id: item.id,
        type: "alimento",
        cantidad: getCantidadDefault(item.unidad, item.porcion),
        unidad: item.unidad,
        porcion: item.porcion,
      });
    }
  }

  function toggleExpandReceta(item: RecetaResult) {
    if (expanded?.id === item.id && expanded.type === "receta") {
      setExpanded(null);
    } else {
      setExpanded({ id: item.id, type: "receta", cantidad: 1, unidad: "PORCIONES", porcion: 1 });
    }
  }

  function addExpanded(
    alimentoId: string | null,
    recetaId: string | null,
    nombre: string,
    base: { calorias: number; proteinas: number; carbohidratos: number; grasas: number },
    unidadOriginal: string,
  ) {
    if (!expanded) return;
    doSelect(alimentoId, recetaId, nombre, expanded.cantidad, unidadOriginal, base.calorias, base.proteinas, base.carbohidratos, base.grasas);
  }

  function adjustQty(delta: number) {
    if (!expanded) return;
    const min = expanded.type === "receta" ? 0.5 : 1;
    setExpanded({ ...expanded, cantidad: Math.max(min, Math.round((expanded.cantidad + delta) * 10) / 10) });
  }

  const step = expanded
    ? (expanded.type === "receta" ? 0.5 : (expanded.unidad === "GRAMOS" || expanded.unidad === "MILILITROS") ? 10 : 1)
    : 10;

  const hasResults = alimentos.length > 0 || recetas.length > 0;
  const filtroActivo = filtro !== "todos";
  const mostrarSugerencias = query.length < 2 && !filtroActivo && sugerencias.length > 0;

  function renderExpandedView(
    itemId: string,
    alimentoId: string | null,
    recetaId: string | null,
    nombre: string,
    base: { calorias: number; proteinas: number; carbohidratos: number; grasas: number },
    esReceta: boolean,
    unidadOriginal: string,
  ) {
    if (!expanded || expanded.id !== itemId) return null;
    const unitLabel = esReceta ? "porc." : getUnidadLabel(expanded.unidad);
    const macros = scaledMacros(base, expanded.cantidad, expanded.unidad, expanded.porcion, esReceta);

    return (
      <div className="px-3 pb-3 pt-2 border-t border-border/50 bg-muted/30 rounded-b-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => adjustQty(-step)}
            className="w-8 h-8 shrink-0 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <div className="relative w-[120px]">
            <input
              type="number"
              inputMode="decimal"
              min={esReceta ? 0.5 : 1}
              max={10000}
              step={step}
              value={expanded.cantidad}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (Number.isFinite(v) && v > 0) setExpanded({ ...expanded, cantidad: v });
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full h-9 px-2 pr-10 rounded-lg border border-border bg-background text-center text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">{unitLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => adjustQty(step)}
            className="w-8 h-8 shrink-0 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="mb-2 flex justify-center">
          <MacroBadges calorias={macros.calorias} proteinas={macros.proteinas} carbohidratos={macros.carbohidratos} grasas={macros.grasas} />
        </div>
        <button
          type="button"
          onClick={() => addExpanded(alimentoId, recetaId, nombre, base, unidadOriginal)}
          className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {t("selectorAlimento.add")}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-card rounded-t-xl sm:rounded-xl border border-border shadow-xl w-full sm:max-w-lg max-h-[90dvh] sm:max-h-[80vh] flex flex-col pb-safe sm:pb-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">{t("selectorAlimento.title")}</h3>
          <button
            onClick={onClose}
            aria-label={t("selectorAlimento.close")}
            className="p-2 hover:bg-muted rounded transition-colors min-h-11 min-w-11 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={filtroActivo ? t("selectorAlimento.filterByName") : t("selectorAlimento.searchPlaceholder")}
              autoFocus
              maxLength={100}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <div className="flex gap-2 mt-3">
            {([
              { id: "todos" as const, label: t("selectorAlimento.tabAll") },
              { id: "mis-alimentos" as const, label: t("selectorAlimento.tabMyFoods") },
              { id: "mis-recetas" as const, label: t("selectorAlimento.tabMyRecipes") },
            ]).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFiltroChange(f.id)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-colors font-medium",
                  filtro === f.id
                    ? "bg-primary text-white border-primary"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Sugerencias */}
          {mostrarSugerencias && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{t("selectorAlimento.macroSuggestions")}</span>
              </div>
              <div className="space-y-1">
                {sugerencias.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-amber-100 overflow-hidden"
                  >
                    <div
                      className="w-full text-left p-3 hover:bg-amber-50 dark:hover:bg-amber-500/15 transition-colors cursor-pointer"
                      onClick={() => quickAddAlimento(s)}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{s.nombre}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full font-medium">
                            {t(`selectorAlimento.reasons.${s.razon}`)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleExpandAlimento(s); }}
                            className={cn(
                              "p-1 rounded-md border transition-colors",
                              expanded?.id === s.id ? "bg-primary/10 border-primary/30 text-primary" : "border-border/60 text-muted-foreground/50 hover:text-primary hover:border-primary/30",
                            )}
                            title={t("selectorAlimento.adjustQuantity")}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <MacroBadges calorias={s.calorias} proteinas={s.proteinas} carbohidratos={s.carbohidratos} grasas={s.grasas} />
                      </div>
                    </div>
                    {renderExpandedView(s.id, s.id, null, s.nombre, s, false, s.unidad)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingSugerencias && query.length < 2 && !filtroActivo && (
            <p className="text-xs text-muted-foreground text-center py-2">{t("selectorAlimento.calculatingSuggestions")}</p>
          )}

          {loading && (
            <p className="text-sm text-muted-foreground text-center py-4">{t("selectorAlimento.searching")}</p>
          )}

          {!loading && !hasResults && (query.length >= 2 || filtroActivo) && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {filtro === "mis-alimentos"
                ? t("selectorAlimento.noOwnFoods")
                : filtro === "mis-recetas"
                  ? t("selectorAlimento.noOwnRecipes")
                  : t("selectorAlimento.noResults")}
            </p>
          )}

          {/* Recetas */}
          {recetas.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <CookingPot className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-400">
                  {filtro === "mis-recetas" ? t("selectorAlimento.tabMyRecipes") : t("selectorAlimento.recipesSection")}
                </span>
              </div>
              <div className="space-y-1">
                {recetas.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg border border-purple-200 dark:border-purple-500/30 bg-purple-50/30 overflow-hidden"
                  >
                    <div
                      className="w-full text-left p-3 hover:bg-purple-50 dark:hover:bg-purple-500/15 transition-colors cursor-pointer"
                      onClick={() => quickAddReceta(r)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <CookingPot className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <p className="text-sm font-medium text-purple-900 dark:text-purple-200 truncate">{r.nombre}</p>
                          {r.esPropio && filtro === "todos" && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center gap-0.5 shrink-0">
                              <User className="w-2.5 h-2.5" />
                              {t("selectorAlimento.ownFeminine")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/15 px-1.5 py-0.5 rounded-full font-medium">
                            {r.porciones} porc.
                          </span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleExpandReceta(r); }}
                            className={cn(
                              "p-1 rounded-md border transition-colors",
                              expanded?.id === r.id && expanded.type === "receta" ? "bg-primary/10 border-primary/30 text-primary" : "border-purple-200 dark:border-purple-500/30 text-purple-400 hover:text-primary hover:border-primary/30",
                            )}
                            title={t("selectorAlimento.adjustQuantity")}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <MacroBadges calorias={r.calorias} proteinas={r.proteinas} carbohidratos={r.carbohidratos} grasas={r.grasas} />
                      </div>
                      {r.ingredientes.length > 0 && (
                        <p className="mt-1.5 text-[10px] text-purple-600 dark:text-purple-400 truncate">
                          {t("selectorAlimento.ingredients")} {r.ingredientes.map((i) => `${i.alimento.nombre}`).join(", ")}
                        </p>
                      )}
                    </div>
                    {renderExpandedView(r.id, null, r.id, r.nombre, r, true, "GRAMOS")}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alimentos */}
          {alimentos.length > 0 && (
            <div>
              {recetas.length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground mb-2">{t("selectorAlimento.foodsSection")}</p>
              )}
              <div className="space-y-1">
                {alimentos.map((item) => {
                  const verde = item.esPropio || filtro === "mis-alimentos";
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-lg overflow-hidden",
                        verde
                          ? "border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/30"
                          : "border border-transparent hover:border-border",
                      )}
                    >
                      <div
                        className={cn(
                          "w-full text-left p-3 transition-colors cursor-pointer",
                          verde ? "hover:bg-emerald-50 dark:hover:bg-emerald-500/15" : "hover:bg-muted",
                        )}
                        onClick={() => quickAddAlimento(item)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className={cn("text-sm font-medium truncate", verde && "text-emerald-900 dark:text-emerald-200")}>{item.nombre}</p>
                            {item.esPropio && filtro === "todos" && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center gap-0.5 shrink-0">
                                <User className="w-2.5 h-2.5" />
                                {t("selectorAlimento.ownMasculine")}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleExpandAlimento(item); }}
                            className={cn(
                              "p-1 rounded-md border transition-colors shrink-0",
                              expanded?.id === item.id && expanded.type === "alimento" ? "bg-primary/10 border-primary/30 text-primary" : "border-border/60 text-muted-foreground/50 hover:text-primary hover:border-primary/30",
                            )}
                            title={t("selectorAlimento.adjustQuantity")}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="mt-1">
                          <MacroBadges calorias={item.calorias} proteinas={item.proteinas} carbohidratos={item.carbohidratos} grasas={item.grasas} />
                        </div>
                      </div>
                      {renderExpandedView(item.id, item.id, null, item.nombre, item, false, item.unidad)}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
