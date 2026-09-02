import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { intlTag, type Locale } from "@/i18n/config";

export class ActionTimeoutError extends Error {
  constructor() { super("TIMEOUT"); this.name = "ActionTimeoutError"; }
}

export function isNextNavigation(error: unknown): error is Error {
  if (error && typeof error === "object" && "digest" in error) {
    const d = String((error as Record<string, unknown>).digest);
    return d.startsWith("NEXT_REDIRECT") || d.startsWith("NEXT_NOT_FOUND");
  }
  return false;
}

export function withTimeout<T>(promise: Promise<T>, ms = 30_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new ActionTimeoutError()), ms)),
  ]);
}

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

/**
 * Fecha y hora ("02/09/2026, 13:45"), para cosas que pasan en un momento concreto: una entrega.
 * En hora de España, como toda la app (ver tz.ts): el servidor de producción va en UTC.
 */
export function formatDateTime(date: Date | string, locale?: Locale): string {
  return new Date(date).toLocaleString(locale ? intlTag(locale) : "es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

/**
 * Sanea una ruta que viene de la URL antes de usarla en una redirección.
 *
 * Los destinos se construyen pegando cadenas (`origin + ruta`), y ahí un valor que no empiece por
 * "/" cambia el host: "https://annonia.com" + "@evil.com" es una URL cuyo host es evil.com, con el
 * dominio legítimo colado como nombre de usuario. Es una redirección abierta: un enlace que empieza
 * por annonia.com y acaba en la página de otro (phishing muy creíble).
 *
 * Solo se aceptan rutas internas: una barra, y ni "//" ni "/\\", que el navegador lee como otro
 * dominio. Envolverlo en `new URL(valor, origen)` NO protege: "//evil.com" y "https://evil.com"
 * siguen resolviendo a evil.com por resolución relativa.
 */
export function rutaInternaSegura(valor: string | null | undefined, porDefecto = "/dashboard"): string {
  if (!valor || !valor.startsWith("/")) return porDefecto;
  if (valor.startsWith("//") || valor.startsWith("/\\")) return porDefecto;
  return valor;
}

/**
 * Dominio público de la aplicación, para los enlaces que van dentro de un correo.
 *
 * `NEXT_PUBLIC_APP_URL` está puesta a `http://localhost:3000` en los ficheros de entorno locales,
 * lo cual está bien mientras se programa, pero **un correo con un enlace a localhost no le sirve
 * a nadie**. Si el proceso corre en producción y esa variable sigue apuntando a localhost, se
 * ignora y se usa el dominio de verdad. Comprobado el 30 ago 2026.
 */
export function urlPublica(): string {
  const configurada = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "");
  const esLocal = /localhost|127\.0\.0\.1/.test(configurada);
  if (!configurada) return "https://annonia.com";
  if (esLocal && process.env.NODE_ENV === "production") return "https://annonia.com";
  return configurada;
}
