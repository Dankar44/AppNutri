import {
  Briefcase,
  Dumbbell,
  UtensilsCrossed,
  Moon,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { HorarioEntry } from "@/app/actions/paciente-auth";

export const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;
export const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"] as const;
export const DIAS_LABORABLES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] as const;
export const FINDE = ["Sábado", "Domingo"] as const;

export const START_HOUR = 6;
export const END_HOUR = 24;
export const PX_PER_HOUR = 52;
export const TOTAL_HOURS = END_HOUR - START_HOUR;

export function rangoHoras(): string[] {
  const arr: string[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    arr.push(String(h).padStart(2, "0") + ":00");
  }
  return arr;
}

export interface Categoria {
  id: string;
  label: string;
  Icon: LucideIcon;
  /** Clases para chips de leyenda */
  chip: string;
  /** Clases para bloques del grid */
  block: string;
  /** Color solido para iconos / accents */
  accent: string;
  /** Clases para KPIs */
  kpiBg: string;
}

export const CATEGORIAS: Categoria[] = [
  {
    id: "trabajo",
    label: "Trabajo",
    Icon: Briefcase,
    chip: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    block:
      "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30 dark:hover:bg-blue-500/25",
    accent: "text-blue-600 dark:text-blue-400",
    kpiBg: "bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/30",
  },
  {
    id: "ejercicio",
    label: "Ejercicio",
    Icon: Dumbbell,
    chip: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-400 dark:border-green-500/30",
    block:
      "bg-green-50 text-green-800 border-green-200 hover:bg-green-100 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30 dark:hover:bg-green-500/25",
    accent: "text-green-600 dark:text-green-400",
    kpiBg: "bg-green-50 border-green-200 dark:bg-green-500/10 dark:border-green-500/30",
  },
  {
    id: "comida",
    label: "Comida",
    Icon: UtensilsCrossed,
    chip: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30",
    block:
      "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 dark:hover:bg-amber-500/25",
    accent: "text-amber-600 dark:text-amber-400",
    kpiBg: "bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30",
  },
  {
    id: "descanso",
    label: "Descanso",
    Icon: Moon,
    chip: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-400 dark:border-purple-500/30",
    block:
      "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30 dark:hover:bg-purple-500/25",
    accent: "text-purple-600 dark:text-purple-400",
    kpiBg: "bg-purple-50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30",
  },
  {
    id: "otro",
    label: "Otro",
    Icon: Sparkles,
    chip: "bg-muted text-foreground border-border",
    block:
      "bg-muted text-foreground border-border hover:bg-muted/80",
    accent: "text-muted-foreground",
    kpiBg: "bg-muted border-border",
  },
];

export function getCategoria(id?: string): Categoria {
  return CATEGORIAS.find((c) => c.id === id) ?? CATEGORIAS[4];
}

export interface Bloque {
  dia: string;
  /** Hora inicial, inclusive. "HH:00" */
  horaInicio: string;
  /** Hora final, exclusiva. "HH:00" */
  horaFin: string;
  actividad: string;
  color: string;
  nota?: string;
}

function hourToInt(h: string): number {
  return parseInt(h.split(":")[0] ?? "0", 10);
}
function intToHour(n: number): string {
  return String(n).padStart(2, "0") + ":00";
}

/**
 * Convierte entries (granularidad 1h) a bloques contiguos por día.
 */
export function entriesToBloques(entries: HorarioEntry[]): Bloque[] {
  const bloques: Bloque[] = [];
  for (const dia of DIAS) {
    const entriesDia = entries
      .filter((e) => e.dia === dia)
      .sort((a, b) => a.hora.localeCompare(b.hora));

    let current: Bloque | null = null;
    for (const entry of entriesDia) {
      const horaInt = hourToInt(entry.hora);
      const horaSig = intToHour(horaInt + 1);

      if (
        current &&
        current.actividad === entry.actividad &&
        current.color === (entry.color || "otro") &&
        (current.nota || "") === (entry.nota || "") &&
        current.horaFin === entry.hora
      ) {
        current.horaFin = horaSig;
      } else {
        if (current) bloques.push(current);
        current = {
          dia,
          horaInicio: entry.hora,
          horaFin: horaSig,
          actividad: entry.actividad,
          color: entry.color || "otro",
          nota: entry.nota,
        };
      }
    }
    if (current) bloques.push(current);
  }
  return bloques;
}

/**
 * Convierte bloques a entries (expansión horaria).
 */
