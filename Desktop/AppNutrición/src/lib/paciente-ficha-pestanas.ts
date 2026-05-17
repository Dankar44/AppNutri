/** Pestañas de la ficha del paciente (módulo server-safe; no "use client"). */

export const FICHA_TAB_IDS = [
  "general",
  "informacion",
  "mediciones",
  "planificacion",
  "plan-alimentacion",
  "seguimiento",
  "recomendaciones",
  "entregables",
  "portal-paciente",
] as const;

export type PestanaFicha = (typeof FICHA_TAB_IDS)[number];

type TFunc = (key: string) => string;

export function getFichaTabs(t?: TFunc): readonly { id: PestanaFicha; label: string }[] {
  return FICHA_TAB_IDS.map((id) => ({
    id,
    label: t ? t(id) : id,
  }));
}

/** @deprecated Use getFichaTabs(t) instead */
export const FICHA_TABS = getFichaTabs();

const PESTANA_SET = new Set<string>(FICHA_TAB_IDS);

export function parsePestanaFicha(raw: string | undefined): PestanaFicha {
  if (raw === "acompanamiento") return "seguimiento";
  if (raw && PESTANA_SET.has(raw)) return raw as PestanaFicha;
  return "general";
}
