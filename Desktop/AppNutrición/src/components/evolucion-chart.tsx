"use client";

import { useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
} from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataPoint = Record<string, any>;

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
  unit?: string;
  decimals?: number;
}

interface EvolucionChartProps {
  data: DataPoint[];
  lines: SeriesConfig[];
  height?: number;
  /** Banda horizontal de referencia (rango saludable, etc.) */
  referenceArea?: { y1: number; y2: number; label?: string; color?: string };
  /** Mostrar valor del último punto como etiqueta fija */
  showLastValueLabel?: boolean;
  /** Oculta la leyenda (útil si una sola serie) */
  hideLegend?: boolean;
  /** Relleno opaco (para dashboards compactos) */
  fill?: "gradient" | "none";
}

export function EvolucionChart({
  data,
  lines,
  height = 280,
  referenceArea,
  hideLegend = false,
  fill = "gradient",
}: EvolucionChartProps) {
  const idBase = useId().replace(/:/g, "");

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        No hay datos suficientes para mostrar el gráfico
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 16, right: 20, left: 0, bottom: 8 }}
      >
        <defs>
          {lines.map((line) => (
            <linearGradient
              key={line.key}
              id={`grad-${idBase}-${line.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={line.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={line.color} stopOpacity={0} />
            </linearGradient>
          ))}
          <filter id={`shadow-${idBase}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="3"
              floodColor="#000"
              floodOpacity="0.08"
            />
          </filter>
        </defs>

        <CartesianGrid
          strokeDasharray="3 4"
          vertical={false}
          className="stroke-border/70"
        />
        <XAxis
          dataKey="fecha"
          tick={{ fontSize: 11 }}
          tickMargin={8}
          axisLine={false}
          tickLine={false}
          className="text-muted-foreground"
          padding={{ left: 12, right: 12 }}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          className="text-muted-foreground"
          domain={["auto", "auto"]}
          width={42}
        />

        {referenceArea && (
          <ReferenceArea
            y1={referenceArea.y1}
            y2={referenceArea.y2}
            strokeOpacity={0}
            fill={referenceArea.color ?? "#10b981"}
            fillOpacity={0.08}
            ifOverflow="extendDomain"
            label={
              referenceArea.label
                ? {
                    value: referenceArea.label,
                    position: "insideTopRight",
                    fill: referenceArea.color ?? "#10b981",
                    fontSize: 10,
                    opacity: 0.8,
                  }
                : undefined
            }
          />
        )}

        <Tooltip
          cursor={{
            stroke: "currentColor",
            strokeOpacity: 0.25,
            strokeDasharray: "4 4",
          }}
          content={<CustomTooltip lines={lines} />}
        />

        {!hideLegend && lines.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            iconType="circle"
          />
        )}

        {lines.map((line) => (
          <Area
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color}
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={fill === "gradient" ? `url(#grad-${idBase}-${line.key})` : "transparent"}
            dot={false}
            activeDot={{
              r: 5,
              strokeWidth: 3,
              stroke: "hsl(var(--card, 0 0% 100%))",
              fill: line.color,
            }}
            filter={`url(#shadow-${idBase})`}
            connectNulls
            isAnimationActive
            animationDuration={700}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip(props: any) {
  const { active, payload, label, lines } = props as {
    active?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any[];
    label?: string;
    lines: SeriesConfig[];
  };
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur-sm shadow-lg px-3 py-2 min-w-[140px]">
      <p className="text-[11px] text-muted-foreground font-medium mb-1">{label}</p>
      <div className="space-y-0.5">
        {payload.map((entry) => {
          const cfg = lines.find((l) => l.key === entry.dataKey);
          const value = typeof entry.value === "number" ? entry.value : Number(entry.value);
          const decimals = cfg?.decimals ?? 1;
          return (
            <div key={String(entry.dataKey)} className="flex items-center gap-2 text-xs">
              <span
                className="inline-block w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{cfg?.label ?? entry.name}</span>
              <span className="ml-auto font-semibold tabular-nums">
                {Number.isFinite(value) ? value.toFixed(decimals) : "—"}
                {cfg?.unit ? ` ${cfg.unit}` : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
