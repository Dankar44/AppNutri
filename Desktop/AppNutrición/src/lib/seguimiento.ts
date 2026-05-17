import { intlTag, type Locale } from "@/i18n/config";

type TFunc = (key: string) => string;

export const TIPO_KEYS = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"] as const;

export function getTipoLabels(t?: TFunc): Record<string, string> {
  if (t) {
    const map: Record<string, string> = {};
    for (const k of TIPO_KEYS) map[k] = t(k);
    return map;
  }
  return {
    DESAYUNO: "DESAYUNO",
    MEDIA_MANANA: "MEDIA_MANANA",
    ALMUERZO: "ALMUERZO",
    MERIENDA: "MERIENDA",
    CENA: "CENA",
    RECENA: "RECENA",
  };
}

/** @deprecated Use getTipoLabels(t) instead */
export const TIPO_LABELS: Record<string, string> = getTipoLabels();

export const TIPO_HORAS: Record<string, string> = {
  DESAYUNO: "08:00",
  MEDIA_MANANA: "11:00",
  ALMUERZO: "14:00",
  MERIENDA: "17:00",
  CENA: "21:00",
  RECENA: "23:00",
};

export const TIPOS_ORDEN = [
  "DESAYUNO",
  "MEDIA_MANANA",
  "ALMUERZO",
  "MERIENDA",
  "CENA",
  "RECENA",
];

export function formatFechaLarga(fecha: string, locale?: Locale): string {
  const d = new Date(fecha + "T12:00:00");
  return d.toLocaleDateString(locale ? intlTag(locale) : "es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function isHoy(fecha: string): boolean {
  return fecha === new Date().toISOString().split("T")[0];
}

/** Devuelve el tipo de comida que corresponde a la hora actual según TIPO_HORAS. */
export function tipoComidaPorHora(ahoraHHMM: string): string | null {
  const mins = (h: string) => {
    const [hh, mm] = h.split(":").map(Number);
    return hh * 60 + mm;
  };
  const ahora = mins(ahoraHHMM);
  const ventana = 90; // +-90 min respecto a la hora teorica
  let mejor: { tipo: string; diff: number } | null = null;
  for (const tipo of TIPOS_ORDEN) {
    const hora = TIPO_HORAS[tipo];
    if (!hora) continue;
    const diff = Math.abs(ahora - mins(hora));
    if (diff <= ventana && (mejor === null || diff < mejor.diff)) {
      mejor = { tipo, diff };
    }
  }
  return mejor ? mejor.tipo : null;
}

export const SALUDO_KEYS = ["noche_temprana", "dia", "tarde", "noche"] as const;

export function saludoDinamicoKey(): string {
  const h = new Date().getHours();
  if (h < 6) return "noche_temprana";
  if (h < 13) return "dia";
  if (h < 21) return "tarde";
  return "noche";
}

export function saludoDinamico(t?: TFunc): string {
  const key = saludoDinamicoKey();
  if (t) return t(key);
  if (key === "noche_temprana" || key === "noche") return "Buenas noches";
  if (key === "dia") return "Buenos días";
  return "Buenas tardes";
}

const MET_MAP: Record<string, number> = {
  Carrera: 10,
  Correr: 10,
  Running: 10,
  Bicicleta: 8,
  Ciclismo: 8,
  "Natación": 7,
  Nadar: 7,
  Caminar: 4,
  Andar: 4,
  Yoga: 3,
  Pilates: 3,
  Pesas: 5,
  "Musculación": 5,
  Gimnasio: 5,
  Crossfit: 9,
  "Fútbol": 8,
  Tenis: 7,
  Padel: 6,
  "Pádel": 6,
  Baloncesto: 7,
  Baile: 5,
};

export function estimarKcal(tipo: string, minutos: number, pesoKg = 70): number {
  if (!tipo || minutos <= 0) return 0;
  const lower = tipo.toLowerCase();
  let met = 5;
  for (const [k, v] of Object.entries(MET_MAP)) {
    if (lower.includes(k.toLowerCase())) {
      met = v;
      break;
    }
  }
  return Math.round(met * pesoKg * (minutos / 60));
}

export function calcularAguaObjetivo(pesoKg: number | null): number {
  return pesoKg ? Math.round(pesoKg * 35) : 2000;
}

export function formatMlCorto(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 1)}L`;
  return `${ml}ml`;
}

export const TIPOS_EJERCICIO_COMUNES_KEYS = [
  "Caminar", "Correr", "Bicicleta", "Natación", "Pesas", "Yoga", "Fútbol", "Pádel", "Baile",
] as const;

export function getTiposEjercicioComunes(t?: TFunc): { nombre: string }[] {
  return TIPOS_EJERCICIO_COMUNES_KEYS.map((k) => ({
    nombre: t ? t(k) : k,
  }));
}

/** @deprecated Use getTiposEjercicioComunes(t) */
export const TIPOS_EJERCICIO_COMUNES: { nombre: string }[] = getTiposEjercicioComunes();

export const SENSACION_KEYS = ["genial", "bien", "regular", "cansado", "mal"] as const;

export function getSensaciones(t?: TFunc) {
  return SENSACION_KEYS.map((k) => ({
    value: k,
    label: t ? t(k) : k,
  })) as { value: string; label: string }[];
}

/** @deprecated Use getSensaciones(t) */
export const SENSACIONES = getSensaciones() as readonly { value: string; label: string }[];
