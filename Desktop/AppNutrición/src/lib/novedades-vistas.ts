/**
 * Estado de "novedades leídas" del nutricionista, en el navegador.
 *
 * No hay nada de esto en la BD a propósito: es una preferencia de lectura, no
 * un dato clínico. El coste es que va por dispositivo (quien usa portátil y
 * móvil verá el aviso en los dos).
 *
 * Tampoco pasa por el sistema de notificaciones (`Notificacion` / la campana):
 * un changelog no debe ensuciar los avisos de citas, pagos o pacientes.
 */

/** Fecha ISO de la novedad más reciente que el nutri ya ha visto. */
const CLAVE_VISTAS = "annonia-novedades-vistas";
/** Fecha ISO de la última novedad destacada cuyo banner se cerró. */
const CLAVE_BANNER = "annonia-novedades-banner-descartado";
/** Clave del banner de beta (la que ya usaba `beta-banner`). */
const CLAVE_BETA = "annonia-beta-banner-dismissed";

/**
 * Sin registro previo, solo se consideran nuevas las novedades de los últimos
 * 30 días. Así, al estrenar esto, quien ya usa la app ve el aviso de lo
 * reciente, y quien se registre en unos meses no arranca con un mes de avisos
 * de cosas que para él siempre han estado ahí.
 */
const VENTANA_NUEVAS_DIAS = 30;

/** Evento propio: lo emite la página al marcar leído, lo escucha el sidebar. */
export const EVENTO_NOVEDADES_VISTAS = "annonia:novedades-vistas";

function leer(clave: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null; // Safari en privado, cookies bloqueadas…
  }
}

function escribir(clave: string, valor: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    // Sin localStorage el aviso reaparecerá; no es motivo para romper nada.
  }
}

/** Fecha ISO (YYYY-MM-DD) a partir de la cual una novedad cuenta como nueva. */
export function getCorteNovedades(): string {
  const vista = leer(CLAVE_VISTAS);
  if (vista) return vista;
  const d = new Date();
  d.setDate(d.getDate() - VENTANA_NUEVAS_DIAS);
  return d.toISOString().slice(0, 10);
}

/** Las fechas son YYYY-MM-DD, así que comparar como texto es correcto. */
export function esNueva(fechaNovedad: string, corte: string): boolean {
  return fechaNovedad > corte;
}

export function marcarNovedadesVistas(fechaUltimaNovedad: string) {
  escribir(CLAVE_VISTAS, fechaUltimaNovedad);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_NOVEDADES_VISTAS));
  }
}

/** ¿Hay que enseñar el banner de esta novedad destacada? */
export function bannerPendiente(fechaDestacada: string): boolean {
  const descartado = leer(CLAVE_BANNER);
  if (descartado && descartado >= fechaDestacada) return false;
  return esNueva(fechaDestacada, getCorteNovedades());
}

/**
 * Cierra el banner de novedades. Descarta también el de beta: si al cerrar uno
 * apareciese el otro debajo, la sensación es que los avisos no se van nunca.
 */
export function descartarBannerNovedades(fechaDestacada: string) {
  escribir(CLAVE_BANNER, fechaDestacada);
  escribir(CLAVE_BETA, "1");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENTO_NOVEDADES_VISTAS));
  }
}

export function betaDescartado(): boolean {
  return leer(CLAVE_BETA) !== null;
}

export function descartarBeta() {
  escribir(CLAVE_BETA, "1");
}
