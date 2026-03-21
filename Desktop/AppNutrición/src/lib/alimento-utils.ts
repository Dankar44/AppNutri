/**
 * Funciones de normalización para alimentos.
 * Se usan en todas las vías de creación (manual, API, IA, seed).
 */

export function normalizarNombreAlimento(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function redondearMacros(valor: number): number {
  return Math.round(valor * 10) / 10;
}
