"use client";

import { type MicroKey, VITAMINAS, MINERALES } from "@/lib/micronutrientes";

interface Props {
  values: Partial<Record<MicroKey, number | null>>;
  title?: string;
  subtitleSuffix?: string;
}

function Row({
  row,
  actual,
  accent,
}: {
  row: { label: string; ddr: number; unit: string };
  actual: number | null;
  accent: string;
}) {
  const isNull = actual === null || actual === undefined;
  const val = isNull ? 0 : actual;
  const pct = !isNull && row.ddr > 0 ? Math.min((val / row.ddr) * 100, 100) : 0;

  return (
    <div className={`flex items-center gap-3 py-2 ${isNull ? "opacity-30" : val <= 0 ? "opacity-50" : ""}`}>
      <span className="text-sm font-medium w-32 shrink-0 truncate">{row.label}</span>
      <div className="flex-1 min-w-0 h-2 rounded-full bg-muted overflow-hidden">
        {!isNull && <div className="h-full rounded-full" style={{ width: `${pct}%`, background: accent }} />}
      </div>
      <span className="text-xs tabular-nums whitespace-nowrap text-right shrink-0">
        {isNull ? (
          <span className="text-muted-foreground">— / {row.ddr} {row.unit}</span>
        ) : (
          <>
            <span className="font-bold">{val < 1 ? val.toFixed(2) : val.toFixed(1)}</span>
            <span className="text-muted-foreground"> / {row.ddr} {row.unit}</span>
          </>
        )}
      </span>
      <span className="text-xs font-semibold tabular-nums w-10 text-right shrink-0" style={{ color: isNull || val <= 0 ? undefined : accent }}>
        {isNull ? "—" : `${Math.round(pct)}%`}
      </span>
    </div>
  );
}

export function MicronutrientesCard({ values, title = "Micronutrientes por 100g", subtitleSuffix = "% sobre DDR" }: Props) {
  const allMicros = [...VITAMINAS, ...MINERALES];
  const totalPresentes = allMicros.filter((r) => typeof values[r.key] === "number").length;

  if (totalPresentes === 0) return null;

  return (
    <section className="bg-card rounded-xl border border-border p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {totalPresentes} / {allMicros.length} presentes · {subtitleSuffix}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Vitaminas
          </h3>
          <div className="divide-y divide-border/50">
            {VITAMINAS.map((row) => (
              <Row key={row.key} row={row} actual={values[row.key] ?? null} accent="#7eaadf" />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Minerales
          </h3>
          <div className="divide-y divide-border/50">
            {MINERALES.map((row) => (
              <Row key={row.key} row={row} actual={values[row.key] ?? null} accent="#4ec4a0" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