export function bloquesToEntries(bloques: Bloque[]): HorarioEntry[] {
  const entries: HorarioEntry[] = [];
  for (const b of bloques) {
    const ini = hourToInt(b.horaInicio);
    const fin = hourToInt(b.horaFin);
    for (let h = ini; h < fin; h++) {
      entries.push({
        dia: b.dia,
        hora: intToHour(h),
        actividad: b.actividad,
        color: b.color,
        nota: b.nota,
      });
    }
  }
  return entries;
}

/**
 * Stats por categoria: horas semanales totales.
 */
export function horasPorCategoria(entries: HorarioEntry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of CATEGORIAS) out[c.id] = 0;
  for (const e of entries) {
    const id = e.color || "otro";
    out[id] = (out[id] ?? 0) + 1;
  }
  return out;
}

/**
 * Tamaño del grid (18 filas × altura por hora). Útil para layout.
 */
export function gridHeightPx(): number {
  return TOTAL_HOURS * PX_PER_HOUR;
}

/**
 * Posiciona un bloque en el grid CSS.
 * Devuelve top (px) y height (px).
 */
export function bloqueLayout(bloque: Bloque): { top: number; height: number } {
  const ini = hourToInt(bloque.horaInicio);
  const fin = hourToInt(bloque.horaFin);
  return {
    top: (ini - START_HOUR) * PX_PER_HOUR,
    height: (fin - ini) * PX_PER_HOUR,
  };
}

/**
 * Plantillas rapidas.
 */
export interface Plantilla {
  id: string;
  label: string;
  descripcion: string;
  apply: () => HorarioEntry[];
}

function mkEntry(dia: string, horaInt: number, actividad: string, color: string, nota?: string): HorarioEntry {
  return { dia, hora: intToHour(horaInt), actividad, color, nota };
}

export const PLANTILLAS: Plantilla[] = [
  {
    id: "semana-laboral",
    label: "Semana laboral típica",
    descripcion: "Trabajo 9–18, comidas y ejercicio regulares",
    apply: () => {
      const out: HorarioEntry[] = [];
      for (const dia of DIAS_LABORABLES) {
        out.push(mkEntry(dia, 8, "Desayuno", "comida"));
        for (let h = 9; h < 13; h++) out.push(mkEntry(dia, h, "Trabajo", "trabajo"));
        out.push(mkEntry(dia, 14, "Comida", "comida"));
        for (let h = 15; h < 18; h++) out.push(mkEntry(dia, h, "Trabajo", "trabajo"));
        out.push(mkEntry(dia, 19, "Ejercicio", "ejercicio"));
        out.push(mkEntry(dia, 21, "Cena", "comida"));
        out.push(mkEntry(dia, 23, "Dormir", "descanso"));
      }
      for (const dia of FINDE) {
        out.push(mkEntry(dia, 10, "Desayuno", "comida"));
        out.push(mkEntry(dia, 14, "Comida", "comida"));
        out.push(mkEntry(dia, 21, "Cena", "comida"));
        out.push(mkEntry(dia, 23, "Dormir", "descanso"));
      }
      return out;
    },
  },
  {
    id: "deportista",
    label: "Rutina de deportista",
    descripcion: "Entrenamiento AM y PM, 5 comidas al día",
    apply: () => {
      const out: HorarioEntry[] = [];
      for (const dia of DIAS_LABORABLES) {
        out.push(mkEntry(dia, 7, "Ejercicio (fuerza)", "ejercicio"));
        out.push(mkEntry(dia, 8, "Desayuno", "comida"));
        out.push(mkEntry(dia, 11, "Media mañana", "comida"));
        out.push(mkEntry(dia, 14, "Comida", "comida"));
        out.push(mkEntry(dia, 17, "Merienda", "comida"));
        out.push(mkEntry(dia, 19, "Ejercicio (cardio)", "ejercicio"));
        out.push(mkEntry(dia, 21, "Cena", "comida"));
        out.push(mkEntry(dia, 23, "Dormir", "descanso"));
      }
      return out;
    },
  },
  {
    id: "flexible",
    label: "Día flexible (teletrabajo)",
    descripcion: "Horario libre con bloques de enfoque",
    apply: () => {
      const out: HorarioEntry[] = [];
      for (const dia of DIAS_LABORABLES) {
        out.push(mkEntry(dia, 9, "Desayuno", "comida"));
        for (let h = 10; h < 13; h++) out.push(mkEntry(dia, h, "Enfoque mañana", "trabajo"));
        out.push(mkEntry(dia, 14, "Comida", "comida"));
        out.push(mkEntry(dia, 15, "Descanso / siesta", "descanso"));
        for (let h = 16; h < 19; h++) out.push(mkEntry(dia, h, "Enfoque tarde", "trabajo"));
        out.push(mkEntry(dia, 20, "Cena", "comida"));
      }
      return out;
    },
  },
];
