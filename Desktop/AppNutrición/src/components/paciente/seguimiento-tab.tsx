"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Dumbbell,
  Check,
  X,
  Heart,
  Clock,
  Flame,
  MapPin,
  Coffee,
  Apple,
  UtensilsCrossed,
  Cookie,
  Moon,
  Filter,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSeguimientoMes,
  getSeguimientoDia,
  getActividadesPaciente,
  type SeguimientoDia,
  type ActividadPaciente,
  calcularMacrosDia,
} from "@/app/actions/seguimiento";

// ─── Props ───

interface SeguimientoTabProps {
  pacienteId: string;
  pacienteNombre: string;
  pacientePeso?: number | null;
}

// ─── Constants ───

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const COMIDAS = [
  { key: "desayuno", label: "Desayuno", icon: Coffee },
  { key: "media-manana", label: "Media mañana", icon: Apple },
  { key: "comida", label: "Comida", icon: UtensilsCrossed },
  { key: "merienda", label: "Merienda", icon: Cookie },
  { key: "cena", label: "Cena", icon: Moon },
  { key: "recena", label: "Recena", icon: Moon },
] as const;

const HORAS_DEFAULT: Record<string, string> = {
  desayuno: "08h30",
  "media-manana": "11h00",
  comida: "14h00",
  merienda: "17h00",
  cena: "20h30",
  recena: "23h00",
};

const MICRO_DDR = [
  { key: "acidoPantotenico", label: "Ác. Pantoténico", ddr: 5 },
  { key: "calcio", label: "Calcio", ddr: 1000 },
  { key: "cinc", label: "Cinc", ddr: 8 },
  { key: "cobre", label: "Cobre", ddr: 0.9 },
  { key: "colina", label: "Colina", ddr: 425 },
  { key: "fluor", label: "Flúor", ddr: 3000 },
  { key: "folato", label: "Folato", ddr: 400 },
  { key: "fosforo", label: "Fósforo", ddr: 700 },
  { key: "hierro", label: "Hierro", ddr: 18 },
  { key: "magnesio", label: "Magnesio", ddr: 320 },
  { key: "manganeso", label: "Manganeso", ddr: 1.8 },
  { key: "niacina", label: "Niacina", ddr: 14 },
  { key: "potasio", label: "Potasio", ddr: 4700 },
  { key: "riboflavina", label: "Riboflavina", ddr: 1.1 },
  { key: "selenio", label: "Selenio", ddr: 55 },
  { key: "sodio", label: "Sodio", ddr: 1500 },
  { key: "tiamina", label: "Tiamina", ddr: 1.1 },
  { key: "vitaminaA", label: "Vitamina A", ddr: 700 },
  { key: "vitaminaB12", label: "Vitamina B12", ddr: 2.4 },
  { key: "vitaminaB6", label: "Vitamina B6", ddr: 1.3 },
  { key: "vitaminaC", label: "Vitamina C", ddr: 75 },
  { key: "vitaminaD", label: "Vitamina D", ddr: 15 },
  { key: "vitaminaE", label: "Vitamina E", ddr: 15 },
  { key: "vitaminaK", label: "Vitamina K", ddr: 90 },
];

const FILTROS_ACTIVIDAD = [
  { value: "", label: "Todas las actividades" },
  { value: "consulta", label: "Consultas" },
  { value: "diario", label: "Diario alimentario" },
  { value: "ejercicio", label: "Actividad física" },
] as const;

const AGUA_OBJETIVO_ML = 2000;

