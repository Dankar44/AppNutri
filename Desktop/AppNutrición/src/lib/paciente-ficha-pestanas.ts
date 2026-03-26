/** Pestañas de la ficha del paciente (módulo server-safe; no "use client"). */

export const FICHA_TABS = [
  { id: "informacion", label: "Información" },
  { id: "mediciones", label: "Mediciones" },
  { id: "planificacion", label: "Planificación" },
  { id: "plan-alimentacion", label: "Plan de alimentación" },
  { id: "seguimiento", label: "Seguimiento" },
  { id: "recomendaciones", label: "Recomendaciones" },
  { id: "entregables", label: "Entregables" },
  { id: "portal-paciente", label: "Portal del paciente" },
] as const;

export type PestanaFicha = (typeof FICHA_TABS)[number]["id"];

const PESTANA_SET = new Set<string>(FICHA_TABS.map((t) => t.id));

export function parsePestanaFicha(raw: string | undefined): PestanaFicha {
  if (raw === "acompanamiento") return "seguimiento";
  if (raw && PESTANA_SET.has(raw)) return raw as PestanaFicha;
  return "informacion";
}
