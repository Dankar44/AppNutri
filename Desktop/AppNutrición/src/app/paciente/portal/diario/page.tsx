"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { getEntradasDia, eliminarEntradaDiario } from "@/app/actions/diario";
import { toast } from "sonner";

const TIPO_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno", MEDIA_MANANA: "Media mañana", ALMUERZO: "Almuerzo",
  MERIENDA: "Merienda", CENA: "Cena", RECENA: "Recena",
};

const TIPOS = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"];

interface Entrada {
  id: string;
  tipoComida: string;
  descripcion: string | null;
  cantidad: number | null;
  alimento: { nombre: string; calorias: number } | null;
  receta: { nombre: string; calorias: number } | null;
}

export default function DiarioPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [entradas, setEntradas] = useState<Entrada[]>([]);

  useEffect(() => {
    getEntradasDia(fecha).then((data) => setEntradas(data as Entrada[]));
  }, [fecha]);

  function cambiarDia(offset: number) {
    const d = new Date(fecha);
    d.setDate(d.getDate() + offset);
    setFecha(d.toISOString().split("T")[0]);
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarEntradaDiario(id);
      setEntradas((prev) => prev.filter((e) => e.id !== id));
      toast.success("Entrada eliminada");
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al eliminar");
    }
  }

  const fechaLabel = new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Mi diario</h1>
        <Link
          href="/paciente/portal/diario/comparar"
          className="text-sm text-primary hover:underline font-medium"
        >
          Comparar con plan
        </Link>
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
        <button
          onClick={() => cambiarDia(-1)}
          aria-label="Día anterior"
          className="p-2.5 rounded-lg hover:bg-muted transition-colors min-h-11 min-w-11 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1 min-w-0">
          <p className="font-semibold capitalize text-sm sm:text-base">{fechaLabel}</p>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="text-xs sm:text-sm text-muted-foreground bg-transparent border border-border sm:border-transparent rounded px-2 py-1 text-center cursor-pointer"
          />
        </div>
        <button
          onClick={() => cambiarDia(1)}
          aria-label="Día siguiente"
          className="p-2.5 rounded-lg hover:bg-muted transition-colors min-h-11 min-w-11 flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {TIPOS.map((tipo) => {
          const entradasTipo = entradas.filter((e) => e.tipoComida === tipo);
          return (
            <div key={tipo} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{TIPO_LABELS[tipo]}</h3>
                <Link
                  href={`/paciente/portal/diario/nueva-entrada?fecha=${fecha}&tipo=${tipo}`}
                  className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </Link>
              </div>
              {entradasTipo.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin registros</p>
              ) : (
                <div className="space-y-1">
                  {entradasTipo.map((e) => (
                    <div key={e.id} className="flex items-center justify-between gap-2 text-sm group">
                      <span className="min-w-0 flex-1 truncate">
                        {e.alimento?.nombre || e.receta?.nombre || e.descripcion || "Sin descripción"}
                        {e.cantidad && <span className="text-muted-foreground text-xs ml-1">({e.cantidad}g)</span>}
                      </span>
                      <button
                        onClick={() => handleEliminar(e.id)}
                        aria-label="Eliminar entrada"
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors sm:opacity-0 sm:group-hover:opacity-100 min-h-10 min-w-10 sm:min-h-0 sm:min-w-0 flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
