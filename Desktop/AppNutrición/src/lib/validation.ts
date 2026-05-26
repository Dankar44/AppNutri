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

// --- Validación de URL ---

export function validateUrl(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const sanitized = sanitizeString(value, 2048);
  if (!sanitized) return null;
  const trimmed = sanitized.trim();
  if (!trimmed) return null;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return trimmed;
  } catch {
    return null;
  }
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|avif|svg|bmp|ico|tiff?)(\?|#|$)/i;

export function validateImageUrl(value: unknown): string | null {
  const url = validateUrl(value);
  if (!url) return null;
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (IMAGE_EXTENSIONS.test(pathname)) return url;
  } catch {}
  return null;
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
  URL_MAX: 2048,
  MICRO_MAX: 100000,
  PESO_MAX: 500,
  ALTURA_MAX: 300,
  PERIMETRO_MAX: 300,
  DURACION_MIN: 5,
  DURACION_MAX: 480,
  PORCIONES_MAX: 100,
  TIEMPO_PREP_MAX: 1440,
  MARCA_PDF: 200,
  EMPRESA_NOMBRE: 200,
  EMPRESA_DESCRIPCION: 500,
  EMPRESA_SLUG: 50,
  STOCK_MAX: 999999,
  PRECIO_MAX: 99999.99,
  NOTA_STOCK: 500,
} as const;

export const TEMA_PDF_OPCIONES = ["verde", "azul", "morado", "naranja", "oscuro", "personalizado"] as const;
export type TemaPdfOpcion = (typeof TEMA_PDF_OPCIONES)[number];

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function validateHexColor(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return HEX_COLOR_REGEX.test(trimmed) ? trimmed : null;
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateSlug(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase().slice(0, maxLength);
  if (!trimmed || trimmed.length < 3) return null;
  if (!SLUG_REGEX.test(trimmed)) return null;
  return trimmed;
}
