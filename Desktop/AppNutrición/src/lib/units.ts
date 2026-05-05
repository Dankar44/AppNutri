export const UNIDAD_LABELS: Record<string, string> = {
  GRAMOS: "g",
  MILILITROS: "ml",
  UNIDAD: "ud",
  CUCHARADA: "cda",
  CUCHARADITA: "cdta",
  TAZA: "tz",
  REBANADA: "reb",
  PIEZA: "pza",
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
};

export function formatQuantity(cantidad: number, unidad: string): string {
  if (!Number.isFinite(cantidad)) return "—";
  if (unidad === "GRAMOS") return `${Math.round(cantidad)}g`;
  if (unidad === "MILILITROS") return `${Math.round(cantidad)}ml`;
  const label = UNIDAD_LABELS[unidad] || unidad.toLowerCase();
  const rounded = Number.isInteger(cantidad) ? cantidad : Math.round(cantidad * 10) / 10;
  return `${rounded} ${label}`;
}

export function getUnidadLabel(unidad: string, esReceta?: boolean): string {
  if (esReceta) return "porc.";
  return UNIDAD_LABELS[unidad] || "g";
}

export function getCantidadDefault(unidad: string, porcion: number): number {
  if (unidad === "GRAMOS" || unidad === "MILILITROS") return porcion;
  return 1;
}
