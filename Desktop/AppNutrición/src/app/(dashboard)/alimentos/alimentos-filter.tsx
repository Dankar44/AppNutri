"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
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

export function AlimentosFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<NodeJS.Timeout>(null);
  const [showAdvanced, setShowAdvanced] = useState(true);

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`/alimentos?${params.toString()}`);
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams({ busqueda: value }), 300);
  }

  function clearFilters() {
    router.push("/alimentos");
  }

  const hasFilters = searchParams.has("categoria") || searchParams.has("origen") ||
    searchParams.has("calMin") || searchParams.has("calMax") ||
    searchParams.has("protMin") || searchParams.has("protMax") ||
    searchParams.has("carbMin") || searchParams.has("carbMax") ||
    searchParams.has("grasaMin") || searchParams.has("grasaMax");

  return (
    <div className="mb-6 space-y-3">
      {/* Barra principal */}
      <div className="flex gap-3">
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
        <select
          defaultValue={searchParams.get("categoria") || ""}
          onChange={(e) => updateParams({ categoria: e.target.value })}
          className="px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        >
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            showAdvanced || hasFilters
              ? "border-primary bg-primary/5 text-primary"
              : "border-border hover:bg-muted"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filtros</span>
          {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
        </button>
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Filtros avanzados</h3>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Limpiar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
                  onChange={(e) => { if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => updateParams({ calMin: e.target.value }), 500); }}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  defaultValue={searchParams.get("calMax") || ""}
                  onChange={(e) => { if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => updateParams({ calMax: e.target.value }), 500); }}
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
                  onChange={(e) => { if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => updateParams({ protMin: e.target.value }), 500); }}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  defaultValue={searchParams.get("protMax") || ""}
                  onChange={(e) => { if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => updateParams({ protMax: e.target.value }), 500); }}
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
                  onChange={(e) => { if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => updateParams({ carbMin: e.target.value }), 500); }}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  defaultValue={searchParams.get("carbMax") || ""}
                  onChange={(e) => { if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => updateParams({ carbMax: e.target.value }), 500); }}
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
                  onChange={(e) => { if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => updateParams({ grasaMin: e.target.value }), 500); }}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  defaultValue={searchParams.get("grasaMax") || ""}
                  onChange={(e) => { if (debounceRef.current) clearTimeout(debounceRef.current); debounceRef.current = setTimeout(() => updateParams({ grasaMax: e.target.value }), 500); }}
                  className="w-full px-2 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
