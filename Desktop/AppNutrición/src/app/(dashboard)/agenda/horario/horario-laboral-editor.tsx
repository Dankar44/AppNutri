"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Clock, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import {
  guardarHorarioLaboral,
  type DiaLaboral,
  type DiaLaboralKey,
  type HorarioLaboral,
  type IntervaloHorario,
} from "@/app/actions/horario-laboral";
import { cn } from "@/lib/utils";

const DIAS: { key: DiaLaboralKey; label: string; corto: string }[] = [
  { key: "LUNES", label: "Lunes", corto: "Lun" },
  { key: "MARTES", label: "Martes", corto: "Mar" },
  { key: "MIERCOLES", label: "Miércoles", corto: "Mié" },
  { key: "JUEVES", label: "Jueves", corto: "Jue" },
  { key: "VIERNES", label: "Viernes", corto: "Vie" },
  { key: "SABADO", label: "Sábado", corto: "Sáb" },
  { key: "DOMINGO", label: "Domingo", corto: "Dom" },
];

const SLOT_MIN = 30;               // 30 min por celda
const START_MIN = 6 * 60;          // 06:00
const END_MIN = 22 * 60;           // 22:00 (exclusivo)
const SLOTS_COUNT = (END_MIN - START_MIN) / SLOT_MIN; // 32 slots
const SLOT_HEIGHT_PX = 20;         // altura visual de cada slot

