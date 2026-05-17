"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line,
} from "recharts";
import { useTranslations } from "next-intl";

interface DistribucionItem {
  objetivo: string;
  cantidad: number;
}

interface MesItem {
  mes: string;
  consultas: number;
  pacientes: number;
}

export function DistribucionChart({ data }: { data: DistribucionItem[] }) {
  const t = useTranslations("reports");
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t("charts.sinDatos")}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="objetivo" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="cantidad" name={t("charts.legends.pacientes")} fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ActividadAnualChart({ data }: { data: MesItem[] }) {
  const t = useTranslations("reports");
  if (data.every((d) => d.consultas === 0 && d.pacientes === 0)) {
    return <p className="text-sm text-muted-foreground text-center py-8">{t("charts.sinDatos")}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Line type="monotone" dataKey="consultas" name={t("charts.legends.consultas")} stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="pacientes" name={t("charts.legends.pacientesNuevos")} stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
