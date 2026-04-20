"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Dumbbell,
  UtensilsCrossed,
  StickyNote,
  Check,
  X,
  Clock,
} from "lucide-react";
import { getSeguimientoDia, type SeguimientoDia } from "@/app/actions/seguimiento";

const TIPO_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno",
  MEDIA_MANANA: "Media mañana",
  ALMUERZO: "Comida",
  MERIENDA: "Merienda",
  CENA: "Cena",
  RECENA: "Recena",
};
const TIPOS = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"];

export function SeguimientoDietistaView({ pacienteId }: { pacienteId: string }) {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<SeguimientoDia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSeguimientoDia(pacienteId, fecha)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [pacienteId, fecha]);

  function cambiarDia(offset: number) {
    const d = new Date(fecha + "T12:00:00");
    d.setDate(d.getDate() + offset);
    setFecha(d.toISOString().split("T")[0]);
  }

  const fechaLabel = new Date(fecha + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const comidas = data?.comidasData ?? [];
  const totalAlimentos = comidas.reduce((s, c) => s + c.alimentos.length, 0);
  const cumplidos = comidas.reduce(
    (s, c) => s + c.alimentos.filter((a) => a.cumplido).length,
    0
  );
  const cumplimientoPct = totalAlimentos > 0 ? Math.round((cumplidos / totalAlimentos) * 100) : 0;
  const aguaML = data?.aguaML ?? 0;

  return (
    <div>
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => cambiarDia(-1)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Día anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="font-semibold capitalize">{fechaLabel}</p>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="text-xs text-muted-foreground bg-transparent border-none text-center cursor-pointer"
          />
        </div>
        <button
          onClick={() => cambiarDia(1)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Día siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
      ) : !data ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">
            El paciente no ha registrado seguimiento este día
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Resumen KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Cumplimiento</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {cumplimientoPct}%
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {cumplidos}/{totalAlimentos} alimentos
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Agua</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {aguaML >= 1000 ? `${(aguaML / 1000).toFixed(1)}L` : `${aguaML}ml`}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Ejercicio</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {data.ejercicio ? `${data.ejercicioMinutos}'` : "No"}
              </p>
              {data.ejercicio && data.ejercicioKcal > 0 && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ~{data.ejercicioKcal} kcal
                </p>
              )}
            </div>
          </div>

          {/* Comidas */}
          {comidas.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <UtensilsCrossed className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-base font-semibold">Comidas</h2>
              </div>
              <div className="space-y-3">
                {TIPOS.map((tipo) => {
                  const c = comidas.find((x) => x.tipo === tipo);
                  if (!c || c.alimentos.length === 0) return null;
                  const allDone = c.alimentos.every((a) => a.cumplido);
                  return (
                    <div
                      key={tipo}
                      className={`rounded-xl border p-4 ${
                        allDone
                          ? "border-green-300 dark:border-green-500/40 bg-green-50/50 dark:bg-green-950/20"
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          {TIPO_LABELS[tipo] || tipo}
                          {allDone && (
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          )}
                        </h3>
                        {c.horaReal && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {c.horaReal}
                          </span>
                        )}
                      </div>
                      <ul className="space-y-1.5">
                        {c.alimentos.map((a, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2.5 text-sm"
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                a.cumplido
                                  ? "bg-green-600 text-white"
                                  : "border-2 border-border"
                              }`}
                            >
                              {a.cumplido ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <X className="w-3 h-3 text-muted-foreground" />
                              )}
                            </span>
                            <span
                              className={
                                a.cumplido
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }
                            >
                              {a.nombre}
                            </span>
                            {a.cantidad > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({a.cantidad}g)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {c.notas && (
                        <p className="text-xs text-muted-foreground mt-2 italic pt-2 border-t border-border/50">
                          “{c.notas}”
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Agua */}
          <section className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20 rounded-xl border border-blue-200 dark:border-blue-500/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              <h2 className="text-base font-semibold">Agua</h2>
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {aguaML >= 1000 ? `${(aguaML / 1000).toFixed(1)}L` : `${aguaML}ml`}
            </p>
          </section>

          {/* Ejercicio */}
          {data.ejercicio && (
            <section className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 rounded-xl border border-emerald-200 dark:border-emerald-500/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-base font-semibold">Ejercicio</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                {data.ejercicioTipo && (
                  <div>
                    <p className="text-xs text-muted-foreground">Tipo</p>
                    <p className="font-medium">{data.ejercicioTipo}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Duración</p>
                  <p className="font-medium">{data.ejercicioMinutos} min</p>
                </div>
                {data.ejercicioDistanciaKm > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Distancia</p>
                    <p className="font-medium">{data.ejercicioDistanciaKm} km</p>
                  </div>
                )}
                {data.ejercicioKcal > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Kcal</p>
                    <p className="font-medium">~{data.ejercicioKcal}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Notas */}
          {data.notas && (
            <section className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <StickyNote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h2 className="text-base font-semibold">Notas del día</h2>
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {data.notas}
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
