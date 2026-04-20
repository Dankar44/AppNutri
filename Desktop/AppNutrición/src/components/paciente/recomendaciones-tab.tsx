"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Droplets,
  Dumbbell,
  Flame,
  Loader2,
  MessageSquareText,
  Plus,
  Search,
  ShieldBan,
  Timer,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  EJERCICIOS_DB,
  FRECUENCIAS,
  OPCIONES_AGUA,
  SUGERENCIAS_ALIMENTOS_EVITAR,
  calcularGastoActividad,
  calcularPromedioDiario,
  type EjercicioBase,
} from "@/lib/ejercicios-db";
import {
  getRecomendacionesEstructuradas,
  guardarRecomendacionesEstructuradas,
  type EjercicioGuardado,
  type RecomendacionesData,
} from "@/app/actions/recomendaciones";

// ─── Props ───

interface RecomendacionesTabProps {
  pacienteId: string;
  pacientePeso?: number | null;
}

// ─── Constants ───

const EJERCICIOS_POR_PAGINA = 5;

// ─── Main Component ───

export function RecomendacionesTab({
  pacienteId,
  pacientePeso,
}: RecomendacionesTabProps) {
  const [data, setData] = useState<RecomendacionesData>({
    agua: "",
    ejercicios: [],
    alimentosEvitar: [],
    otrasRecomendaciones: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Ref to avoid saving stale data on rapid changes
  const dataRef = useRef(data);
  dataRef.current = data;
  const saveTimerRef = useRef<NodeJS.Timeout>(null);

  // Load data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getRecomendacionesEstructuradas(pacienteId);
        if (!cancelled) setData(result);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pacienteId]);

  // Auto-save with debounce
  const save = useCallback(
    (newData: RecomendacionesData) => {
      setData(newData);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await guardarRecomendacionesEstructuradas(pacienteId, newData);
        } catch {
          toast.error("Error al guardar recomendaciones");
        } finally {
          setSaving(false);
        }
      }, 1500);
    },
    [pacienteId]
  );

  // Immediate save (for blur events)
  const saveNow = useCallback(
    async (newData: RecomendacionesData) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaving(true);
      try {
        await guardarRecomendacionesEstructuradas(pacienteId, newData);
      } catch {
        toast.error("Error al guardar recomendaciones");
      } finally {
        setSaving(false);
      }
    },
    [pacienteId]
  );

  const peso = pacientePeso ?? 70; // fallback weight for calculations

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6">
      {/* Left column */}
      <div className="space-y-6">
        <AguaCard
          value={data.agua}
          onChange={(agua) => save({ ...data, agua })}
          saving={saving}
        />
        <EjercicioCard
          ejercicios={data.ejercicios}
          pesoKg={peso}
          onChange={(ejercicios) => save({ ...data, ejercicios })}
          saving={saving}
        />
        <AlimentosEvitarCard
          items={data.alimentosEvitar}
          onChange={(alimentosEvitar) => save({ ...data, alimentosEvitar })}
          saving={saving}
        />
      </div>

      {/* Right column */}
      <div>
        <OtrasRecomendacionesCard
          text={data.otrasRecomendaciones}
          onChange={(otrasRecomendaciones) =>
            save({ ...data, otrasRecomendaciones })
          }
          onBlur={(otrasRecomendaciones) =>
            saveNow({ ...dataRef.current, otrasRecomendaciones })
          }
          saving={saving}
        />
      </div>
    </div>
  );
}

// ─── Save indicator ───

function SaveIndicator({ saving }: { saving: boolean }) {
  if (!saving) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Loader2 className="w-3 h-3 animate-spin" />
      Guardando...
    </span>
  );
}

// ─── Card 1: Agua ───

