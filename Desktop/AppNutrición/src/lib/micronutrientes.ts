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

export const VITAMINAS: readonly MicroDef[] = [
  { key: "vitaminaA", label: "Vitamina A", ddr: 700, unit: "ug" },
  { key: "vitaminaB6", label: "Vitamina B6", ddr: 1.3, unit: "mg" },
  { key: "vitaminaB12", label: "Vitamina B12", ddr: 2.4, unit: "ug" },
  { key: "vitaminaC", label: "Vitamina C", ddr: 75, unit: "mg" },
  { key: "vitaminaD", label: "Vitamina D", ddr: 15, unit: "ug" },
  { key: "vitaminaE", label: "Vitamina E", ddr: 15, unit: "mg" },
  { key: "vitaminaK", label: "Vitamina K", ddr: 90, unit: "ug" },
  { key: "tiamina", label: "Tiamina (B1)", ddr: 1.1, unit: "mg" },
  { key: "riboflavina", label: "Riboflavina (B2)", ddr: 1.1, unit: "mg" },
  { key: "niacina", label: "Niacina (B3)", ddr: 14, unit: "mg" },
  { key: "folato", label: "Folato (B9)", ddr: 400, unit: "ug" },
  { key: "acidoPantotenico", label: "Ác. Pantoténico", ddr: 5, unit: "mg" },
  { key: "colina", label: "Colina", ddr: 425, unit: "mg" },
];

export const MINERALES: readonly MicroDef[] = [
  { key: "calcio", label: "Calcio", ddr: 1000, unit: "mg" },
  { key: "hierro", label: "Hierro", ddr: 18, unit: "mg" },
  { key: "magnesio", label: "Magnesio", ddr: 320, unit: "mg" },
  { key: "fosforo", label: "Fósforo", ddr: 700, unit: "mg" },
  { key: "potasio", label: "Potasio", ddr: 4700, unit: "mg" },
  { key: "sodio", label: "Sodio", ddr: 1500, unit: "mg" },
  { key: "cinc", label: "Cinc", ddr: 8, unit: "mg" },
  { key: "cobre", label: "Cobre", ddr: 0.9, unit: "mg" },
  { key: "manganeso", label: "Manganeso", ddr: 1.8, unit: "mg" },
  { key: "selenio", label: "Selenio", ddr: 55, unit: "ug" },
  { key: "fluor", label: "Flúor", ddr: 3000, unit: "ug" },
];

export const ALL_MICROS: readonly MicroDef[] = [...VITAMINAS, ...MINERALES];

export const MICRO_KEYS: readonly MicroKey[] = ALL_MICROS.map((m) => m.key);
