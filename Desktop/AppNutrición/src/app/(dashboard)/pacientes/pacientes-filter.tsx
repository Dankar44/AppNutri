"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search } from "lucide-react";

interface Props {
  busquedaInicial: string;
  activosInicial: boolean;
}

export function PacientesFilter({ busquedaInicial, activosInicial }: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState(busquedaInicial);
  const [soloActivos, setSoloActivos] = useState(activosInicial);

  const applyFilters = useCallback(
    (newBusqueda: string, newActivos: boolean) => {
      const params = new URLSearchParams();
      if (newBusqueda) params.set("busqueda", newBusqueda);
      if (newActivos) params.set("activos", "true");
      router.push(`/pacientes?${params.toString()}`);
    },
    [router]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            applyFilters(e.target.value, soloActivos);
          }}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
        />
      </div>
      <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-white cursor-pointer hover:bg-muted/50 transition-colors">
        <input
          type="checkbox"
          checked={soloActivos}
          onChange={(e) => {
            setSoloActivos(e.target.checked);
            applyFilters(busqueda, e.target.checked);
          }}
          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="text-sm whitespace-nowrap">Solo activos</span>
      </label>
    </div>
  );
}
