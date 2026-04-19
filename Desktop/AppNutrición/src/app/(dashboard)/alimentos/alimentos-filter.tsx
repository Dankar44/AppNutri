"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Sparkles, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";

const CATEGORIAS = [
  { value: "", label: "Todas las categorías" },
  { value: "FRUTAS", label: "Frutas" },
  { value: "VERDURAS", label: "Verduras" },
  { value: "CEREALES", label: "Cereales" },
  { value: "LEGUMBRES", label: "Legumbres" },
  { value: "CARNES", label: "Carnes" },
  { value: "PESCADOS", label: "Pescados" },
  { value: "LACTEOS", label: "Lácteos" },
  { value: "HUEVOS", label: "Huevos" },
  { value: "FRUTOS_SECOS", label: "Frutos secos" },
  { value: "ACEITES", label: "Aceites" },
  { value: "BEBIDAS", label: "Bebidas" },
  { value: "CONDIMENTOS", label: "Condimentos" },
  { value: "DULCES", label: "Dulces" },
  { value: "OTROS", label: "Otros" },
];

const ORIGENES = [
  { value: "", label: "Todos los orígenes" },
  { value: "PERSONALIZADO", label: "Personalizado" },
  { value: "API", label: "Importado" },
];

const VITAMINAS_FILTER = [
  { key: "vitaminaA", label: "Vitamina A", unit: "ug" },
  { key: "vitaminaB6", label: "Vitamina B6", unit: "mg" },
  { key: "vitaminaB12", label: "Vitamina B12", unit: "ug" },
  { key: "vitaminaC", label: "Vitamina C", unit: "mg" },
  { key: "vitaminaD", label: "Vitamina D", unit: "ug" },
  { key: "vitaminaE", label: "Vitamina E", unit: "mg" },
  { key: "vitaminaK", label: "Vitamina K", unit: "ug" },
  { key: "tiamina", label: "Tiamina (B1)", unit: "mg" },
  { key: "riboflavina", label: "Riboflavina (B2)", unit: "mg" },
  { key: "niacina", label: "Niacina (B3)", unit: "mg" },
  { key: "folato", label: "Folato (B9)", unit: "ug" },
  { key: "acidoPantotenico", label: "Ác. Pantoténico", unit: "mg" },
  { key: "colina", label: "Colina", unit: "mg" },
];
const MINERALES_FILTER = [
  { key: "calcio", label: "Calcio", unit: "mg" },
  { key: "hierro", label: "Hierro", unit: "mg" },
  { key: "magnesio", label: "Magnesio", unit: "mg" },
  { key: "fosforo", label: "Fósforo", unit: "mg" },
  { key: "potasio", label: "Potasio", unit: "mg" },
  { key: "sodio", label: "Sodio", unit: "mg" },
  { key: "cinc", label: "Cinc", unit: "mg" },
  { key: "cobre", label: "Cobre", unit: "mg" },
  { key: "manganeso", label: "Manganeso", unit: "mg" },
  { key: "selenio", label: "Selenio", unit: "ug" },
  { key: "fluor", label: "Flúor", unit: "ug" },
];
const ALL_MICRO_FILTERS = [...VITAMINAS_FILTER, ...MINERALES_FILTER];

export function AlimentosFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchDebounce = useRef<NodeJS.Timeout>(null);
  const macroDebounce = useRef<NodeJS.Timeout>(null);
  const [showAdvanced, setShowAdvanced] = useState(true);
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

  function clearFilters() {
    router.push("/alimentos");
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
    <div className="mb-6 space-y-3">
      {/* Barra principal */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar alimento..."
            defaultValue={searchParams.get("busqueda") || ""}
            onChange={(e) => handleSearch(e.target.value)}
            maxLength={100}
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
        <div className="flex gap-2 sm:gap-3">
          <select
            defaultValue={searchParams.get("categoria") || ""}
            onChange={(e) => updateParams({ categoria: e.target.value })}
            className="flex-1 sm:flex-none px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors shrink-0 ${
              showAdvanced || hasFilters
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:bg-muted"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden xs:inline">Filtros</span>
            {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
          </button>
        </div>
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div data-tour="food-filters" className="bg-card rounded-xl border border-border p-3 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filtros</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Origen */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Origen</label>
              <select
                defaultValue={searchParams.get("origen") || ""}
                onChange={(e) => updateParams({ origen: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {ORIGENES.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Calorías */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Calorías /100g</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Mín"
                  defaultValue={searchParams.get("calMin") || ""}
                  onChange={(e) => handleMacroChange("calMin", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  defaultValue={searchParams.get("calMax") || ""}
                  onChange={(e) => handleMacroChange("calMax", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Proteínas */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Proteínas /100g</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Mín"
                  defaultValue={searchParams.get("protMin") || ""}
                  onChange={(e) => handleMacroChange("protMin", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  defaultValue={searchParams.get("protMax") || ""}
                  onChange={(e) => handleMacroChange("protMax", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Carbohidratos */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Carbos /100g</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Mín"
                  defaultValue={searchParams.get("carbMin") || ""}
                  onChange={(e) => handleMacroChange("carbMin", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  defaultValue={searchParams.get("carbMax") || ""}
                  onChange={(e) => handleMacroChange("carbMax", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Grasas */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Grasas /100g</label>
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Mín"
                  defaultValue={searchParams.get("grasaMin") || ""}
                  onChange={(e) => handleMacroChange("grasaMin", e.target.value)}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder="Máx"
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
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">Filtros avanzados</h3>
              <span className="text-xs text-muted-foreground">· Mínimos de vitaminas y minerales por 100g</span>
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
                  <X className="w-3 h-3" /> Limpiar
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showMicros ? "rotate-180" : ""}`} />
            </div>
          </button>

          {showMicros && (
            <div className="px-5 pb-5 space-y-5 border-t border-border/60 pt-5">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Vitaminas</h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {VITAMINAS_FILTER.map((m) => (
                    <MicroInput key={m.key} micro={m} searchParams={searchParams} onChange={handleMacroChange} />
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Minerales</h4>
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {MINERALES_FILTER.map((m) => (
                    <MicroInput key={m.key} micro={m} searchParams={searchParams} onChange={handleMacroChange} />
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
  searchParams,
  onChange,
}: {
  micro: { key: string; label: string; unit: string };
  searchParams: { get(key: string): string | null };
  onChange: (key: string, value: string) => void;
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
          placeholder="Mín"
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
