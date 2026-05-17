"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Sparkles, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

const VITAMINAS_FILTER = [
  { key: "vitaminaA", labelKey: "micros.vitaminaA" as const, unit: "ug" },
  { key: "vitaminaB6", labelKey: "micros.vitaminaB6" as const, unit: "mg" },
  { key: "vitaminaB12", labelKey: "micros.vitaminaB12" as const, unit: "ug" },
  { key: "vitaminaC", labelKey: "micros.vitaminaC" as const, unit: "mg" },
  { key: "vitaminaD", labelKey: "micros.vitaminaD" as const, unit: "ug" },
  { key: "vitaminaE", labelKey: "micros.vitaminaE" as const, unit: "mg" },
  { key: "vitaminaK", labelKey: "micros.vitaminaK" as const, unit: "ug" },
  { key: "tiamina", labelKey: "micros.tiamina" as const, unit: "mg" },
  { key: "riboflavina", labelKey: "micros.riboflavina" as const, unit: "mg" },
  { key: "niacina", labelKey: "micros.niacina" as const, unit: "mg" },
  { key: "folato", labelKey: "micros.folato" as const, unit: "ug" },
  { key: "acidoPantotenico", labelKey: "micros.acidoPantotenico" as const, unit: "mg" },
  { key: "colina", labelKey: "micros.colina" as const, unit: "mg" },
];
const MINERALES_FILTER = [
  { key: "calcio", labelKey: "micros.calcio" as const, unit: "mg" },
  { key: "hierro", labelKey: "micros.hierro" as const, unit: "mg" },
  { key: "magnesio", labelKey: "micros.magnesio" as const, unit: "mg" },
  { key: "fosforo", labelKey: "micros.fosforo" as const, unit: "mg" },
  { key: "potasio", labelKey: "micros.potasio" as const, unit: "mg" },
  { key: "sodio", labelKey: "micros.sodio" as const, unit: "mg" },
  { key: "cinc", labelKey: "micros.cinc" as const, unit: "mg" },
  { key: "cobre", labelKey: "micros.cobre" as const, unit: "mg" },
  { key: "manganeso", labelKey: "micros.manganeso" as const, unit: "mg" },
  { key: "selenio", labelKey: "micros.selenio" as const, unit: "ug" },
  { key: "fluor", labelKey: "micros.fluor" as const, unit: "ug" },
];
const ALL_MICRO_FILTERS = [...VITAMINAS_FILTER, ...MINERALES_FILTER];

const MACRO_PARAMS = [
  "calMin", "calMax", "protMin", "protMax",
  "carbMin", "carbMax", "grasaMin", "grasaMax",
  "tiempoMin", "tiempoMax", "ingMin", "ingMax",
] as const;

