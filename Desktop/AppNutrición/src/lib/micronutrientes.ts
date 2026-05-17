export type MicroKey =
  | "vitaminaA" | "vitaminaB6" | "vitaminaB12" | "vitaminaC" | "vitaminaD"
  | "vitaminaE" | "vitaminaK" | "tiamina" | "riboflavina" | "niacina"
  | "folato" | "acidoPantotenico" | "colina"
  | "calcio" | "hierro" | "magnesio" | "fosforo" | "potasio" | "sodio"
  | "cinc" | "cobre" | "manganeso" | "selenio" | "fluor";

export interface MicroDef {
  key: MicroKey;
  label: string;
  ddr: number;
  unit: string;
}

type TFunc = (key: string) => string;

interface MicroRaw {
  key: MicroKey;
  ddr: number;
  unit: string;
}

const VITAMINAS_RAW: readonly MicroRaw[] = [
  { key: "vitaminaA", ddr: 700, unit: "ug" },
  { key: "vitaminaB6", ddr: 1.3, unit: "mg" },
  { key: "vitaminaB12", ddr: 2.4, unit: "ug" },
  { key: "vitaminaC", ddr: 75, unit: "mg" },
  { key: "vitaminaD", ddr: 15, unit: "ug" },
  { key: "vitaminaE", ddr: 15, unit: "mg" },
  { key: "vitaminaK", ddr: 90, unit: "ug" },
  { key: "tiamina", ddr: 1.1, unit: "mg" },
  { key: "riboflavina", ddr: 1.1, unit: "mg" },
  { key: "niacina", ddr: 14, unit: "mg" },
  { key: "folato", ddr: 400, unit: "ug" },
  { key: "acidoPantotenico", ddr: 5, unit: "mg" },
  { key: "colina", ddr: 425, unit: "mg" },
];

const MINERALES_RAW: readonly MicroRaw[] = [
  { key: "calcio", ddr: 1000, unit: "mg" },
  { key: "hierro", ddr: 18, unit: "mg" },
  { key: "magnesio", ddr: 320, unit: "mg" },
  { key: "fosforo", ddr: 700, unit: "mg" },
  { key: "potasio", ddr: 4700, unit: "mg" },
  { key: "sodio", ddr: 1500, unit: "mg" },
  { key: "cinc", ddr: 8, unit: "mg" },
  { key: "cobre", ddr: 0.9, unit: "mg" },
  { key: "manganeso", ddr: 1.8, unit: "mg" },
  { key: "selenio", ddr: 55, unit: "ug" },
  { key: "fluor", ddr: 3000, unit: "ug" },
];

function withLabels(raw: readonly MicroRaw[], t?: TFunc): readonly MicroDef[] {
  return raw.map((m) => ({
    ...m,
    label: t ? t(m.key) : m.key,
  }));
}

export function getVitaminas(t?: TFunc): readonly MicroDef[] {
  return withLabels(VITAMINAS_RAW, t);
}

export function getMinerales(t?: TFunc): readonly MicroDef[] {
  return withLabels(MINERALES_RAW, t);
}

export function getAllMicros(t?: TFunc): readonly MicroDef[] {
  return [...getVitaminas(t), ...getMinerales(t)];
}

/** Default instances (no translation — keys as labels) for backward compat */
export const VITAMINAS: readonly MicroDef[] = getVitaminas();
export const MINERALES: readonly MicroDef[] = getMinerales();
export const ALL_MICROS: readonly MicroDef[] = [...VITAMINAS, ...MINERALES];

export const MICRO_KEYS: readonly MicroKey[] = ALL_MICROS.map((m) => m.key);
