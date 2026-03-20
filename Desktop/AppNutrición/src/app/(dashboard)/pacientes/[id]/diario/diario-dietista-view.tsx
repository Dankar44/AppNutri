"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getEntradasDiarioDietista } from "@/app/actions/diario";
import { MacroBadges } from "@/components/macro-badge";
import { calcularMacrosPorcion } from "@/lib/macros";

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

export function DiarioDietistaView({ pacienteId }: { pacienteId: string }) {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getEntradasDiarioDietista(pacienteId, fecha)
      .then((data) => setEntradas(data as Entrada[]))
      .finally(() => setLoading(false));
  }, [pacienteId, fecha]);

  function cambiarDia(offset: number) {
    const d = new Date(fecha);
    d.setDate(d.getDate() + offset);
    setFecha(d.toISOString().split("T")[0]);
  }

  const fechaLabel = new Date(fecha).toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });

  let totalCal = 0, totalProt = 0, totalCarb = 0, totalGras = 0;
  for (const e of entradas) {
    const item = e.alimento || e.receta;
    if (item && e.cantidad) {
      const macros = calcularMacrosPorcion(
        { calorias: item.calorias, proteinas: item.proteinas, carbohidratos: item.carbohidratos, grasas: item.grasas, fibra: 0 },
        e.cantidad
      );
      totalCal += macros.calorias;
      totalProt += macros.proteinas;
      totalCarb += macros.carbohidratos;
      totalGras += macros.grasas;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => cambiarDia(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-semibold capitalize">{fechaLabel}</p>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            className="text-xs text-muted-foreground bg-transparent border-none text-center cursor-pointer" />
        </div>
        <button onClick={() => cambiarDia(1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {entradas.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3">Resumen del día</h3>
          <MacroBadges calorias={Math.round(totalCal)} proteinas={Math.round(totalProt * 10) / 10} carbohidratos={Math.round(totalCarb * 10) / 10} grasas={Math.round(totalGras * 10) / 10} size="md" />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : entradas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">
            El paciente no ha registrado comidas este día
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {TIPOS.map((tipo) => {
            const entradasTipo = entradas.filter((e) => e.tipoComida === tipo);
            if (entradasTipo.length === 0) return null;
            return (
              <div key={tipo} className="bg-card rounded-lg border border-border p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  {TIPO_LABELS[tipo]}
                </h4>
                <div className="space-y-2">
                  {entradasTipo.map((e) => {
                    const item = e.alimento || e.receta;
                    const macros = item && e.cantidad
                      ? calcularMacrosPorcion(
                          { calorias: item.calorias, proteinas: item.proteinas, carbohidratos: item.carbohidratos, grasas: item.grasas, fibra: 0 },
                          e.cantidad
                        )
                      : null;
                    return (
                      <div key={e.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {item?.nombre || e.descripcion || "Sin descripción"}
                          </p>
                          {e.cantidad && (
                            <p className="text-xs text-muted-foreground">{e.cantidad}g</p>
                          )}
                        </div>
                        {macros && (
                          <MacroBadges calorias={macros.calorias} proteinas={macros.proteinas} carbohidratos={macros.carbohidratos} grasas={macros.grasas} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
