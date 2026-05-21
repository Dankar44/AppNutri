"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Sparkles, ChevronDown, Download, Plus } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

const CATEGORIA_KEYS = [
  { value: "", key: "todasCategorias" },
  { value: "FRUTAS", key: "frutas" },
  { value: "VERDURAS", key: "verduras" },
  { value: "CEREALES", key: "cereales" },
  { value: "LEGUMBRES", key: "legumbres" },
  { value: "CARNES", key: "carnes" },
  { value: "PESCADOS", key: "pescados" },
  { value: "LACTEOS", key: "lacteos" },
  { value: "HUEVOS", key: "huevos" },
  { value: "FRUTOS_SECOS", key: "frutosSecos" },
  { value: "ACEITES", key: "aceites" },
  { value: "BEBIDAS", key: "bebidas" },
  { value: "CONDIMENTOS", key: "condimentos" },
  { value: "DULCES", key: "dulces" },
  { value: "OTROS", key: "otros" },
] as const;

const ORIGEN_KEYS = [
  { value: "", key: "todosOrigenes" },
  { value: "PERSONALIZADO", key: "origenPersonalizado" },
  { value: "API", key: "origenImportado" },
] as const;

const VITAMINAS_FILTER = [
  { key: "vitaminaA", unit: "ug" },
  { key: "vitaminaB6", unit: "mg" },
  { key: "vitaminaB12", unit: "ug" },
  { key: "vitaminaC", unit: "mg" },
  { key: "vitaminaD", unit: "ug" },
  { key: "vitaminaE", unit: "mg" },
  { key: "vitaminaK", unit: "ug" },
  { key: "tiamina", unit: "mg" },
  { key: "riboflavina", unit: "mg" },
  { key: "niacina", unit: "mg" },
  { key: "folato", unit: "ug" },
  { key: "acidoPantotenico", unit: "mg" },
  { key: "colina", unit: "mg" },
];
const MINERALES_FILTER = [
  { key: "calcio", unit: "mg" },
  { key: "hierro", unit: "mg" },
  { key: "magnesio", unit: "mg" },
  { key: "fosforo", unit: "mg" },
  { key: "potasio", unit: "mg" },
  { key: "sodio", unit: "mg" },
  { key: "cinc", unit: "mg" },
  { key: "cobre", unit: "mg" },
  { key: "manganeso", unit: "mg" },
  { key: "selenio", unit: "ug" },
  { key: "fluor", unit: "ug" },
];
const ALL_MICRO_FILTERS = [...VITAMINAS_FILTER, ...MINERALES_FILTER];

