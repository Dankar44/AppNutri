"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getEntradasDia } from "@/app/actions/diario";

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
  alimento: { nombre: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number } | null;
  receta: { nombre: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number } | null;
}

export default function CompararPage() {
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

  let totalCal = 0, totalProt = 0, totalCarb = 0, totalGras = 0;
  for (const e of entradas) {
    const item = e.alimento || e.receta;
    if (item && e.cantidad) {
      const factor = e.cantidad / 100;
      totalCal += item.calorias * factor;
      totalProt += item.proteinas * factor;
      totalCarb += item.carbohidratos * factor;
      totalGras += item.grasas * factor;
    }
  }

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold mb-6">Comparar con plan</h1>

      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => cambiarDia(-1)} className="p-2 rounded-lg hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm" />
        <button onClick={() => cambiarDia(1)} className="p-2 rounded-lg hover:bg-muted">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">Resumen del día (registrado)</h3>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-amber-600">{Math.round(totalCal)}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div>
            <p className="text-lg font-bold text-blue-600">{Math.round(totalProt)}g</p>
            <p className="text-xs text-muted-foreground">Proteínas</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-600">{Math.round(totalCarb)}g</p>
            <p className="text-xs text-muted-foreground">Carbos</p>
          </div>
          <div>
            <p className="text-lg font-bold text-red-600">{Math.round(totalGras)}g</p>
            <p className="text-xs text-muted-foreground">Grasas</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {TIPOS.map((tipo) => {
          const entradasTipo = entradas.filter((e) => e.tipoComida === tipo);
          return (
            <div key={tipo} className="bg-card rounded-lg border border-border p-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                {TIPO_LABELS[tipo]}
              </h4>
              {entradasTipo.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin registros</p>
              ) : (
                entradasTipo.map((e) => (
                  <p key={e.id} className="text-sm">
                    {e.alimento?.nombre || e.receta?.nombre || e.descripcion}
                    {e.cantidad && <span className="text-xs text-muted-foreground ml-1">({e.cantidad}g)</span>}
                  </p>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
