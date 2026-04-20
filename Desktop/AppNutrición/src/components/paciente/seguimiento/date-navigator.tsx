"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { formatFechaLarga, isHoy } from "@/lib/seguimiento";

interface Props {
  fecha: string;
  onChange: (fecha: string) => void;
}

export function DateNavigator({ fecha, onChange }: Props) {
  function cambiar(offset: number) {
    const d = new Date(fecha + "T12:00:00");
    d.setDate(d.getDate() + offset);
    onChange(d.toISOString().split("T")[0]);
  }

  const hoy = isHoy(fecha);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 bg-card border border-border rounded-full p-1 shadow-sm">
        <button
          onClick={() => cambiar(-1)}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Día anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <label className="relative cursor-pointer flex items-center gap-2 px-3 min-w-[180px] justify-center">
          <CalendarDays className="w-4 h-4 text-muted-foreground" aria-hidden />
          <span className="font-semibold text-sm capitalize select-none">
            {formatFechaLarga(fecha)}
          </span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Seleccionar fecha"
          />
        </label>
        <button
          onClick={() => cambiar(1)}
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Día siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {!hoy && (
        <button
          onClick={() => onChange(new Date().toISOString().split("T")[0])}
          className="text-xs text-primary hover:underline"
        >
          Volver a hoy
        </button>
      )}
    </div>
  );
}
