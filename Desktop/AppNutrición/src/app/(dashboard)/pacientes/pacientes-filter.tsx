"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, List, LayoutGrid } from "lucide-react";

interface Props {
  busquedaInicial: string;
  activosInicial: boolean;
  vista: string;
}

export function PacientesFilter({ busquedaInicial, activosInicial, vista }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [soloActivos, setSoloActivos] = useState(activosInicial);

  const buildUrl = useCallback(
    (newBusqueda: string, newActivos: boolean, newVista?: string) => {
      const params = new URLSearchParams();
      if (newBusqueda) params.set("busqueda", newBusqueda);
      if (newActivos) params.set("activos", "true");
      params.set("vista", newVista || vista);
      return `/pacientes?${params.toString()}`;
    },
    [vista]
  );

  function applyFilters(newBusqueda: string, newActivos: boolean) {
    router.push(buildUrl(newBusqueda, newActivos));
  }

  return (
    <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          maxLength={100}
          onChange={(e) => {
            setBusqueda(e.target.value);
            applyFilters(e.target.value, soloActivos);
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
      </div>
      <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-card cursor-pointer hover:bg-muted/50 transition-colors shrink-0">
        <input
          type="checkbox"
          checked={soloActivos}
          onChange={(e) => {
            setSoloActivos(e.target.checked);
            applyFilters(busqueda, e.target.checked);
          }}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
        />
        <span className="text-sm whitespace-nowrap">Solo activos</span>
      </label>
      <div className="flex border border-input rounded-lg overflow-hidden shrink-0">
        <button
          onClick={() => router.push(buildUrl(busqueda, soloActivos, "tabla"))}
          className={`px-3 py-2.5 transition-colors ${vista === "tabla" ? "bg-muted text-foreground" : "bg-card text-muted-foreground hover:bg-muted/50"}`}
          title="Vista tabla"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => router.push(buildUrl(busqueda, soloActivos, "cards"))}
          className={`px-3 py-2.5 transition-colors ${vista === "cards" ? "bg-muted text-foreground" : "bg-card text-muted-foreground hover:bg-muted/50"}`}
          title="Vista tarjetas"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>
      </div>
    </div>
  );
}