export function AlimentosFilter({ misAlimentosCount }: { misAlimentosCount: number }) {
  const t = useTranslations("foods");
  const router = useRouter();
  const searchParams = useSearchParams();
  const propios = searchParams.get("propios") === "true";
  const searchDebounce = useRef<NodeJS.Timeout>(null);
  const macroDebounce = useRef<NodeJS.Timeout>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMicros, setShowMicros] = useState(false);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/alimentos?${params.toString()}`);
  }

  function handleSearch(value: string) {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => updateParams({ busqueda: value }), 300);
  }

  function handleMacroChange(key: string, value: string) {
    if (macroDebounce.current) clearTimeout(macroDebounce.current);
    macroDebounce.current = setTimeout(() => updateParams({ [key]: value }), 500);
  }

  function togglePropios(value: boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("propios", "true");
    else params.delete("propios");
    router.push(`/alimentos?${params.toString()}`);
  }

  function clearFilters() {
    router.push(propios ? "/alimentos?propios=true" : "/alimentos");
  }

  const hasFilters = searchParams.has("categoria") || searchParams.has("origen") ||
    searchParams.has("calMin") || searchParams.has("calMax") ||
    searchParams.has("protMin") || searchParams.has("protMax") ||
    searchParams.has("carbMin") || searchParams.has("carbMax") ||
    searchParams.has("grasaMin") || searchParams.has("grasaMax");

  const hasMicroFilters = ALL_MICRO_FILTERS.some((m) => searchParams.has(`m_${m.key}`));

  function clearMicroFilters() {
    const params = new URLSearchParams(searchParams.toString());
    for (const m of ALL_MICRO_FILTERS) params.delete(`m_${m.key}`);
    router.push(`/alimentos?${params.toString()}`);
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {/* Barra principal */}
      <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        {/* Búsqueda + botones móviles */}
        <div className="flex gap-1.5 sm:gap-2 sm:flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={propios ? t("filter.buscarPropiosPlaceholder") : t("filter.buscarPlaceholder")}
              defaultValue={searchParams.get("busqueda") || ""}
              onChange={(e) => handleSearch(e.target.value)}
              maxLength={100}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`sm:hidden relative inline-flex items-center justify-center w-10 h-10 rounded-lg border text-sm shrink-0 transition-colors ${
              showAdvanced || hasFilters || hasMicroFilters
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:bg-muted text-muted-foreground"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {(hasFilters || hasMicroFilters) && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
          <Link
            href="/alimentos/importar"
            data-tour="import-btn"
            className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border hover:bg-muted transition-colors shrink-0"
            aria-label={t("list.importar")}
          >
            <Download className="w-4 h-4" />
          </Link>
          <Link
            href="/alimentos/nuevo"
            className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            aria-label={t("list.nuevoAlimento")}
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>

        {/* Toggle Todos / Míos */}
        <div className="flex rounded-lg border border-border overflow-hidden sm:shrink-0">
          <button
            onClick={() => togglePropios(false)}
            aria-pressed={!propios}
            className={`flex-1 sm:flex-none px-3 py-2 text-sm font-medium transition-colors ${!propios ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            {t("filter.todos")}
          </button>
          <button
            onClick={() => togglePropios(true)}
            aria-pressed={propios}
            title={t("filter.verSoloPropios")}
            className={`flex-1 sm:flex-none px-3 py-2 text-sm font-medium transition-colors ${propios ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >
            <span className="hidden sm:inline">{t("filter.misAlimentos")}</span>
            <span className="sm:hidden">{t("filter.mios")}</span>
            {misAlimentosCount > 0 && (
              <span className="ml-1 text-xs opacity-80">({misAlimentosCount})</span>
            )}
          </button>
        </div>

        {/* Desktop: Categoría + botón filtros */}
        <select
          defaultValue={searchParams.get("categoria") || ""}
          onChange={(e) => updateParams({ categoria: e.target.value })}
          className="hidden sm:block sm:flex-none px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        >
          {CATEGORIA_KEYS.map((c) => (
            <option key={c.value} value={c.value}>{t(c.value ? `categorias.${c.key}` : `filter.${c.key}`)}</option>
          ))}
        </select>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors shrink-0 ${
            showAdvanced || hasFilters
              ? "border-primary bg-primary/5 text-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {t("filter.filtros")}
          {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
        </button>
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div data-tour="food-filters" className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("filter.filtros")}</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> {t("filter.limpiarFiltros")}
              </button>
            )}
          </div>

          <div className={`grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 ${propios ? "lg:grid-cols-4" : "lg:grid-cols-5"} gap-3 sm:gap-4`}>
            <div className="sm:hidden">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("filter.categoria")}</label>
              <select
                defaultValue={searchParams.get("categoria") || ""}
                onChange={(e) => updateParams({ categoria: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">{t("filter.todas")}</option>
                {CATEGORIA_KEYS.filter((c) => c.value).map((c) => (
                  <option key={c.value} value={c.value}>{t(`categorias.${c.key}`)}</option>
                ))}
              </select>
            </div>
            {!propios && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("filter.origen")}</label>
                <select
                  defaultValue={searchParams.get("origen") || ""}
                  onChange={(e) => updateParams({ origen: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">{t("filter.todos")}</option>
                  {ORIGEN_KEYS.filter((o) => o.value).map((o) => (
                    <option key={o.value} value={o.value}>{t(`filter.${o.key}`)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Calorías */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("filter.caloriasPor100g")}</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder={t("filter.min")}
                  defaultValue={searchParams.get("calMin") || ""}
                  onChange={(e) => handleMacroChange("calMin", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder={t("filter.max")}
                  defaultValue={searchParams.get("calMax") || ""}
                  onChange={(e) => handleMacroChange("calMax", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("filter.proteinasPor100g")}</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder={t("filter.min")}
                  defaultValue={searchParams.get("protMin") || ""}
                  onChange={(e) => handleMacroChange("protMin", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder={t("filter.max")}
                  defaultValue={searchParams.get("protMax") || ""}
                  onChange={(e) => handleMacroChange("protMax", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("filter.carbosPor100g")}</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder={t("filter.min")}
                  defaultValue={searchParams.get("carbMin") || ""}
                  onChange={(e) => handleMacroChange("carbMin", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder={t("filter.max")}
                  defaultValue={searchParams.get("carbMax") || ""}
                  onChange={(e) => handleMacroChange("carbMax", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("filter.grasasPor100g")}</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder={t("filter.min")}
                  defaultValue={searchParams.get("grasaMin") || ""}
                  onChange={(e) => handleMacroChange("grasaMin", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder={t("filter.max")}
                  defaultValue={searchParams.get("grasaMax") || ""}
                  onChange={(e) => handleMacroChange("grasaMax", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
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
                    <MicroInput key={m.key} micro={m} label={t(`micronutrientes.${m.key}`)} searchParams={searchParams} onChange={handleMacroChange} minPlaceholder={t("filter.min")} />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t("filter.minerales")}</h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {MINERALES_FILTER.map((m) => (
                    <MicroInput key={m.key} micro={m} label={t(`micronutrientes.${m.key}`)} searchParams={searchParams} onChange={handleMacroChange} minPlaceholder={t("filter.min")} />
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

function MicroInput({
  micro,
  label,
  searchParams,
  onChange,
  minPlaceholder,
}: {
  micro: { key: string; unit: string };
  label: string;
  searchParams: { get(key: string): string | null };
  onChange: (key: string, value: string) => void;
  minPlaceholder: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block truncate">
        {label} <span className="opacity-60">({micro.unit})</span>
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
