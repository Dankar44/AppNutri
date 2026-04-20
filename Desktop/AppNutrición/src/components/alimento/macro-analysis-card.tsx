"use client";

import { Droplets, Circle, Diamond, Triangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const MACRO_COLORS = {
  grasas: "#f0b845",
  carbohidratos: "#d9956a",
  proteinas: "#7eaadf",
  fibra: "#4ec4a0",
};

interface Props {
  title: string;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
}

export function MacroAnalysisCard({ title, proteinas, carbohidratos, grasas, fibra }: Props) {
  const grasasKcal = grasas * 9;
  const carbKcal = carbohidratos * 4;
  const protKcal = proteinas * 4;
  const fibraKcal = fibra * 2;
  const energyTotal = grasasKcal + carbKcal + protKcal + fibraKcal || 1;
  const energySinFibra = grasasKcal + carbKcal + protKcal || 1;

  const pieData = [
    { name: "Grasa", value: grasasKcal, color: MACRO_COLORS.grasas },
    { name: "Hidratos", value: carbKcal, color: MACRO_COLORS.carbohidratos },
    { name: "Proteína", value: protKcal, color: MACRO_COLORS.proteinas },
  ].filter((s) => s.value > 0);

  const rows = [
    { key: "grasas", label: "Grasa", value: grasas, kcal: grasasKcal, color: MACRO_COLORS.grasas, bgColor: "bg-yellow-50 dark:bg-yellow-500/10" },
    { key: "carbohidratos", label: "Hidratos", value: carbohidratos, kcal: carbKcal, color: MACRO_COLORS.carbohidratos, bgColor: "bg-orange-50 dark:bg-orange-500/10" },
    { key: "proteinas", label: "Proteína", value: proteinas, kcal: protKcal, color: MACRO_COLORS.proteinas, bgColor: "bg-blue-50 dark:bg-blue-500/10" },
    { key: "fibra", label: "Fibra alimentaria", value: fibra, kcal: fibraKcal, color: MACRO_COLORS.fibra, bgColor: "bg-emerald-50 dark:bg-emerald-500/10" },
  ];

  void energySinFibra;

  return (
    <section className="bg-card rounded-xl border border-border p-6 sm:p-8 flex flex-col h-full w-full">
      <h2 className="text-xl font-semibold mb-6 text-center">{title}</h2>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
        <div className="w-[240px] h-[240px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={104}
                outerRadius={115}
                paddingAngle={1}
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                {pieData.map((entry, i) => (
                  <Cell key={`outer-${i}`} fill={entry.color} opacity={0.2} />
                ))}
              </Pie>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={30}
                outerRadius={95}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-4 pt-1">
          {rows.map((row) => {
            const pct = (row.kcal / energyTotal) * 100;
            return (
              <div key={row.key}>
                <div className="flex items-center justify-between gap-2 text-sm mb-1">
                  <span className="text-foreground font-medium flex items-center gap-2 min-w-0">
                    {row.key === "grasas" && <Droplets className="w-3.5 h-3.5 shrink-0" />}
                    {row.key === "carbohidratos" && <Circle className="w-3.5 h-3.5 shrink-0" />}
                    {row.key === "proteinas" && <Diamond className="w-3.5 h-3.5 shrink-0" />}
                    {row.key === "fibra" && <Triangle className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="font-bold tabular-nums text-sm whitespace-nowrap shrink-0">{row.value.toFixed(1)} g</span>
                </div>
                <div className={`h-3.5 ${row.bgColor} rounded-full overflow-hidden`}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: row.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-6 flex flex-wrap items-center justify-center gap-2">
        {rows.map((row) => {
          const pct = (row.kcal / energyTotal) * 100;
          const isZero = pct < 0.5;
          return (
            <span
              key={row.key}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${row.bgColor} text-sm font-medium transition-opacity ${isZero ? "opacity-40" : ""}`}
              style={{ color: row.color }}
            >
              {row.key === "grasas" && <Droplets className="w-4 h-4" />}
              {row.key === "carbohidratos" && <Circle className="w-4 h-4" />}
              {row.key === "proteinas" && <Diamond className="w-4 h-4" />}
              {row.key === "fibra" && <Triangle className="w-4 h-4" />}
              <span>{row.label}</span>
              <span className="font-bold tabular-nums text-base">{Math.round(pct)}%</span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
