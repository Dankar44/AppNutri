import { redirect } from "next/navigation";
import { TrendingUp, LineChart as LineChartIcon } from "lucide-react";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";
import {
  EvolucionCard,
  type Medida,
} from "@/components/paciente/evolucion/evolucion-card";
import { PerimetrosCard, type PerimetroPoint } from "@/components/paciente/evolucion/perimetros-card";
import { HitosCard } from "@/components/paciente/evolucion/hitos-card";

export default async function PatientEvolucionPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");
  const t = await getTranslations("patient-portal");

  const medidas = await prisma.medidaAntropometrica.findMany({
    where: { pacienteId: session.pacienteId },
    orderBy: { fecha: "asc" },
    select: {
      fecha: true,
      peso: true,
      imc: true,
      grasaCorporal: true,
      perimetroCintura: true,
      perimetroCadera: true,
      perimetroBrazo: true,
    },
  });

  const data: Medida[] = medidas.map((m) => ({
    fechaISO: new Date(m.fecha).toISOString().split("T")[0],
    peso: m.peso,
    imc: m.imc,
    grasa: m.grasaCorporal,
  }));

  const perimetros: PerimetroPoint[] = medidas.map((m) => ({
    fechaISO: new Date(m.fecha).toISOString().split("T")[0],
    cintura: m.perimetroCintura,
    cadera: m.perimetroCadera,
    brazo: m.perimetroBrazo,
  }));

  const hasPeso = data.some((d) => d.peso !== null);
  const hasImc = data.some((d) => d.imc !== null);
  const hasGrasa = data.some((d) => d.grasa !== null);
  const hasPerimetros = perimetros.some(
    (p) => p.cintura !== null || p.cadera !== null || p.brazo !== null
  );

  return (
    <div>
      <PageHeader
        icon={TrendingUp}
        title={t("evolucion.title")}
        subtitle={
          data.length > 0
            ? t("evolucion.subtitleConMediciones", { count: data.length, countPlural: data.length !== 1 ? "es" : "" })
            : t("evolucion.subtitleSinMediciones")
        }
      />

      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <div data-tour="evolution-charts" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            {hasPeso && (
              <EvolucionCard
                iconName="scale"
                title={t("evolucion.cards.peso")}
                metric="peso"
                unit="kg"
                decimals={1}
                color="#3b82f6"
                data={data}
              />
            )}
            {hasImc && (
              <EvolucionCard
                iconName="activity"
                title={t("evolucion.cards.imc")}
                metric="imc"
                unit=""
                decimals={1}
                color="#f59e0b"
                data={data}
                referenceArea={{ y1: 18.5, y2: 24.9, label: t("evolucion.cards.saludable") }}
              />
            )}
            {hasGrasa && (
              <EvolucionCard
                iconName="percent"
                title={t("evolucion.cards.grasaCorporal")}
                metric="grasa"
                unit="%"
                decimals={1}
                color="#ef4444"
                data={data}
              />
            )}
            {hasPerimetros && <PerimetrosCard data={perimetros} />}
          </div>

          <HitosCard data={data} />
        </div>
      )}
    </div>
  );
}

async function EmptyState() {
  const t = await getTranslations("patient-portal");
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 sm:p-14 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl border border-border text-muted-foreground mb-4">
        <LineChartIcon className="w-7 h-7" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-semibold mb-1">{t("evolucion.empty.title")}</h2>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        {t("evolucion.empty.description")}
      </p>
    </div>
  );
}
