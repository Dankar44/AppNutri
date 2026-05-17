"use client";

import { EvolucionChart } from "@/components/evolucion-chart";
import { useTranslations } from "next-intl";

interface ChartDataPoint {
  fecha: string;
  peso: number | null;
  imc: number | null;
  grasa: number | null;
  musculo: number | null;
  cintura: number | null;
}

export function EvolucionCharts({ data }: { data: ChartDataPoint[] }) {
  const t = useTranslations("patients.evolucionCharts");
  const hasPeso = data.some((d) => d.peso !== null);
  const hasComposicion = data.some((d) => d.grasa !== null || d.musculo !== null);
  const hasPerimetros = data.some((d) => d.cintura !== null);

  if (!hasPeso && !hasComposicion && !hasPerimetros) {
    return null;
  }

  return (
    <div className="space-y-6">
      {hasPeso && (
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">{t("pesoImc")}</h2>
          <EvolucionChart
            data={data}
            lines={[
              { key: "peso", label: t("pesoKg"), color: "#3b82f6" },
              { key: "imc", label: t("imc"), color: "#f59e0b" },
            ]}
          />
        </section>
      )}

      {hasComposicion && (
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">{t("composicionCorporal")}</h2>
          <EvolucionChart
            data={data}
            lines={[
              { key: "grasa", label: t("grasaPct"), color: "#ef4444" },
              { key: "musculo", label: t("masaMuscularKg"), color: "#22c55e" },
            ]}
          />
        </section>
      )}

      {hasPerimetros && (
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">{t("perimetros")}</h2>
          <EvolucionChart
            data={data}
            lines={[
              { key: "cintura", label: t("cinturaCm"), color: "#8b5cf6" },
            ]}
          />
        </section>
      )}
    </div>
  );
}