export function RecetasFilter() {
  const t = useTranslations("recipes");
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchDebounce = useRef<NodeJS.Timeout>(null);
  const numberDebounce = useRef<NodeJS.Timeout>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMicros, setShowMicros] = useState(false);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/recetas?${params.toString()}`);
  }

  function handleSearch(value: string) {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => updateParams({ busqueda: value }), 300);
  }

  function handleNumberChange(key: string, value: string) {
    if (numberDebounce.current) clearTimeout(numberDebounce.current);
    numberDebounce.current = setTimeout(() => updateParams({ [key]: value }), 500);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    for (const k of MACRO_PARAMS) params.delete(k);
    router.push(`/recetas?${params.toString()}`);
  }

  function clearMicroFilters() {
    const params = new URLSearchParams(searchParams.toString());
    for (const m of ALL_MICRO_FILTERS) params.delete(`m_${m.key}`);
    router.push(`/recetas?${params.toString()}`);
  }

  const hasFilters = MACRO_PARAMS.some((k) => searchParams.has(k));
  const hasMicroFilters = ALL_MICRO_FILTERS.some((m) => searchParams.has(`m_${m.key}`));

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex gap-1.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("filter.buscarPlaceholder")}
            defaultValue={searchParams.get("busqueda") || ""}
            onChange={(e) => handleSearch(e.target.value)}
            maxLength={100}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`relative inline-flex items-center justify-center gap-1.5 w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2.5 rounded-lg border text-sm font-medium transition-colors shrink-0 ${
            showAdvanced || hasFilters || hasMicroFilters
              ? "border-primary bg-primary/5 text-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">{t("filter.filtros")}</span>
          {(hasFilters || hasMicroFilters) && (
            <span className="absolute top-1 right-1 sm:static sm:w-2 sm:h-2 w-2 h-2 rounded-full bg-primary" />
          )}
        </button>
        <Link
          href="/recetas/nueva"
          className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
          aria-label={t("list.nuevaReceta")}
        >
          <Plus className="w-4 h-4" />
        </Link>
      </div>

      {showAdvanced && (
        <div className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("filter.filtros")}</h3>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> {t("filter.limpiarFiltros")}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <RangeInput
              label={t("filter.ingredientes")}
              minKey="ingMin"
              maxKey="ingMax"
              step={1}
              searchParams={searchParams}
              onChange={handleNumberChange}
              minPlaceholder={t("filter.min")}
              maxPlaceholder={t("filter.max")}
            />
            <RangeInput
              label={t("filter.tiempoMin")}
              minKey="tiempoMin"
              maxKey="tiempoMax"
              step={1}
              searchParams={searchParams}
              onChange={handleNumberChange}
              minPlaceholder={t("filter.min")}
              maxPlaceholder={t("filter.max")}
            />
            <RangeInput
              label={t("filter.caloriasPorcion")}
              minKey="calMin"
              maxKey="calMax"
              searchParams={searchParams}
              onChange={handleNumberChange}
              minPlaceholder={t("filter.min")}
              maxPlaceholder={t("filter.max")}
            />
            <RangeInput
              label={t("filter.proteinasPorcion")}
              minKey="protMin"
              maxKey="protMax"
              searchParams={searchParams}
              onChange={handleNumberChange}
              minPlaceholder={t("filter.min")}
              maxPlaceholder={t("filter.max")}
            />
            <RangeInput
              label={t("filter.carbosPorcion")}
              minKey="carbMin"
              maxKey="carbMax"
              searchParams={searchParams}
              onChange={handleNumberChange}
              minPlaceholder={t("filter.min")}
              maxPlaceholder={t("filter.max")}
            />
            <RangeInput
              label={t("filter.grasasPorcion")}
              minKey="grasaMin"
              maxKey="grasaMax"
              searchParams={searchParams}
              onChange={handleNumberChange}
              minPlaceholder={t("filter.min")}
              maxPlaceholder={t("filter.max")}
            />
          </div>
        </div>
      )}

      {showAdvanced && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setShowMicros(!showMicros)}
            className="w-full flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("filter.filtrosAvanzados")}</h3>
              <span className="text-xs text-muted-foreground hidden sm:inline">· {t("filter.minimosMicros")}</span>
              {hasMicroFilters && <span className="w-2 h-2 rounded-full bg-primary ml-1" />}
            </div>
            <div className="flex items-center gap-3">
              {hasMicroFilters && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); clearMicroFilters(); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); clearMicroFilters(); } }}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> {t("filter.limpiar")}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showMicros ? "rotate-180" : ""}`} />
            </div>
          </button>

          {showMicros && (
            <div className="px-3 sm:px-5 pb-3 sm:pb-5 space-y-4 sm:space-y-5 border-t border-border/60 pt-3 sm:pt-5">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("filter.vitaminas")}</h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {VITAMINAS_FILTER.map((m) => (
                    <MicroInput key={m.key} micro={{ key: m.key, label: t(m.labelKey), unit: m.unit }} searchParams={searchParams} onChange={handleNumberChange} minPlaceholder={t("filter.min")} />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("filter.minerales")}</h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {MINERALES_FILTER.map((m) => (
                    <MicroInput key={m.key} micro={{ key: m.key, label: t(m.labelKey), unit: m.unit }} searchParams={searchParams} onChange={handleNumberChange} minPlaceholder={t("filter.min")} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RangeInput({
  label,
  minKey,
  maxKey,
  step,
  searchParams,
  onChange,
  minPlaceholder,
  maxPlaceholder,
}: {
  label: string;
  minKey: string;
  maxKey: string;
  step?: number;
  searchParams: { get(key: string): string | null };
  onChange: (key: string, value: string) => void;
  minPlaceholder: string;
  maxPlaceholder: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="flex gap-1">
        <input
          type="number"
          min={0}
          {...(step ? { step } : {})}
          placeholder={minPlaceholder}
          defaultValue={searchParams.get(minKey) || ""}
          onChange={(e) => onChange(minKey, e.target.value)}
          className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <input
          type="number"
          min={0}
          {...(step ? { step } : {})}
          placeholder={maxPlaceholder}
          defaultValue={searchParams.get(maxKey) || ""}
          onChange={(e) => onChange(maxKey, e.target.value)}
          className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>
    </div>
  );
}

function MicroInput({
  micro,
  searchParams,
  onChange,
  minPlaceholder,
}: {
  micro: { key: string; label: string; unit: string };
  searchParams: { get(key: string): string | null };
  onChange: (key: string, value: string) => void;
  minPlaceholder: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block truncate">
        {micro.label} <span className="opacity-60">({micro.unit})</span>
      </label>
      <div className="relative">
        <input
          type="number"
          min={0}
          step="0.01"
          placeholder={minPlaceholder}
          defaultValue={searchParams.get(`m_${micro.key}`) || ""}
          onChange={(e) => onChange(`m_${micro.key}`, e.target.value)}
          className="w-full pl-3 pr-10 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
          ≥
        </span>
      </div>
    </div>
  );
}