function AguaCard({
  value,
  onChange,
  saving,
}: {
  value: string;
  onChange: (v: string) => void;
  saving: boolean;
}) {
  return (
    <section className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-500" />
          Ingesta de agua entre las comidas
        </h2>
        <SaveIndicator saving={saving} />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-full border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      >
        <option value="">Seleccionar...</option>
        {OPCIONES_AGUA.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </section>
  );
}

// ─── Card 2: Ejercicio ───

function EjercicioCard({
  ejercicios,
  pesoKg,
  onChange,
  saving,
}: {
  ejercicios: EjercicioGuardado[];
  pesoKg: number;
  onChange: (v: EjercicioGuardado[]) => void;
  saving: boolean;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Exercise form state for each item in the list
  const [duraciones, setDuraciones] = useState<Record<string, number>>({});
  const [customNombre, setCustomNombre] = useState("");
  const [customMet, setCustomMet] = useState("");
  const [frecuencias, setFrecuencias] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    if (!search.trim()) return EJERCICIOS_DB;
    const q = search.toLowerCase();
    return EJERCICIOS_DB.filter((e) => e.nombre.toLowerCase().includes(q));
  }, [search]);

  const totalPages = Math.ceil(filtered.length / EJERCICIOS_POR_PAGINA);
  const paginated = filtered.slice(
    page * EJERCICIOS_POR_PAGINA,
    (page + 1) * EJERCICIOS_POR_PAGINA
  );

  // Reset page when search changes
  useEffect(() => setPage(0), [search]);

  const getDuracion = (nombre: string) => duraciones[nombre] ?? 20;
  const getFrecuencia = (nombre: string) => frecuencias[nombre] ?? 3;

  const addEjercicio = (ej: EjercicioBase) => {
    const dur = getDuracion(ej.nombre);
    const freq = getFrecuencia(ej.nombre);
    // Avoid duplicates
    if (ejercicios.some((e) => e.nombre === ej.nombre)) {
      toast.info("Este ejercicio ya está añadido");
      return;
    }
    onChange([
      ...ejercicios,
      { nombre: ej.nombre, met: ej.met, duracion: dur, frecuencia: freq },
    ]);
  };

  const removeEjercicio = (nombre: string) => {
    onChange(ejercicios.filter((e) => e.nombre !== nombre));
  };

  // Calculate totals
  const totalMinutosDiarios = ejercicios.reduce((sum, ej) => {
    return sum + (ej.duracion * ej.frecuencia) / 7;
  }, 0);

  const totalKcalDiarias = ejercicios.reduce((sum, ej) => {
    const gasto = calcularGastoActividad(ej.met, pesoKg, ej.duracion);
    return sum + calcularPromedioDiario(gasto, ej.frecuencia);
  }, 0);

  return (
    <section className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Ejercicio fisico
        </h2>
        <SaveIndicator saving={saving} />
      </div>

      {/* Added exercises */}
      {ejercicios.length > 0 && (
        <div className="mb-4 space-y-2">
          {ejercicios.map((ej) => {
            const gasto = calcularGastoActividad(ej.met, pesoKg, ej.duracion);
            const promedio = calcularPromedioDiario(gasto, ej.frecuencia);
            const freqLabel =
              ej.frecuencia === 7
                ? "Todos los dias"
                : `${ej.frecuencia} veces/semana`;
            return (
              <div
                key={ej.nombre}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{ej.nombre}</span>
                  <span className="text-muted-foreground ml-2">
                    {ej.duracion} min | {freqLabel} | MET {ej.met}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                  <span className="inline-flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    {gasto} kcal/sesion
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-primary" />
                    {promedio} kcal/dia
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeEjercicio(ej.nombre)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add button / panel toggle */}
      {!panelOpen ? (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary/10 text-primary font-medium text-sm px-4 py-2.5 hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Anadir nueva componente de actividad fisica
        </button>
      ) : (
        <div className="rounded-lg border border-primary/30 bg-primary/5 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20">
            <span className="text-sm font-medium text-primary">
              Anadir nueva componente de actividad fisica
            </span>
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-4 pt-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar actividad fisica"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Exercise list */}
          <div className="px-4 pb-3 space-y-1">
            {paginated.map((ej) => {
              const dur = getDuracion(ej.nombre);
              const freq = getFrecuencia(ej.nombre);
              const gasto = calcularGastoActividad(ej.met, pesoKg, dur);
              const promedio = calcularPromedioDiario(gasto, freq);
              const alreadyAdded = ejercicios.some(
                (e) => e.nombre === ej.nombre
              );

              return (
                <div
                  key={ej.nombre}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-4",
                    alreadyAdded ? "border-primary/30 bg-primary/5" : "border-border bg-background"
                  )}
                >
                  {/* Duration + frequency inputs */}
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number" inputMode="decimal"
                      min={1}
                      max={999}
                      value={dur}
                      onChange={(e) =>
                        setDuraciones((prev) => ({
                          ...prev,
                          [ej.nombre]: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className="w-14 px-2 py-1.5 rounded-lg border border-border bg-muted/30 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                    <span className="text-muted-foreground/30">|</span>
                    <select
                      value={freq}
                      onChange={(e) =>
                        setFrecuencias((prev) => ({
                          ...prev,
                          [ej.nombre]: parseInt(e.target.value),
                        }))
                      }
                      className="px-2 py-1.5 rounded-lg border border-border bg-muted/30 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                    >
                      {FRECUENCIAS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Exercise name — stacked */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{ej.nombre}</p>
                    <p className="text-xs text-muted-foreground">Compendio de actividades físicas</p>
                  </div>

                  {/* Stats — larger */}
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-center">
                      <p className="text-base font-bold tabular-nums">{ej.met}</p>
                      <p className="text-[10px] text-muted-foreground">MET</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold tabular-nums">{gasto} kcal</p>
                      <p className="text-[10px] text-muted-foreground">Gasto por actividad</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold tabular-nums">{promedio} kcal</p>
                      <p className="text-[10px] text-muted-foreground">Promedio diaria</p>
                    </div>
                  </div>

                  {/* Add button */}
                  {/* Add button */}
                  <button
                    type="button"
                    onClick={() => addEjercicio(ej)}
                    disabled={alreadyAdded}
                    className={cn(
                      "p-1.5 rounded-lg transition-colors shrink-0",
                      alreadyAdded
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : "text-primary hover:bg-primary/10"
                    )}
                  >
                    {alreadyAdded ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })}

            {paginated.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No se encontraron actividades
              </p>
            )}
          </div>

          {/* Pagination */}
          {/* Crear ejercicio personalizado — dentro del panel */}
          <div className="mx-4 my-3 rounded-xl border border-dashed border-primary/30 bg-card p-3">
            <p className="text-xs font-medium text-primary mb-2">¿No encuentras tu ejercicio? Créalo:</p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[140px]">
                <label className="text-[10px] text-muted-foreground">Nombre *</label>
                <input
                  type="text"
                  placeholder="Ej: Padel adaptado..."
                  value={customNombre}
                  onChange={(e) => setCustomNombre(e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div className="w-20">
                <label className="text-[10px] text-muted-foreground">MET *</label>
                <input
                  type="number" inputMode="decimal"
                  step="0.1"
                  min={1}
                  max={20}
                  placeholder="5.0"
                  value={customMet}
                  onChange={(e) => setCustomMet(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const nombre = customNombre.trim();
                  const met = parseFloat(customMet);
                  if (!nombre || isNaN(met) || met < 1) return;
                  if (ejercicios.some((e) => e.nombre === nombre)) return;
                  addEjercicio({ nombre, met });
                  setCustomNombre("");
                  setCustomMet("");
                }}
                disabled={!customNombre.trim() || !customMet}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                Añadir
              </button>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 pb-3">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="p-1.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Summary pills */}
      {ejercicios.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
            <Clock className="w-3.5 h-3.5" />
            Tiempo promedio de actividad diaria:{" "}
            {Math.round(totalMinutosDiarios)} minutos
          </span>
          <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
            <Flame className="w-3.5 h-3.5" />
            Promedio energetico diario: {Math.round(totalKcalDiarias)} kcal/dia
          </span>
        </div>
      )}
    </section>
  );
}

// ─── Card 3: Alimentos a evitar ───

function AlimentosEvitarCard({
  items,
  onChange,
  saving,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  saving: boolean;
}) {
  const [inputValue, setInputValue] = useState("");

  const addItem = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (items.some((i) => i.toLowerCase() === trimmed.toLowerCase())) {
      toast.info("Este alimento ya esta en la lista");
      return;
    }
    onChange([...items, trimmed]);
    setInputValue("");
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const suggestionsLeft = SUGERENCIAS_ALIMENTOS_EVITAR.filter(
    (s) => !items.some((i) => i.toLowerCase() === s.toLowerCase())
  );

  return (
    <section className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <ShieldBan className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Alimentos a evitar
        </h2>
        <SaveIndicator saving={saving} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem(inputValue);
            }
          }}
          placeholder="Escribir alimento a evitar..."
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <button
          type="button"
          onClick={() => addItem(inputValue)}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Current items */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {items.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 rounded-full px-3 py-1 text-sm"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="p-0.5 rounded-full hover:bg-amber-200/60 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Suggestions */}
      {suggestionsLeft.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Sugerencias:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestionsLeft.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => addItem(sug)}
                className="text-xs px-2.5 py-1 rounded-full border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
              >
                + {sug}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Card 4: Otras Recomendaciones ───

function OtrasRecomendacionesCard({
  text,
  onChange,
  onBlur,
  saving,
}: {
  text: string;
  onChange: (v: string) => void;
  onBlur: (v: string) => void;
  saving: boolean;
}) {
  const [local, setLocal] = useState(text);
  const initializedRef = useRef(false);

  // Sync when data loads for the first time
  useEffect(() => {
    if (!initializedRef.current && text) {
      setLocal(text);
      initializedRef.current = true;
    } else if (!initializedRef.current) {
      initializedRef.current = true;
    }
  }, [text]);

  return (
    <section className="bg-card rounded-xl border border-border p-5 sticky top-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-teal-500" />
          Otras recomendaciones
        </h2>
        <SaveIndicator saving={saving} />
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Escribe recomendaciones personalizadas para el paciente. Se guardan
        automaticamente.
      </p>
      <textarea
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          onChange(e.target.value);
        }}
        onBlur={() => onBlur(local)}
        rows={12}
        maxLength={5000}
        placeholder={`Ej:\nReducir el consumo de sal, utilizando hierbas aromaticas y especias;\nAnalizar las etiquetas de los productos alimenticios;\nComer lentamente, masticando cuidadosamente;\nEvitar comer o picar entre las comidas;\nBeber agua;\nControlar la grasa de las comidas.`}
        className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y leading-relaxed"
      />
      <div className="mt-2 text-xs text-muted-foreground text-right">
        {local.length} / 5000
      </div>
    </section>
  );
}
