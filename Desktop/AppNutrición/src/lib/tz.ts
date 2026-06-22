/**
 * Utilidades para trabajar con zona horaria Europe/Madrid de forma
 * consistente independientemente del TZ del servidor (Node).
 *
 * El problema que resuelve: en producción el servidor suele ir en UTC
 * mientras que todos los usuarios (nutricionistas y pacientes) operan
 * en hora local de España. Sin estas helpers, `setHours(9, 0)` en el
 * servidor fija UTC 09:00 (= 10:00 invierno / 11:00 verano en España),
 * lo que provoca shifts de hora e incluso de día en citas cerca de
 * medianoche.
 *
 * NOTA: El sistema asume que TODA la app opera en Europa/Madrid. Si
 * en el futuro hay usuarios en otras zonas, habrá que guardar la TZ
 * del dietista y pasarla a estas funciones.
 */

import { intlTag, type Locale } from "@/i18n/config";

const TZ = "Europe/Madrid" as const;

/**
 * Construye un Date que, al mostrarse en zona Europe/Madrid, refleja
 * los componentes pasados. Ejemplo: `fromMadrid(2026, 3, 20, 9, 0)` →
 * Date cuya hora Madrid es 20 abr 2026 09:00, independiente del TZ
 * del servidor.
 */
export function fromMadrid(
  anyo: number,
  mes0Based: number, // 0 = enero, 11 = diciembre (como Date.UTC)
  dia: number,
  hora: number,
  minuto: number = 0,
): Date {
  // 1) Suposición inicial: construir como si fuese UTC.
  const guess = new Date(Date.UTC(anyo, mes0Based, dia, hora, minuto));

  // 2) Ver qué hora Madrid muestra para ese instante.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(guess);

  const obj: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== "literal") obj[p.type] = parseInt(p.value, 10);
  }
  // Madrid cree que esta ms es "obj.year-obj.month-obj.day obj.hour:obj.minute".
  // La suposición era "anyo-mes-dia hora:minuto". La diferencia es el offset.
  const madridAsUTC = Date.UTC(obj.year, obj.month - 1, obj.day, obj.hour, obj.minute, obj.second || 0);
  const offsetMs = guess.getTime() - madridAsUTC;

  // 3) Sumar el offset para obtener el Date real.
  return new Date(guess.getTime() + offsetMs);
}

/**
 * Devuelve la fecha en formato "YYYY-MM-DD" según Europa/Madrid.
 * Usado para agrupar citas en calendarios sin depender del TZ del proceso.
 */
export function toMadridDateStr(d: Date): string {
  // "sv-SE" formatea YYYY-MM-DD por defecto.
  return d.toLocaleDateString("sv-SE", { timeZone: TZ });
}

/** Devuelve la hora en formato "HH:MM" según Europa/Madrid. */
export function toMadridTimeStr(d: Date, locale?: Locale): string {
  return d.toLocaleTimeString(locale ? intlTag(locale) : "es-ES", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/** Devuelve el valor para un `<input type="datetime-local">` en Europa/Madrid. */
export function toMadridDateTimeLocal(d: Date): string {
  // Formato "YYYY-MM-DDTHH:MM"
  const fecha = toMadridDateStr(d);
  const hora = toMadridTimeStr(d);
  return `${fecha}T${hora}`;
}

/**
 * Interpreta un string de `<input type="datetime-local">` ("YYYY-MM-DDTHH:MM",
 * con segundos opcionales) como hora de Europa/Madrid y devuelve el Date (instante)
 * correspondiente. Úsalo al GUARDAR citas: el usuario teclea hora de Madrid, no UTC.
 * Devuelve null si el string no tiene el formato esperado.
 *
 * Ejemplo (servidor en UTC): fromMadridLocalString("2026-06-27T18:00") → Date cuyo
 * instante es 16:00:00Z (porque 18:00 Madrid en verano = 16:00 UTC).
 */
export function fromMadridLocalString(s: string): Date | null {
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map((v) => parseInt(v, 10));
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  return fromMadrid(y, mo - 1, d, h, mi);
}
