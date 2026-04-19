"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Droplets,
  Dumbbell,
  Check,
  X,
  Plus,
  Minus,
  Clock,
  UtensilsCrossed,
  ChevronLeft,
  ChevronRight,
  Save,
  StickyNote,
  Loader2,
} from "lucide-react";
import {
  getSeguimientoPacienteDia,
  guardarSeguimientoPaciente,
  getComidaDelDiaPaciente,
  type ComidaSeguimiento,
  type ComidaPlanificada,
} from "@/app/actions/seguimiento-paciente";
import { toast } from "sonner";

// ─── Helpers ───

const TIPO_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno",
  MEDIA_MANANA: "Media mañana",
  ALMUERZO: "Comida",
  MERIENDA: "Merienda",
  CENA: "Cena",
  RECENA: "Recena",
};

const TIPO_HORAS: Record<string, string> = {
  DESAYUNO: "08:00",
  MEDIA_MANANA: "11:00",
  ALMUERZO: "14:00",
  MERIENDA: "17:00",
  CENA: "21:00",
  RECENA: "23:00",
};

const TIPOS_ORDEN = [
  "DESAYUNO",
  "MEDIA_MANANA",
  "ALMUERZO",
  "MERIENDA",
  "CENA",
  "RECENA",
];

function formatFecha(fecha: string): string {
  const d = new Date(fecha + "T12:00:00");
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function estimarKcal(tipo: string, minutos: number): number {
  const metMap: Record<string, number> = {
    Carrera: 10,
    Correr: 10,
    Running: 10,
    "Bicicleta": 8,
    Ciclismo: 8,
    "Natación": 7,
    Nadar: 7,
    Caminar: 4,
    Andar: 4,
    Yoga: 3,
    Pilates: 3,
    Pesas: 5,
    Musculación: 5,
    Gimnasio: 5,
    Crossfit: 9,
    Fútbol: 8,
    Tenis: 7,
    Padel: 6,
    Pádel: 6,
    Baloncesto: 7,
    Baile: 5,
  };

  // Find a matching MET
  const tipoLower = tipo.toLowerCase();
  let met = 5; // default
  for (const [key, value] of Object.entries(metMap)) {
    if (tipoLower.includes(key.toLowerCase())) {
      met = value;
      break;
    }
  }

  // Simple estimate: kcal = MET * weight(70kg default) * hours
  return Math.round(met * 70 * (minutos / 60));
}

// ─── Main component ───

export default function SeguimientoPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Plan data
  const [comidasPlan, setComidasPlan] = useState<ComidaPlanificada[]>([]);
  const [pesoKg, setPesoKg] = useState<number | null>(null);

  // Tracking state
  const [comidasData, setComidasData] = useState<ComidaSeguimiento[]>([]);
  const [aguaML, setAguaML] = useState(0);
  const [ejercicio, setEjercicio] = useState(false);
  const [ejercicioTipo, setEjercicioTipo] = useState("");
  const [ejercicioMinutos, setEjercicioMinutos] = useState(0);
  const [ejercicioDistanciaKm, setEjercicioDistanciaKm] = useState(0);
  const [ejercicioKcal, setEjercicioKcal] = useState(0);
  const [notas, setNotas] = useState("");

  const aguaObjetivo = pesoKg ? Math.round(pesoKg * 35) : 2000;

  // ─── Load data ───
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [planData, seguimiento] = await Promise.all([
        getComidaDelDiaPaciente(fecha),
        getSeguimientoPacienteDia(fecha),
      ]);

      setComidasPlan(planData.comidas);
      setPesoKg(planData.peso);

      if (seguimiento) {
        setAguaML(seguimiento.aguaML || 0);
        setEjercicio(seguimiento.ejercicio || false);
        setEjercicioTipo(seguimiento.ejercicioTipo || "");
        setEjercicioMinutos(seguimiento.ejercicioMinutos || 0);
        setEjercicioDistanciaKm(seguimiento.ejercicioDistanciaKm || 0);
        setEjercicioKcal(seguimiento.ejercicioKcal || 0);
        setNotas(seguimiento.notas || "");

        // If we have saved comidas data, use it
        if (seguimiento.comidasData && Array.isArray(seguimiento.comidasData)) {
          setComidasData(seguimiento.comidasData);
        } else {
          // Initialize from plan
          initComidasFromPlan(planData.comidas);
        }
      } else {
        // Fresh day — initialize from plan
        setAguaML(0);
        setEjercicio(false);
        setEjercicioTipo("");
        setEjercicioMinutos(0);
        setEjercicioDistanciaKm(0);
        setEjercicioKcal(0);
        setNotas("");
        initComidasFromPlan(planData.comidas);
      }
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  function initComidasFromPlan(comidas: ComidaPlanificada[]) {
    setComidasData(
      comidas.map((c) => ({
        tipo: c.tipo,
        alimentos: c.alimentos.map((a) => ({
          nombre: a.nombre,
          cantidad: a.cantidad,
          cumplido: false,
        })),
        horaReal: null,
        notas: null,
      }))
    );
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-calculate kcal when exercise type or minutes change
  useEffect(() => {
    if (ejercicioTipo && ejercicioMinutos > 0) {
      setEjercicioKcal(estimarKcal(ejercicioTipo, ejercicioMinutos));
    }
  }, [ejercicioTipo, ejercicioMinutos]);

  // ─── Handlers ───

  function cambiarDia(offset: number) {
    const d = new Date(fecha + "T12:00:00");
    d.setDate(d.getDate() + offset);
    setFecha(d.toISOString().split("T")[0]);
  }

  function toggleAlimento(comidaIdx: number, alimentoIdx: number) {
    setComidasData((prev) => {
      const next = prev.map((c, ci) => {
        if (ci !== comidaIdx) return c;
        return {
          ...c,
          alimentos: c.alimentos.map((a, ai) => {
            if (ai !== alimentoIdx) return a;
            return { ...a, cumplido: !a.cumplido };
          }),
        };
      });
      return next;
    });
  }

  function updateHoraReal(comidaIdx: number, hora: string) {
    setComidasData((prev) =>
      prev.map((c, ci) =>
        ci === comidaIdx ? { ...c, horaReal: hora || null } : c
      )
    );
  }

  function updateNotasComida(comidaIdx: number, value: string) {
    setComidasData((prev) =>
      prev.map((c, ci) =>
        ci === comidaIdx ? { ...c, notas: value || null } : c
      )
    );
  }

  function addAgua(ml: number) {
    setAguaML((prev) => Math.max(0, Math.min(prev + ml, 10000)));
  }

  async function guardarTodo(seccion?: string) {
    setSaving(seccion || "todo");
    try {
      await guardarSeguimientoPaciente(fecha, {
        aguaML,
        ejercicio,
        ejercicioMinutos,
        ejercicioKcal,
        ejercicioTipo: ejercicioTipo || undefined,
        ejercicioDistanciaKm: ejercicioDistanciaKm || undefined,
        notas: notas || undefined,
        comidasData,
      });
      toast.success("Seguimiento guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(null);
    }
  }

  // ─── Stats ───

  const totalAlimentos = comidasData.reduce(
    (sum, c) => sum + c.alimentos.length,
    0
  );
  const alimentosCumplidos = comidasData.reduce(
    (sum, c) => sum + c.alimentos.filter((a) => a.cumplido).length,
    0
  );
  const aguaPct = Math.min(100, Math.round((aguaML / aguaObjetivo) * 100));

  // ─── Render ───

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold mb-4">
          Mi seguimiento diario
        </h1>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => cambiarDia(-1)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-semibold capitalize">{formatFecha(fecha)}</p>
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
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Comidas</p>
          <p className="text-lg font-bold text-green-600">
            {alimentosCumplidos}/{totalAlimentos}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Agua</p>
          <p className="text-lg font-bold text-blue-600">
            {aguaML >= 1000
              ? `${(aguaML / 1000).toFixed(1)}L`
              : `${aguaML}ml`}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Ejercicio</p>
          <p className="text-lg font-bold text-emerald-600">
            {ejercicio ? `${ejercicioMinutos}min` : "No"}
          </p>
        </div>
      </div>

      {/* Section 1: Comidas */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <UtensilsCrossed className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold">Comidas del día</h2>
        </div>

        {comidasData.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              No tienes un plan alimenticio activo para hoy.
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Pide a tu dietista que te asigne un plan.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {TIPOS_ORDEN.map((tipo) => {
              const comidaIdx = comidasData.findIndex((c) => c.tipo === tipo);
              if (comidaIdx === -1) return null;
              const comida = comidasData[comidaIdx];
              const todosComidos = comida.alimentos.length > 0 && comida.alimentos.every((a) => a.cumplido);

              return (
                <div
                  key={tipo}
                  className={`bg-card rounded-xl border transition-colors ${
                    todosComidos
                      ? "border-green-300 bg-green-50/50 dark:bg-green-950/20"
                      : "border-border"
                  } p-4`}
                >
                  {/* Meal header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">
                        {TIPO_LABELS[tipo] || tipo}
                      </h3>
                      {todosComidos && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{TIPO_HORAS[tipo] || ""}</span>
                    </div>
                  </div>

                  {/* Food list */}
                  <div className="space-y-2 mb-3">
                    {comida.alimentos.map((alimento, ai) => (
                      <button
                        key={ai}
                        type="button"
                        onClick={() => toggleAlimento(comidaIdx, ai)}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                          alimento.cumplido
                            ? "bg-green-100/70 dark:bg-green-900/30"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            alimento.cumplido
                              ? "bg-green-600 text-white"
                              : "border-2 border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {alimento.cumplido ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <X className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span
                            className={`text-sm ${
                              alimento.cumplido
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {alimento.nombre}
                          </span>
                          {alimento.cantidad > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({alimento.cantidad}g)
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Hora real + notas */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <input
                        type="time"
                        value={comida.horaReal || ""}
                        onChange={(e) =>
                          updateHoraReal(comidaIdx, e.target.value)
                        }
                        className="text-xs bg-muted/30 border border-border rounded-md px-2 py-1"
                        placeholder="Hora real"
                      />
                    </div>
                    <input
                      type="text"
                      value={comida.notas || ""}
                      onChange={(e) =>
                        updateNotasComida(comidaIdx, e.target.value)
                      }
                      placeholder="Notas..."
                      className="flex-1 text-xs bg-muted/30 border border-border rounded-md px-2 py-1"
                    />
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => guardarTodo("comidas")}
              disabled={saving !== null}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving === "comidas" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar comidas
            </button>
          </div>
        )}
      </section>

      {/* Section 2: Agua */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold">Agua</h2>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
          {/* Visual display */}
          <div className="flex items-center justify-center gap-6 mb-5">
            <div className="relative w-20 h-28 rounded-b-2xl rounded-t-lg border-2 border-blue-300 dark:border-blue-600 overflow-hidden bg-white/50 dark:bg-blue-950/50">
              {/* Water fill */}
              <div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-500 ease-out"
                style={{ height: `${Math.min(100, aguaPct)}%` }}
              />
              {/* Droplet icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Droplets className="w-6 h-6 text-white/80 drop-shadow" />
              </div>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {aguaML >= 1000
                  ? `${(aguaML / 1000).toFixed(1)}L`
                  : `${aguaML}ml`}
              </p>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/60">
                de{" "}
                {aguaObjetivo >= 1000
                  ? `${(aguaObjetivo / 1000).toFixed(1)}L`
                  : `${aguaObjetivo}ml`}
              </p>
              <p className="text-xs text-blue-500/60 mt-0.5">{aguaPct}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(100, aguaPct)}%` }}
            />
          </div>

          {/* Quick-add buttons */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={() => addAgua(-250)}
              className="flex items-center gap-1 bg-white/70 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors min-h-11"
            >
              <Minus className="w-3.5 h-3.5" />
              250ml
            </button>
            <button
              onClick={() => addAgua(250)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-11"
            >
              <Plus className="w-3.5 h-3.5" />
              250ml
            </button>
            <button
              onClick={() => addAgua(500)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-11"
            >
              <Plus className="w-3.5 h-3.5" />
              500ml
            </button>
            <button
              onClick={() => addAgua(1000)}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2.5 text-sm font-medium transition-colors min-h-11"
            >
              <Plus className="w-3.5 h-3.5" />
              1L
            </button>
          </div>

          <button
            onClick={() => guardarTodo("agua")}
            disabled={saving !== null}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving === "agua" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar agua
          </button>
        </div>
      </section>

      {/* Section 3: Ejercicio */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Dumbbell className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold">Ejercicio</h2>
        </div>

        <div
          className={`rounded-xl border p-5 transition-colors ${
            ejercicio
              ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800"
              : "bg-card border-border"
          }`}
        >
          {/* Toggle */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">
              ¿Has hecho ejercicio hoy?
            </span>
            <button
              onClick={() => setEjercicio(!ejercicio)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                ejercicio ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                  ejercicio ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {ejercicio && (
            <div className="space-y-3 pt-3 border-t border-emerald-200/50 dark:border-emerald-700/30">
              {/* Tipo */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Tipo de ejercicio
                </label>
                <input
                  type="text"
                  value={ejercicioTipo}
                  onChange={(e) => setEjercicioTipo(e.target.value)}
                  placeholder="Ej: Carrera, Natación, Pesas..."
                  className="w-full bg-white/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                {/* Duración */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    value={ejercicioMinutos || ""}
                    onChange={(e) =>
                      setEjercicioMinutos(
                        Math.min(1440, Math.max(0, Number(e.target.value)))
                      )
                    }
                    placeholder="45"
                    min={0}
                    max={1440}
                    className="w-full bg-white/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>

                {/* Distancia */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Distancia (km)
                  </label>
                  <input
                    type="number"
                    value={ejercicioDistanciaKm || ""}
                    onChange={(e) =>
                      setEjercicioDistanciaKm(
                        Math.min(500, Math.max(0, Number(e.target.value)))
                      )
                    }
                    placeholder="Opcional"
                    min={0}
                    step={0.1}
                    className="w-full bg-white/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Kcal estimadas */}
              {ejercicioKcal > 0 && (
                <div className="bg-emerald-100/70 dark:bg-emerald-900/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60">
                    Estimación de calorías quemadas
                  </p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    ~{ejercicioKcal} kcal
                  </p>
                </div>
              )}

              <button
                onClick={() => guardarTodo("ejercicio")}
                disabled={saving !== null}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving === "ejercicio" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Guardar ejercicio
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Section 4: Notas */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <StickyNote className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold">Notas del día</h2>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="¿Cómo te has sentido hoy? ¿Alguna observación?"
            rows={4}
            maxLength={2000}
            className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm resize-none"
          />

          <button
            onClick={() => guardarTodo("notas")}
            disabled={saving !== null}
            className="w-full mt-3 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving === "notas" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar notas
          </button>
        </div>
      </section>
    </div>
  );
}
