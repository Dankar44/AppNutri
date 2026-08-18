/**
 * Rate limit en memoria con sliding window.
 * Simple y suficiente para una sola instancia. Para múltiples réplicas
 * habría que migrar a Redis/Upstash, pero el patrón se mantendría.
 */

const stores = new Map<string, number[]>();

interface CheckOptions {
  /** Identificador único (ej: "msg:dietista:123") */
  key: string;
  /** Máximo de eventos permitidos en la ventana */
  limit: number;
  /** Ventana de tiempo en ms */
  windowMs: number;
}

interface RateLimitResult {
  ok: boolean;
  /** Cuántos eventos quedan disponibles en la ventana */
  remaining: number;
  /** Segundos hasta poder hacer el próximo si está bloqueado */
  retryAfter: number;
}

/**
 * Comprueba si la operación está permitida y la registra si lo está.
 * Devuelve { ok: false } si se ha excedido el límite.
 */
export function checkRateLimit(opts: CheckOptions): RateLimitResult {
  const ahora = Date.now();
  const desde = ahora - opts.windowMs;

  let timestamps = stores.get(opts.key) ?? [];
  // Limpiar entradas fuera de la ventana
  timestamps = timestamps.filter((t) => t > desde);

  if (timestamps.length >= opts.limit) {
    const masAntiguo = timestamps[0];
    const retryAfter = Math.ceil((masAntiguo + opts.windowMs - ahora) / 1000);
    stores.set(opts.key, timestamps);
    return { ok: false, remaining: 0, retryAfter: Math.max(retryAfter, 1) };
  }

  timestamps.push(ahora);
  stores.set(opts.key, timestamps);

  // Limpieza oportunista del map (cada 100 keys evita crecimiento ilimitado)
  if (stores.size > 100 && Math.random() < 0.05) {
    limpiarStoresAntiguos(ahora, opts.windowMs);
  }

  return {
    ok: true,
    remaining: opts.limit - timestamps.length,
    retryAfter: 0,
  };
}

/**
 * Consulta si una clave está bloqueada SIN registrar el intento.
 *
 * checkRateLimit apunta el intento al comprobarlo, lo que sirve para limitar acciones válidas
 * (enviar mensajes, registrarse). Para un login hace falta lo contrario: mirar si está
 * bloqueado antes de validar nada, y apuntar solo si el intento resulta fallido.
 */
export function estaBloqueado(opts: CheckOptions): { bloqueado: boolean; retryAfter: number } {
  const ahora = Date.now();
  const desde = ahora - opts.windowMs;
  const timestamps = (stores.get(opts.key) ?? []).filter((t) => t > desde);
  if (timestamps.length < opts.limit) return { bloqueado: false, retryAfter: 0 };
  const retryAfter = Math.ceil((timestamps[0] + opts.windowMs - ahora) / 1000);
  return { bloqueado: true, retryAfter: Math.max(retryAfter, 1) };
}

/**
 * Borra el contador de una clave. Se usa tras una autenticación correcta, para que los
 * intentos fallidos previos no cuenten contra quien acaba de demostrar que es quien dice.
 */
export function resetRateLimit(key: string): void {
  stores.delete(key);
}

function limpiarStoresAntiguos(ahora: number, windowMs: number) {
  const desde = ahora - windowMs;
  for (const [key, timestamps] of stores.entries()) {
    const filtrados = timestamps.filter((t) => t > desde);
    if (filtrados.length === 0) {
      stores.delete(key);
    } else if (filtrados.length !== timestamps.length) {
      stores.set(key, filtrados);
    }
  }
}

// Configuración por tipo de operación
export const LIMITES = {
  enviarMensaje: { limit: 20, windowMs: 60_000 },
  subirAdjunto: { limit: 5, windowMs: 60_000 },
  subirImagen: { limit: 10, windowMs: 60_000 },
  registro: { limit: 3, windowMs: 3_600_000 },
  // El panel da acceso a los datos de todos los nutricionistas: ventana larga y pocos intentos.
  loginAdmin: { limit: 5, windowMs: 900_000 },
} as const;