function minsToHHMM(m: number): string {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h.toString().padStart(2, "0")}:${r.toString().padStart(2, "0")}`;
}

function hhmmToMins(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return (Number.isFinite(hh) ? hh : 0) * 60 + (Number.isFinite(mm) ? mm : 0);
}

type SlotKey = string; // `${dia}-${slotIdx}`
const keyOf = (dia: DiaLaboralKey, slot: number): SlotKey => `${dia}-${slot}`;

function horarioASlots(horario: HorarioLaboral): Set<SlotKey> {
  const set = new Set<SlotKey>();
  for (const d of horario.dias) {
    if (!d.activo) continue;
    for (const iv of d.intervalos) {
      const ini = hhmmToMins(iv.inicio);
      const fin = hhmmToMins(iv.fin);
      const iniS = Math.max(0, Math.floor((ini - START_MIN) / SLOT_MIN));
      const finS = Math.min(SLOTS_COUNT, Math.ceil((fin - START_MIN) / SLOT_MIN));
      for (let s = iniS; s < finS; s++) set.add(keyOf(d.dia, s));
    }
  }
  return set;
}

function slotsAHorario(
  slots: Set<SlotKey>,
  duracion: number,
): HorarioLaboral {
  const dias: DiaLaboral[] = DIAS.map(({ key }) => {
    const seleccionados: number[] = [];
    for (let s = 0; s < SLOTS_COUNT; s++) {
      if (slots.has(keyOf(key, s))) seleccionados.push(s);
    }
    seleccionados.sort((a, b) => a - b);

    const intervalos: IntervaloHorario[] = [];
    let i = 0;
    while (i < seleccionados.length) {
      let j = i;
      while (j + 1 < seleccionados.length && seleccionados[j + 1] === seleccionados[j] + 1) {
        j++;
      }
      intervalos.push({
        inicio: minsToHHMM(START_MIN + seleccionados[i] * SLOT_MIN),
        fin: minsToHHMM(START_MIN + (seleccionados[j] + 1) * SLOT_MIN),
      });
      i = j + 1;
    }
    return {
      dia: key,
      activo: intervalos.length > 0,
      intervalos,
    };
  });
  return { dias, duracionCitaDefault: duracion };
}

function formatoHoras(m: number): string {
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h > 0 && r > 0) return `${h}h ${r}min`;
  if (h > 0) return `${h}h`;
  return `${r}min`;
}

export function HorarioLaboralEditor({ inicial }: { inicial: HorarioLaboral }) {
  const router = useRouter();
  const [slots, setSlots] = useState<Set<SlotKey>>(() => horarioASlots(inicial));
  const [duracion, setDuracion] = useState<number>(inicial.duracionCitaDefault);
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  // Drag state
  const dragMode = useRef<"add" | "remove" | null>(null);
  const dragTouched = useRef<Set<SlotKey>>(new Set());

  const applySlot = useCallback((dia: DiaLaboralKey, slot: number, mode: "add" | "remove") => {
    const k = keyOf(dia, slot);
    if (dragTouched.current.has(k)) return;
    dragTouched.current.add(k);
    setSlots((prev) => {
      const next = new Set(prev);
      if (mode === "add") next.add(k);
      else next.delete(k);
      return next;
    });
    setDirty(true);
  }, []);

  useEffect(() => {
    function onUp() {
      dragMode.current = null;
      dragTouched.current.clear();
    }
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  function handleCellDown(dia: DiaLaboralKey, slot: number, e: React.MouseEvent) {
    e.preventDefault();
    const k = keyOf(dia, slot);
    const isFilled = slots.has(k);
    dragMode.current = isFilled ? "remove" : "add";
    dragTouched.current = new Set();
    applySlot(dia, slot, dragMode.current);
  }

  function handleCellEnter(dia: DiaLaboralKey, slot: number) {
    if (!dragMode.current) return;
    applySlot(dia, slot, dragMode.current);
  }

  function limpiarDia(dia: DiaLaboralKey) {
    setSlots((prev) => {
      const next = new Set(prev);
      for (let s = 0; s < SLOTS_COUNT; s++) next.delete(keyOf(dia, s));
      return next;
    });
    setDirty(true);
  }

  function limpiarTodo() {
    setSlots(new Set());
    setDirty(true);
  }

  const resumenPorDia = useMemo(() => {
    const map = new Map<DiaLaboralKey, number>();
    for (const d of DIAS) {
      let mins = 0;
      for (let s = 0; s < SLOTS_COUNT; s++) {
        if (slots.has(keyOf(d.key, s))) mins += SLOT_MIN;
      }
      map.set(d.key, mins);
    }
    return map;
  }, [slots]);

  const resumenTotal = useMemo(() => {
    let min = 0;
    let diasActivos = 0;
    for (const d of DIAS) {
      const m = resumenPorDia.get(d.key) ?? 0;
      if (m > 0) {
        diasActivos++;
        min += m;
      }
    }
    return { min, diasActivos };
  }, [resumenPorDia]);

  function handleGuardar() {
    const horario = slotsAHorario(slots, duracion);
    startTransition(async () => {
      try {
        const saved = await guardarHorarioLaboral(horario);
        setSlots(horarioASlots(saved));
        setDuracion(saved.duracionCitaDefault);
        setDirty(false);
        toast.success("Horario guardado");
        router.refresh();
      } catch {
        toast.error("No se pudo guardar el horario");
      }
    });
  }

  function handleDescartar() {
    setSlots(horarioASlots(inicial));
    setDuracion(inicial.duracionCitaDefault);
    setDirty(false);
  }

  const horasLabels = useMemo(() => {
    const arr: string[] = [];
    for (let m = START_MIN; m < END_MIN; m += 60) {
      arr.push(minsToHHMM(m));
    }
    return arr;
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-sm font-medium inline-flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Duración cita por defecto
          </label>
          <input
            type="number"
            min={5}
            max={480}
            step={5}
            value={duracion}
            onChange={(e) => {
              setDuracion(Number(e.target.value) || 30);
              setDirty(true);
            }}
            className="w-20 px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-sm text-muted-foreground">min</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-primary/70 border border-primary" /> Disponible
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-muted border border-border" /> No laboral
          </span>
          <span className="hidden sm:inline">· Pulsa o arrastra sobre las celdas</span>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] select-none">
          {/* Header */}
          <div className="bg-muted/40 border-b border-r border-border" />
          {DIAS.map((d) => {
            const totalMin = resumenPorDia.get(d.key) ?? 0;
            return (
              <div
                key={d.key}
                className="bg-muted/40 border-b border-r last:border-r-0 border-border px-2 py-2 flex items-center justify-between gap-1"
              >
                <div className="flex items-baseline gap-1.5 min-w-0">
                  <span className="text-sm font-semibold">
                    <span className="sm:hidden">{d.corto}</span>
                    <span className="hidden sm:inline">{d.label}</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {totalMin > 0 ? formatoHoras(totalMin) : "—"}
                  </span>
                </div>
                {totalMin > 0 && (
                  <button
                    type="button"
                    onClick={() => limpiarDia(d.key)}
                    className="text-muted-foreground hover:text-rose-600 transition-colors shrink-0"
                    title="Limpiar día"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Filas hora + día */}
          {horasLabels.map((hora, hIdx) => {
            // Cada hora tiene 2 slots (30 min c/u)
            const slotsDeEstaHora = [hIdx * 2, hIdx * 2 + 1];
            return (
              <FilaHora
                key={hora}
                hora={hora}
                slotsDeEstaHora={slotsDeEstaHora}
                slots={slots}
                onCellDown={handleCellDown}
                onCellEnter={handleCellEnter}
              />
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-4 bg-card/95 backdrop-blur-sm rounded-xl border border-border shadow-md p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="text-sm text-muted-foreground">
          {resumenTotal.diasActivos} día{resumenTotal.diasActivos !== 1 ? "s" : ""} activos ·{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatoHoras(resumenTotal.min)}
          </span>{" "}
          a la semana
          {dirty && (
            <span className="ml-3 text-amber-700 dark:text-amber-400 text-xs font-medium">
              Cambios sin guardar
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={limpiarTodo}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar todo
          </button>
          <button
            type="button"
            onClick={handleDescartar}
            disabled={!dirty || pending}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
          >
            <Undo2 className="w-4 h-4" />
            Descartar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={!dirty || pending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

function FilaHora({
  hora,
  slotsDeEstaHora,
  slots,
  onCellDown,
  onCellEnter,
}: {
  hora: string;
  slotsDeEstaHora: number[];
  slots: Set<SlotKey>;
  onCellDown: (dia: DiaLaboralKey, slot: number, e: React.MouseEvent) => void;
  onCellEnter: (dia: DiaLaboralKey, slot: number) => void;
}) {
  return (
    <>
      <div
        className="bg-muted/20 border-r border-b border-border flex items-start justify-end pr-2 pt-1 text-[11px] text-muted-foreground font-medium tabular-nums"
        style={{ height: SLOT_HEIGHT_PX * 2 }}
      >
        {hora}
      </div>
      {DIAS.map((d) => {
        const sA = slotsDeEstaHora[0];
        const sB = slotsDeEstaHora[1];
        const filledA = slots.has(keyOf(d.key, sA));
        const filledB = slots.has(keyOf(d.key, sB));
        return (
          <div
            key={d.key}
            className="border-r last:border-r-0 border-b border-border relative"
            style={{ height: SLOT_HEIGHT_PX * 2 }}
          >
            <Cell
              dia={d.key}
              slot={sA}
              filled={filledA}
              neighborFilled={filledB}
              isTop
              onDown={onCellDown}
              onEnter={onCellEnter}
            />
            <Cell
              dia={d.key}
              slot={sB}
              filled={filledB}
              neighborFilled={filledA}
              onDown={onCellDown}
              onEnter={onCellEnter}
            />
          </div>
        );
      })}
    </>
  );
}

function Cell({
  dia,
  slot,
  filled,
  neighborFilled,
  isTop,
  onDown,
  onEnter,
}: {
  dia: DiaLaboralKey;
  slot: number;
  filled: boolean;
  neighborFilled: boolean;
  isTop?: boolean;
  onDown: (dia: DiaLaboralKey, slot: number, e: React.MouseEvent) => void;
  onEnter: (dia: DiaLaboralKey, slot: number) => void;
}) {
  void neighborFilled;
  return (
    <button
      type="button"
      onMouseDown={(e) => onDown(dia, slot, e)}
      onMouseEnter={() => onEnter(dia, slot)}
      onDragStart={(e) => e.preventDefault()}
      className={cn(
        "absolute left-0 right-0 cursor-pointer transition-colors",
        isTop ? "top-0" : "bottom-0",
        filled
          ? "bg-primary/70 hover:bg-primary/80"
          : "bg-transparent hover:bg-primary/10",
        isTop
          ? "border-b border-dashed border-border/50"
          : "",
      )}
      style={{ height: SLOT_HEIGHT_PX }}
      aria-label={`${dia} ${minsToHHMM(START_MIN + slot * SLOT_MIN)}`}
    />
  );
}
