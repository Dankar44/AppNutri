import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
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

export const OBJETIVO_LABELS: Record<string, string> = {
  PERDER_PESO: "Perder peso",
  GANAR_MASA: "Ganar masa muscular",
  MANTENIMIENTO: "Mantenimiento",
  PATOLOGIA: "Patología",
  DEPORTIVO: "Rendimiento deportivo",
  OTRO: "Otro",
};
