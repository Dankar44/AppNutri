"use client";

import { UtensilsCrossed, Droplets, Dumbbell, Flame } from "lucide-react";
import { formatMlCorto } from "@/lib/seguimiento";

interface Props {
  comidasCumplidas: number;
  comidasTotal: number;
  aguaML: number;
  aguaObjetivo: number;
  ejercicio: boolean;
  ejercicioMinutos: number;
  ejercicioKcal: number;
  racha?: number;
}

export function ResumenHero({
  comidasCumplidas,
  comidasTotal,
  aguaML,
  aguaObjetivo,
  ejercicio,
  ejercicioMinutos,
  ejercicioKcal,
  racha,
}: Props) {
  const comidasPct = comidasTotal > 0 ? Math.round((comidasCumplidas / comidasTotal) * 100) : 0;
  const aguaPct = Math.min(100, Math.round((aguaML / aguaObjetivo) * 100));
  const objetivoMin = 30;
  const ejercicioPct = ejercicio ? Math.min(100, Math.round((ejercicioMinutos / objetivoMin) * 100)) : 0;

  const total = comidasPct + aguaPct + ejercicioPct;
  const globalPct = Math.round(total / 3);

  return (
    <section
      aria-label="Resumen del día"
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="flex flex-col items-center gap-2 shrink-0">
          <SegmentedDonut
            size={140}
            stroke={12}
            segments={[
              { pct: comidasPct, color: "#16a34a", label: "Comidas" },
              { pct: aguaPct, color: "#2563eb", label: "Agua" },
              { pct: ejercicioPct, color: "#f59e0b", label: "Ejercicio" },
            ]}
            centerTop="Total"
            centerValue={`${globalPct}%`}
          />
          {typeof racha === "number" && racha > 0 && (
            <div className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 px-2.5 py-0.5 text-xs font-semibold">
              <Flame className="w-3 h-3" />
              {racha} {racha === 1 ? "día" : "días"}
            </div>
          )}
        </div>

        <div className="flex-1 grid grid-cols-3 gap-3 w-full">
          <MetricCard
            icon={<UtensilsCrossed className="w-4 h-4" />}
            tint="green"
            label="Comidas"
            value={`${comidasCumplidas}/${comidasTotal}`}
            sub={`${comidasPct}%`}
          />
          <MetricCard
            icon={<Droplets className="w-4 h-4" />}
            tint="blue"
            label="Agua"
            value={formatMlCorto(aguaML)}
            sub={`${aguaPct}%`}
          />
          <MetricCard
            icon={<Dumbbell className="w-4 h-4" />}
            tint="amber"
            label="Ejercicio"
            value={ejercicio ? `${ejercicioMinutos}'` : "—"}
            sub={ejercicio && ejercicioKcal > 0 ? `${ejercicioKcal} kcal` : "sin actividad"}
          />
        </div>
      </div>
    </section>
  );
}

interface Segment {
  pct: number; // 0..100
  color: string;
  label: string;
}

function SegmentedDonut({
  size,
  stroke,
  segments,
  centerTop,
  centerValue,
  gapDeg = 6,
}: {
  size: number;
  stroke: number;
  segments: Segment[];
  centerTop?: string;
  centerValue?: string;
  gapDeg?: number;
}) {
  const radius = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const segCount = segments.length;
  const totalGap = gapDeg * segCount;
  const arcDeg = (360 - totalGap) / segCount;
  const arcLen = (arcDeg / 360) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={segments.map((s) => `${s.label}: ${s.pct}%`).join(", ")}
    >
      <svg width={size} height={size} className="-rotate-90">
        {segments.map((seg, i) => {
          const startAngle = i * (arcDeg + gapDeg) + gapDeg / 2;
          const rotate = startAngle;
          const fillLen = (Math.min(100, Math.max(0, seg.pct)) / 100) * arcLen;
          return (
            <g key={i} transform={`rotate(${rotate} ${cx} ${cy})`}>
              {/* Pista del segmento */}
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                stroke={seg.color}
                strokeOpacity={0.18}
                strokeDasharray={`${arcLen} ${circumference - arcLen}`}
                strokeDashoffset={0}
              />
              {/* Relleno del segmento */}
              {fillLen > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  stroke={seg.color}
                  strokeDasharray={`${fillLen} ${circumference - fillLen}`}
                  strokeDashoffset={0}
                  style={{ transition: "stroke-dasharray 700ms ease-out" }}
                />
              )}
            </g>
          );
        })}
      </svg>
      {(centerTop || centerValue) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
          {centerTop && (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium mb-1">
              {centerTop}
            </span>
          )}
          {centerValue && (
            <span className="text-2xl font-bold tabular-nums">{centerValue}</span>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  tint,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  tint: "green" | "blue" | "amber";
  label: string;
  value: string;
  sub: string;
}) {
  const tintClasses = {
    green: "text-green-600 dark:text-green-400 bg-green-100/70 dark:bg-green-950/30",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/30",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/30",
  }[tint];

  return (
    <div className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${tintClasses}`}>
          {icon}
        </span>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <p className="text-lg sm:text-xl font-bold leading-none">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
