"use client";

import { useTranslations } from "next-intl";
import { type MicroKey, getVitaminas, getMinerales } from "@/lib/micronutrientes";

interface Props {
  values: Partial<Record<MicroKey, number | null>>;
  title?: string;
  subtitleSuffix?: string;
  /** Una sola columna y menos padding, para caber en una barra lateral estrecha. */
  compact?: boolean;
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

export function MicronutrientesCard({ values, title, subtitleSuffix, compact = false }: Props) {
  const t = useTranslations("foods.micronutrientes");
  const vitaminas = getVitaminas(t);
  const minerales = getMinerales(t);
  const displayTitle = title ?? t("titulo");
  const displaySubtitle = subtitleSuffix ?? t("subtituloDdr");
  const allMicros = [...vitaminas, ...minerales];
  const totalPresentes = allMicros.filter((r) => typeof values[r.key] === "number").length;

  if (totalPresentes === 0) return null;

  return (
    <section className={compact ? "bg-card rounded-xl border border-border p-5" : "bg-card rounded-xl border border-border p-6 sm:p-8"}>
      <div className={`flex items-center justify-between ${compact ? "mb-3" : "mb-6"}`}>
        <h2 className={compact ? "text-base font-semibold" : "text-xl font-semibold"}>{displayTitle}</h2>
        <span className="text-xs text-muted-foreground">
          {t("presentes", { presentes: totalPresentes, total: allMicros.length })} · {displaySubtitle}
        </span>
      </div>

      <div className={compact ? "grid grid-cols-1 gap-y-4" : "grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6"}>
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t("vitaminas")}
          </h3>
          <div className="divide-y divide-border/50">
            {vitaminas.map((row) => (
              <Row key={row.key} row={row} actual={values[row.key] ?? null} accent="#7eaadf" />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            {t("minerales")}
          </h3>
          <div className="divide-y divide-border/50">
            {minerales.map((row) => (
              <Row key={row.key} row={row} actual={values[row.key] ?? null} accent="#4ec4a0" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
