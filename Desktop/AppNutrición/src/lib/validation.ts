/**
 * Utilidades de validación y sanitización para server actions.
 * Defensa en profundidad: NUNCA confiar en validación del cliente.
 */

// --- Sanitización de strings ---

export function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .slice(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ""); // eliminar caracteres de control
}

export function sanitizeStringOptional(value: unknown, maxLength: number): string | null {
  if (value === null || value === undefined || value === "") return null;
  return sanitizeString(value, maxLength) || null;
}

// --- Sanitización de arrays ---

export function sanitizeArray(arr: unknown, maxItems: number, maxItemLen: number): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .filter((item): item is string => typeof item === "string")
    .map((item) => sanitizeString(item, maxItemLen))
    .filter(Boolean);
}

// --- Validación de números ---

export function validateNumber(value: unknown, min: number, max: number, fallback?: number): number {
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(num) || !isFinite(num)) return fallback ?? min;
  return Math.min(Math.max(num, min), max);
}

export function validateNumberOptional(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  return validateNumber(value, min, max);
}

// --- Validación de enums ---

export function validateEnum<T extends string>(value: unknown, allowed: readonly T[] | T[]): T | null {
  if (typeof value !== "string") return null;
  return allowed.includes(value as T) ? (value as T) : null;
}

// --- Validación de IDs ---

const CUID_REGEX = /^c[a-z0-9]{24,}$/;

export function validateId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < 20 || trimmed.length > 40) return null;
  if (!CUID_REGEX.test(trimmed)) return null;
  return trimmed;
}

// --- Validación de email ---

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase().slice(0, 254);
  return EMAIL_REGEX.test(trimmed) ? trimmed : null;
}

// --- Validación de teléfono ---

const PHONE_REGEX = /^[+]?[\d\s()-]{6,20}$/;

export function validatePhone(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim().slice(0, 20);
  return PHONE_REGEX.test(trimmed) ? trimmed : null;
}

// --- Validación de fecha ---

export function validateDate(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  if (isNaN(date.getTime())) return null;
  // Rango razonable: 1900-2100
  if (date.getFullYear() < 1900 || date.getFullYear() > 2100) return null;
  return date;
}

// --- Validación de data URL (fotos base64) ---

const DATA_URL_REGEX = /^data:image\/(jpeg|png|webp|gif);base64,/;
const MAX_BASE64_LENGTH = 2_800_000; // ~2MB en base64

export function validateImageDataUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!DATA_URL_REGEX.test(value)) return null;
  if (value.length > MAX_BASE64_LENGTH) return null;
  return value;
}

// --- Validación de búsqueda ---

export function sanitizeSearch(value: unknown): string {
  return sanitizeString(value, 100);
}

// --- Constantes de límites ---

export const LIMITS = {
  NOMBRE: 200,
  NOMBRE_CORTO: 100,
  DESCRIPCION: 500,
  INSTRUCCIONES: 5000,
  NOTAS: 2000,
  MOTIVO: 200,
  BUSQUEDA: 100,
  TELEFONO: 20,
  COLEGIADO: 50,
  ESPECIALIDAD: 200,
  CLINICA: 200,
  PIN: 8,
  ARRAY_ITEMS: 20,
  ARRAY_ITEM_LEN: 100,
  INGREDIENTES_MAX: 50,
  INSTRUCCIONES_IA: 2000,
  // Números
  CALORIAS_MAX: 20000,
  MACROS_MAX: 2000,
  PORCION_MAX: 10000,
  CANTIDAD_MAX: 99999,
  PESO_MAX: 500,
  ALTURA_MAX: 300,
  PERIMETRO_MAX: 300,
  DURACION_MIN: 5,
  DURACION_MAX: 480,
  PORCIONES_MAX: 100,
  TIEMPO_PREP_MAX: 1440,
} as const;
