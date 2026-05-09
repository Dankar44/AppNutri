"use client";

import { useEffect, useState } from "react";
import { EvolucionChart } from "@/components/evolucion-chart";

interface ActividadData {
  mes: string;
  consultas: number;
  pacientesTotales: number;
}

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return mobile;
}

export function DashboardCharts({
  data,
}: {
  data: ActividadData[];
}) {
  const isMobile = useIsMobile();
  const height = isMobile ? 250 : 400;
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
        { key: "consultas", label: "Consultas", color: "#3b82f6", decimals: 0 },
        { key: "pacientes", label: "Pacientes totales", color: "#22c55e", decimals: 0 },
      ]}
      height={height}
    />
  );
}