// ─── Helpers ───

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Returns 0=Mon..6=Sun for the first day of the month. */
function getFirstDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function toDateStr(y: number, m: number, d: number): string {
  // m is 1-indexed (enero=1)
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatFechaLarga(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = String(d.getDate()).padStart(2, "0");
  const mes = MESES_CORTOS[d.getMonth()];
  const anio = d.getFullYear();
  return `${day} de ${mes} de ${anio}`;
}

function formatFechaActividad(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const day = d.getDate();
  const mes = MESES_CORTOS[d.getMonth()];
  const anio = d.getFullYear();
  return `${day} ${mes} ${anio}`;
}

function isSameDay(d1: string, d2: string): boolean {
  return d1 === d2;
}

function isToday(y: number, m: number, d: number): boolean {
  const today = new Date();
  return (
    today.getFullYear() === y &&
    today.getMonth() + 1 === m &&
    today.getDate() === d
  );
}

// ─── Component ───

export function SeguimientoTab({
  pacienteId,
  pacienteNombre,
  pacientePeso,
}: SeguimientoTabProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const now = new Date();
    return toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());
  });
  const [monthData, setMonthData] = useState<SeguimientoDia[]>([]);
  const [dayData, setDayData] = useState<SeguimientoDia | null>(null);
  const [dayMacros, setDayMacros] = useState<{ macros: { calorias: number; proteinas: number; carbohidratos: number; grasas: number; fibra: number }; micro: Record<string, number> } | null>(null);
  const [actividades, setActividades] = useState<ActividadPaciente[]>([]);
  const [actividadFilter, setActividadFilter] = useState("");
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingActividades, setLoadingActividades] = useState(false);

  // Build a map from date string to SeguimientoDia for fast lookup
  const dayMap = useMemo(() => {
    const map = new Map<string, SeguimientoDia>();
    for (const d of monthData) {
      // Parse date avoiding timezone issues — pg returns DATE as UTC midnight
      let fecha: string;
      if (typeof d.fecha === "string") {
        fecha = (d.fecha as string).slice(0, 10);
      } else {
        const dt = new Date(d.fecha);
        fecha = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
      }
      map.set(fecha, d);
    }
    return map;
  }, [monthData]);

  // Load month data
  const loadMonth = useCallback(async () => {
    setLoadingMonth(true);
    try {
      const data = await getSeguimientoMes(
        pacienteId,
        currentYear,
        currentMonth
      );
      setMonthData(data);
    } catch {
      setMonthData([]);
    }
    setLoadingMonth(false);
  }, [pacienteId, currentYear, currentMonth]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  // Load day data when date is selected
  useEffect(() => {
    if (!selectedDate) {
      setDayData(null);
      setDayMacros(null);
      return;
    }
    let cancelled = false;
    setLoadingDay(true);
    Promise.all([
      getSeguimientoDia(pacienteId, selectedDate),
      calcularMacrosDia(pacienteId, selectedDate),
    ])
      .then(([data, macros]) => {
        if (!cancelled) {
          setDayData(data);
          setDayMacros(macros);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDayData(null);
          setDayMacros(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDay(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pacienteId, selectedDate]);

  // Load actividades
  const loadActividades = useCallback(async () => {
    setLoadingActividades(true);
    try {
      const data = await getActividadesPaciente(
        pacienteId,
        actividadFilter || undefined
      );
      setActividades(data);
    } catch {
      setActividades([]);
    }
    setLoadingActividades(false);
  }, [pacienteId, actividadFilter]);

  useEffect(() => {
    loadActividades();
  }, [loadActividades]);

  // Navigation
  function goToPrevMonth() {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function goToNextMonth() {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  function goToToday() {
    const t = new Date();
    setCurrentYear(t.getFullYear());
    setCurrentMonth(t.getMonth() + 1);
    setSelectedDate(toDateStr(t.getFullYear(), t.getMonth() + 1, t.getDate()));
  }

  // Calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfWeek(currentYear, currentMonth);
  const calendarCells: (number | null)[] = [];

  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }
  // Pad the end to complete the last row
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null);
  }

  const monthLabel = `${MESES[currentMonth - 1]} de ${currentYear}`;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
      {/* ─── Left: Calendar + Day Detail ─── */}
      <div className="space-y-6 min-w-0">
        {/* Calendar Card */}
        <div className="bg-card rounded-xl border border-border p-5">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-foreground">
              {monthLabel}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar grid with outer border */}
          <div className="border border-border rounded-xl">
          <div className="grid grid-cols-7 border-b border-border bg-muted/20">
            {DIAS_SEMANA.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-bold text-muted-foreground py-2 border-r border-border last:border-r-0 italic"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          {loadingMonth ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="min-h-[110px] border-r border-b border-border last:border-r-0 bg-muted/10" />;
                }

                const dateStr = toDateStr(currentYear, currentMonth, day);
                const dayInfo = dayMap.get(dateStr);
                const isSelected = selectedDate ? isSameDay(selectedDate, dateStr) : false;
                const isTodayCell = isToday(currentYear, currentMonth, day);
                const hasData = !!dayInfo;
                const cumplido = dayInfo?.cumplido ?? false;
                const hasEjercicio = dayInfo?.ejercicio ?? false;
                const aguaML = dayInfo?.aguaML ?? 0;
                const aguaPct = Math.min((aguaML / AGUA_OBJETIVO_ML) * 100, 100);

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      "flex flex-col p-2 min-h-[110px] border-r border-b border-border last:border-r-0 transition-colors text-left",
                      isSelected
                        ? "bg-primary/5 ring-2 ring-inset ring-primary/30"
                        : "hover:bg-muted/30"
                    )}
                  >
                    {/* Day number */}
                    <span
                      className={cn(
                        "text-sm tabular-nums self-end mb-2",
                        isTodayCell
                          ? "text-primary font-bold"
                          : "text-muted-foreground"
                      )}
                    >
                      {day}
                    </span>

                    {/* Compliance bar — with tooltip */}
                    <div className="relative group/bar w-full">
                      <div
                        className={cn(
                          "w-full h-7 rounded-lg",
                          cumplido
                            ? "bg-emerald-400"
                            : hasData
                              ? "bg-amber-300"
                              : "bg-muted/60"
                        )}
                      />
                      {hasData && (
                        <div className="hidden group-hover/bar:block absolute -top-8 left-1/2 -translate-x-1/2 z-50">
                          <div className="bg-gray-700 text-white text-[11px] font-medium px-3 py-1 rounded-lg whitespace-nowrap shadow-lg">
                            {cumplido ? "Cumplido" : "Cambios"}
                          </div>
                          <div className="w-2 h-2 bg-gray-700 rotate-45 mx-auto -mt-1" />
                        </div>
                      )}
                    </div>

                    {/* Water bar + exercise icon row */}
                    <div className="flex items-center gap-1 w-full mt-1.5">
                      <Droplets className={cn("w-3 h-3 shrink-0", aguaML > 0 ? "text-blue-400" : "text-muted-foreground/30")} />
                      <div className="relative group/water flex-1">
                        <div className="h-4 rounded bg-blue-100/60 overflow-hidden">
                          <div className="h-full rounded bg-blue-400/70 transition-all" style={{ width: `${aguaPct}%` }} />
                        </div>
                        {aguaML > 0 && (
                          <div className="hidden group-hover/water:block absolute -top-8 left-1/2 -translate-x-1/2 z-50">
                            <div className="bg-gray-700 text-white text-[11px] font-medium px-3 py-1 rounded-lg whitespace-nowrap shadow-lg">
                              Ingesta de agua: {Math.round(aguaPct)}% del objetivo
                            </div>
                            <div className="w-2 h-2 bg-gray-700 rotate-45 mx-auto -mt-1" />
                          </div>
                        )}
                      </div>
                      <div className="relative group/exercise">
                        {hasEjercicio ? (
                          <Dumbbell className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Dumbbell className="w-3.5 h-3.5 text-muted-foreground/25 shrink-0" />
                        )}
                        {hasEjercicio && (
                          <div className="hidden group-hover/exercise:block absolute -top-8 left-1/2 -translate-x-1/2 z-50">
                            <div className="bg-gray-700 text-white text-[11px] font-medium px-3 py-1 rounded-lg whitespace-nowrap shadow-lg">
                              Hizo ejercicio físico en este día
                            </div>
                            <div className="w-2 h-2 bg-gray-700 rotate-45 mx-auto -mt-1" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          </div>{/* close border wrapper */}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-muted-foreground">
                Cumplido
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[10px] text-muted-foreground">
                Con datos
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-muted" />
              <span className="text-[10px] text-muted-foreground">
                Sin datos
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-2.5 h-2.5 text-blue-500" />
              <span className="text-[10px] text-muted-foreground">Agua</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-2.5 h-2.5 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground">
                Ejercicio
              </span>
            </div>
          </div>
        </div>

        {/* ─── Day Detail ─── */}
        {selectedDate && (
          <DayDetail
            dateStr={selectedDate}
            dayData={dayData}
            loading={loadingDay}
            pacienteId={pacienteId}
            macrosData={dayMacros}
          />
        )}
      </div>

      {/* ─── Right: Actividades Sidebar ─── */}
      <aside>
        {/* Sidebar Header — sin tarjeta */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-semibold text-foreground">Actividades</h3>
          <div className="relative">
            <select
              value={actividadFilter}
              onChange={(e) => setActividadFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 rounded-full border border-border bg-background text-xs font-medium cursor-pointer hover:bg-muted/40 transition-colors"
            >
              {FILTROS_ACTIVIDAD.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Activity List — tarjetas separadas */}
        <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
            {loadingActividades ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : actividades.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Sin actividades registradas
                </p>
              </div>
            ) : (
              actividades.map((act) => (
                <ActividadCard key={act.id} actividad={act} />
              ))
            )}
          </div>
      </aside>
    </div>
  );
}

// ─── Day Detail Component ───

function DayDetail({
  dateStr,
  dayData,
  loading,
  pacienteId,
  macrosData,
}: {
  dateStr: string;
  dayData: SeguimientoDia | null;
  loading: boolean;
  pacienteId: string;
  macrosData: { macros: { calorias: number; proteinas: number; carbohidratos: number; grasas: number; fibra: number }; micro: Record<string, number> } | null;
}) {
  const aguaML = dayData?.aguaML ?? 0;
  const aguaPct = Math.min((aguaML / AGUA_OBJETIVO_ML) * 100, 100);

  // Parse comidasData — it's an array of { tipo, alimentos[], horaReal }
  const rawComidas = (dayData as any)?.comidasData as Array<{ tipo: string; alimentos?: Array<{ nombre: string; cantidad: number; cumplido: boolean }>; horaReal?: string | null; notas?: string | null }> | null;
  // Map tipo keys: DESAYUNO→desayuno, MEDIA_MANANA→media-manana, etc.
  const TIPO_TO_KEY: Record<string, string> = {
    DESAYUNO: "desayuno", MEDIA_MANANA: "media-manana", ALMUERZO: "comida",
    MERIENDA: "merienda", CENA: "cena", RECENA: "recena",
  };
  type ComidaEntry = { tipo: string; alimentos?: Array<{ nombre: string; cantidad: number; cumplido: boolean }>; horaReal?: string | null; notas?: string | null };
  const comidasMap = new Map<string, ComidaEntry>();
  if (rawComidas) {
    for (const c of rawComidas) {
      const key = TIPO_TO_KEY[c.tipo] || c.tipo.toLowerCase();
      comidasMap.set(key, c);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Date Header */}
      <div className="px-5 py-3 border-b border-border bg-muted/20">
        <h3 className="text-sm font-semibold text-foreground">
          {formatFechaLarga(dateStr)}
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="p-5 space-y-6">
          {/* Diario alimentario */}
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              Diario alimentario
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {COMIDAS.map(({ key, label, icon: Icon }) => {
                const mealEntry = comidasMap.get(key);
                const allDone = mealEntry?.alimentos?.every(a => a.cumplido) ?? false;
                const someDone = mealEntry?.alimentos?.some(a => a.cumplido) ?? false;
                const isDone = allDone && (mealEntry?.alimentos?.length ?? 0) > 0;
                const hasChanges = someDone && !allDone;
                const hora = mealEntry?.horaReal || HORAS_DEFAULT[key] || "";

                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                      isDone
                        ? "border-emerald-200 dark:border-emerald-500/30 bg-card"
                        : hasChanges
                          ? "border-amber-200 dark:border-amber-500/30 bg-card"
                          : "border-border bg-muted/10"
                    )}
                  >
                    {/* Status icon */}
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                      isDone
                        ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : hasChanges
                          ? "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground/40"
                    )}>
                      {isDone ? <Check className="w-4 h-4" /> : hasChanges ? <X className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>

                    {/* Meal info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{hora}</p>
                    </div>

                    {/* Expand chevron */}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  </div>
                );
              })}
            </div>
          </section>

          {/* Analisis global diario — macros */}
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              Análisis global diario
            </h4>
            {(() => {
              // Use real macros from calcularMacrosDia
              const m = macrosData?.macros;
              const cal = m?.calorias ?? 0;
              const prot = m?.proteinas ?? 0;
              const carb = m?.carbohidratos ?? 0;
              const gras = m?.grasas ?? 0;
              const fib = m?.fibra ?? 0;

              const macros = [
                { label: "Energía", icon: "🔥", value: cal, obj: 2100, unit: "kcal", color: "bg-amber-400", bgColor: "bg-amber-100 dark:bg-amber-500/15" },
                { label: "Grasa", icon: "💧", value: gras, obj: 70, unit: "g", color: "bg-amber-400", bgColor: "bg-amber-50 dark:bg-amber-500/10" },
                { label: "H. Carbono", icon: "○", value: carb, obj: 260, unit: "g", color: "bg-orange-400", bgColor: "bg-orange-50 dark:bg-orange-500/10" },
                { label: "Proteína", icon: "◇", value: prot, obj: 100, unit: "g", color: "bg-blue-400", bgColor: "bg-blue-50 dark:bg-blue-500/10" },
                { label: "Fibra alimentaria", icon: "△", value: fib, obj: 30, unit: "g", color: "bg-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-500/10" },
              ];
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {macros.map((m) => {
                    const pct = m.obj > 0 ? Math.min((m.value / m.obj) * 100, 100) : 0;
                    return (
                      <div key={m.label} className="rounded-xl border border-border p-3">
                        <p className="text-xs text-muted-foreground mb-1">{m.icon} {m.label}</p>
                        <div className={`h-3 ${m.bgColor} rounded-full overflow-hidden mb-1.5`}>
                          <div className={`h-full rounded-full ${m.color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-sm">
                          <span className="font-bold">{Math.round(m.value)}</span>
                          <span className="text-xs text-muted-foreground"> / {m.obj} {m.unit}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>

          {/* Micronutrientes — barras horizontales */}
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-3">Micronutrientes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
              {MICRO_DDR.map((row) => {
                const actual = macrosData?.micro?.[row.key] ?? 0;
                const pct = row.ddr > 0 ? (actual / row.ddr) * 100 : 0;
                const barW = Math.min((pct / 110) * 100, 100);
                return (
                  <div key={row.key} className="flex items-center gap-2 py-1">
                    <span className="text-[11px] text-muted-foreground w-24 shrink-0 text-right">{row.label}</span>
                    <div className="flex-1 relative h-3 bg-muted/40 rounded overflow-hidden">
                      <div className="absolute left-[90.9%] top-0 h-full w-px border-l border-dashed border-muted-foreground/30 z-10" />
                      <div className="h-full rounded bg-indigo-300/70" style={{ width: `${barW}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Ingesta de agua */}
          <section>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              Ingesta de agua
            </h4>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {aguaML} ml
                </span>
                <span className="text-xs text-muted-foreground">
                  Objetivo: {AGUA_OBJETIVO_ML} ml
                </span>
              </div>
              <div className="h-4 rounded-full bg-blue-100 dark:bg-blue-500/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
                  style={{ width: `${aguaPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {aguaPct > 0
                  ? `${Math.round(aguaPct)}% del objetivo diario`
                  : "Sin registro de agua para este dia"}
              </p>
            </div>
          </section>

          {/* Ejercicio */}
          {dayData?.ejercicio && (
            <section>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-emerald-500" />
                Ejercicio
              </h4>
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-950/20 p-4">
                <div className="flex flex-wrap gap-2">
                  {dayData.ejercicioTipo && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                      <Dumbbell className="w-3 h-3" />
                      {dayData.ejercicioTipo}
                    </span>
                  )}
                  {dayData.ejercicioMinutos > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 text-xs font-medium">
                      <Clock className="w-3 h-3" />
                      {dayData.ejercicioMinutos} min
                    </span>
                  )}
                  {dayData.ejercicioKcal > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-medium">
                      <Flame className="w-3 h-3" />
                      {dayData.ejercicioKcal} kcal
                    </span>
                  )}
                  {dayData.ejercicioDistanciaKm > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 text-xs font-medium">
                      <MapPin className="w-3 h-3" />
                      {dayData.ejercicioDistanciaKm} km
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Notas */}
          {dayData?.notas && (
            <section>
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Notas
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border">
                {dayData.notas}
              </p>
            </section>
          )}

          {/* Empty state */}
          {!dayData && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Sin datos registrados para este dia
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Activity Card Component ───

function ActividadCard({ actividad }: { actividad: ActividadPaciente }) {
  const tipoConfig: Record<string, { icon: typeof Check; color: string }> = {
    diario: { icon: UtensilsCrossed, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15" },
    consulta: { icon: CalendarDays, color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/15" },
    ejercicio: { icon: Dumbbell, color: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/15" },
    comida_cumplida: { icon: Check, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15" },
    comida_cambios: { icon: UtensilsCrossed, color: "text-rose-400 bg-rose-100 dark:bg-rose-500/15" },
  };

  const config = tipoConfig[actividad.tipo] ?? tipoConfig.diario;
  const Icon = config.icon;

  return (
    <div className="relative p-4 rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
            config.color
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {formatFechaActividad(actividad.fecha)}
            </p>
          </div>
          <p className="text-sm font-medium text-foreground mt-0.5 pr-20">
            {actividad.titulo}
          </p>
          {actividad.descripcion && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {actividad.descripcion}
            </p>
          )}

          {/* Detail items */}
          {actividad.detalles.length > 0 && (
            <div className="mt-2 space-y-1">
              {actividad.detalles.map((det, i) => {
                const isDone = det.startsWith("✅");
                const isNotDone = det.startsWith("❌");
                const cleanText = det.replace(/^[✅❌]\s*/, "").replace(/~~/g, "");

                if (isDone || isNotDone) {
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5", isDone ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-500/15 text-rose-400")}>
                        {isDone ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      </div>
                      <span className={isNotDone ? "text-muted-foreground line-through" : "text-foreground"}>
                        {cleanText}
                      </span>
                    </div>
                  );
                }

                // Exercise/other pills
                return (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-[11px] font-medium text-muted-foreground mr-1.5">
                    {det}
                  </span>
                );
              })}
            </div>
          )}

          {/* Me gusta button */}
          {(actividad.tipo === "comida_cumplida" || actividad.tipo === "comida_cambios" || actividad.tipo === "ejercicio") && (
            <div className="absolute top-3 right-3">
              <button className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-muted transition-colors">
                Me gusta <Heart className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
