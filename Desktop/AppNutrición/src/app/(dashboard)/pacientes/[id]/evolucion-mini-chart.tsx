"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DataPoint {
  fecha: string;
  peso: number | null;
  imc: number | null;
  grasa: number | null;
  cintura: number | null;
}

export function EvolucionMiniChart({ data }: { data: DataPoint[] }) {
  const hasPeso = data.some((d) => d.peso !== null);
  const hasGrasa = data.some((d) => d.grasa !== null);
  const hasCintura = data.some((d) => d.cintura !== null);

  const lines: { key: string; label: string; color: string }[] = [];
  if (hasPeso) lines.push({ key: "peso", label: "Peso (kg)", color: "#3b82f6" });
  if (hasGrasa) lines.push({ key: "grasa", label: "% Grasa", color: "#ef4444" });
  if (hasCintura) lines.push({ key: "cintura", label: "Cintura (cm)", color: "#8b5cf6" });

  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">Sin datos de evolución</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "11px" }} />
        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.label}
            stroke={line.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
