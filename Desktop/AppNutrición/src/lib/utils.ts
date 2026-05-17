import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { intlTag, type Locale } from "@/i18n/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calcularIMC(peso: number, alturaCm: number): number {
  const alturaM = alturaCm / 100;
  return Math.round((peso / (alturaM * alturaM)) * 10) / 10;
}

export function calcularEdad(fechaNacimiento: Date): number {
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const m = hoy.getMonth() - fechaNacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
    edad--;
  }
  return edad;
}

export function formatDate(date: Date | string, locale?: Locale): string {
  return new Date(date).toLocaleDateString(locale ? intlTag(locale) : "es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function capitalizarNombre(texto: string): string {
  return texto
    .toLowerCase()
    .split(" ")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

type TFunc = (key: string) => string;

export const OBJETIVO_KEYS = ["PERDER_PESO", "GANAR_MASA", "MANTENIMIENTO", "PATOLOGIA", "DEPORTIVO", "OTRO"] as const;

export function getObjetivoLabels(t?: TFunc): Record<string, string> {
  if (t) {
    const map: Record<string, string> = {};
    for (const k of OBJETIVO_KEYS) map[k] = t(k);
    return map;
  }
  return {
    PERDER_PESO: "PERDER_PESO",
    GANAR_MASA: "GANAR_MASA",
    MANTENIMIENTO: "MANTENIMIENTO",
    PATOLOGIA: "PATOLOGIA",
    DEPORTIVO: "DEPORTIVO",
    OTRO: "OTRO",
  };
}

/** @deprecated Use getObjetivoLabels(t) instead */
export const OBJETIVO_LABELS: Record<string, string> = {
  PERDER_PESO: "PERDER_PESO",
  GANAR_MASA: "GANAR_MASA",
  MANTENIMIENTO: "MANTENIMIENTO",
  PATOLOGIA: "PATOLOGIA",
  DEPORTIVO: "DEPORTIVO",
  OTRO: "OTRO",
};
