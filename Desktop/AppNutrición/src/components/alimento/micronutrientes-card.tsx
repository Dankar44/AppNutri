"use client";

type MicroKey =
  | "vitaminaA" | "vitaminaB6" | "vitaminaB12" | "vitaminaC" | "vitaminaD"
  | "vitaminaE" | "vitaminaK" | "tiamina" | "riboflavina" | "niacina"
  | "folato" | "acidoPantotenico" | "colina"
  | "calcio" | "hierro" | "magnesio" | "fosforo" | "potasio" | "sodio"
  | "cinc" | "cobre" | "manganeso" | "selenio" | "fluor";

interface Props {
  values: Partial<Record<MicroKey, number | null>>;
  title?: string;
  subtitleSuffix?: string;
}

const VITAMINAS: { key: MicroKey; label: string; ddr: number; unit: string }[] = [
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

const MINERALES: { key: MicroKey; label: string; ddr: number; unit: string }[] = [
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

function Row({
  row,
  actual,
  accent,
}: {
  row: { label: string; ddr: number; unit: string };
  actual: number;
  accent: string;
}) {
  const pct = row.ddr > 0 ? Math.min((actual / row.ddr) * 100, 100) : 0;
  const isZero = actual <= 0;
  return (
    <div className={`flex items-center gap-3 py-2 ${isZero ? "opacity-50" : ""}`}>
      <span className="text-sm font-medium w-32 shrink-0 truncate">{row.label}</span>
      <div className="flex-1 min-w-0 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />
      </div>
      <span className="text-xs tabular-nums whitespace-nowrap text-right shrink-0">
        <span className="font-bold">{actual < 1 ? actual.toFixed(2) : actual.toFixed(1)}</span>
        <span className="text-muted-foreground"> / {row.ddr} {row.unit}</span>
      </span>
      <span className="text-xs font-semibold tabular-nums w-10 text-right shrink-0" style={{ color: isZero ? undefined : accent }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export function MicronutrientesCard({ values, title = "Micronutrientes por 100g", subtitleSuffix = "% sobre DDR" }: Props) {
  const get = (k: MicroKey) => {
    const v = values[k];
    return typeof v === "number" ? v : 0;
  };

  const totalPresentes =
    [...VITAMINAS, ...MINERALES].filter((r) => get(r.key) > 0).length;

  return (
    <section className="bg-card rounded-xl border border-border p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {totalPresentes} / {VITAMINAS.length + MINERALES.length} presentes · {subtitleSuffix}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Vitaminas
          </h3>
          <div className="divide-y divide-border/50">
            {VITAMINAS.map((row) => (
              <Row key={row.key} row={row} actual={get(row.key)} accent="#7eaadf" />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Minerales
          </h3>
          <div className="divide-y divide-border/50">
            {MINERALES.map((row) => (
              <Row key={row.key} row={row} actual={get(row.key)} accent="#4ec4a0" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
