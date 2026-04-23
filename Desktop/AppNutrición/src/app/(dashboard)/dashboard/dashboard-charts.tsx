"use client";

import { EvolucionChart } from "@/components/evolucion-chart";

interface ActividadData {
  mes: string;
  consultas: number;
  pacientesTotales: number;
}

export function DashboardCharts({
  data,
  height = 250,
}: {
  data: ActividadData[];
  height?: number;
}) {
  if (data.every((d) => d.consultas === 0 && d.pacientesTotales === 0)) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        Sin datos de actividad aún
      </div>
    );
  }

  return (
    <EvolucionChart
      data={data.map((d) => ({ fecha: d.mes, consultas: d.consultas, pacientes: d.pacientesTotales }))}
      lines={[
        { key: "consultas", label: "Consultas", color: "#3b82f6" },
        { key: "pacientes", label: "Pacientes totales", color: "#22c55e" },
      ]}
      height={height}
    />
  );
}
