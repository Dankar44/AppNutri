export const UNIDAD_LABELS: Record<string, string> = {
  GRAMOS: "g",
  MILILITROS: "ml",
  UNIDAD: "ud",
  CUCHARADA: "cda",
  CUCHARADITA: "cdta",
  TAZA: "tz",
  REBANADA: "reb",
  PIEZA: "pza",
  LATA: "lata",
  LONCHA: "loncha",
};

export const UNIDAD_LABELS_FULL: Record<string, string> = {
  GRAMOS: "gramos",
  MILILITROS: "mililitros",
  UNIDAD: "unidades",
  CUCHARADA: "cucharadas",
  CUCHARADITA: "cucharaditas",
  TAZA: "tazas",
  REBANADA: "rebanadas",
  PIEZA: "piezas",
  LATA: "latas",
  LONCHA: "lonchas",
};

export function formatQuantity(cantidad: number, unidad: string): string {
  if (!Number.isFinite(cantidad)) return "—";
  // Al escalar una receta a media porción salen cantidades por debajo del gramo
  // (una pizca de sal, un diente de ajo): redondear a entero las mostraba como "0g".
  if (unidad === "GRAMOS" || unidad === "MILILITROS") {
    const sufijo = unidad === "GRAMOS" ? "g" : "ml";
    if (cantidad > 0 && cantidad < 1) return `${Math.round(cantidad * 10) / 10}${sufijo}`;
    return `${Math.round(cantidad)}${sufijo}`;
  }
  const label = UNIDAD_LABELS[unidad] || unidad.toLowerCase();
  const rounded = Number.isInteger(cantidad) ? cantidad : Math.round(cantidad * 10) / 10;
  return `${rounded} ${label}`;
}

/**
 * Etiqueta de unidad para el campo de cantidad. Una receta no se mide en gramos sino en
 * raciones (1 ración = 1 persona); se pluraliza con la cantidad para no dejar "1 raciones".
 */
export function getUnidadLabel(unidad: string, esReceta?: boolean, cantidad?: number): string {
  if (esReceta) return cantidad === 1 ? "ración" : "raciones";
  return UNIDAD_LABELS[unidad] || "g";
}

export function getCantidadDefault(unidad: string, porcion: number): number {
  if (unidad === "GRAMOS" || unidad === "MILILITROS") return porcion;
  return 1;
}

/**
 * true si la cantidad va en pasos de 0,5 (unidades caseras como ud/loncha/lata),
 * y no en gramos/mililitros, que admiten cualquier entero. Las raciones de receta
 * también van de 0,5 en 0,5 pero se detectan aparte (con su flag `esReceta`).
 */
export function esUnidadDiscreta(unidad?: string | null): boolean {
  return !!unidad && unidad !== "GRAMOS" && unidad !== "MILILITROS";
}
