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
import { useTranslations } from "next-intl";

interface Props {
  data: { mes: string; dietistas: number; pacientes: number }[];
}

export function AdminCharts({ data }: Props) {
  const t = useTranslations("admin.dashboard.charts");

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="#a3a3a3" />
          <YAxis tick={{ fontSize: 12 }} stroke="#a3a3a3" allowDecimals={false} />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e5e5",
              fontSize: "13px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "13px" }} />
          <Line
            type="monotone"
            dataKey="dietistas"
            name={t("chartLegendDietistas")}
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: "#6366f1", r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="pacientes"
            name={t("chartLegendPacientes")}
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ fill: "#16a34a", r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
