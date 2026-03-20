"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useRef } from "react";

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

export function AlimentosFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<NodeJS.Timeout>(null);

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/alimentos?${params.toString()}`);
  }

  function handleSearch(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParams("busqueda", value), 300);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar alimento..."
          defaultValue={searchParams.get("busqueda") || ""}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        />
      </div>
      <select
        defaultValue={searchParams.get("categoria") || ""}
        onChange={(e) => updateParams("categoria", e.target.value)}
        className="px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
      >
        {CATEGORIAS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
