import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ruler, Trash2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getLocale } from "@/i18n/locale";
import { intlTag } from "@/i18n/config";
import { getPaciente } from "@/app/actions/pacientes";
import { getMedidas, getMedidasEvolucion } from "@/app/actions/medidas";
import { formatDate } from "@/lib/utils";
import { MedidasFormWrapper } from "./medidas-form-wrapper";
import { EvolucionCharts } from "./evolucion-charts";
import { MedidaDeleteButton } from "./medida-delete-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MedidasPage({ params }: Props) {
  const { id } = await params;
  const paciente = await getPaciente(id);
  if (!paciente) notFound();

  const [medidas, evolucion, t, locale] = await Promise.all([
    getMedidas(id),
    getMedidasEvolucion(id),
    getTranslations("patients"),
    getLocale(),
  ]);
  const tag = intlTag(locale);

  const chartData = evolucion.map((m) => ({
    fecha: new Date(m.fecha).toLocaleDateString(tag, {
      day: "2-digit",
      month: "short",
    }),
    peso: m.peso,
    imc: m.imc,
    grasa: m.grasaCorporal,
    musculo: m.masaMuscular,
    cintura: m.perimetroCintura,
  }));

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/pacientes/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("medidas.volverAPaciente", { nombre: paciente.nombre })}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Ruler className="w-6 h-6 text-primary" />
          {t("medidas.medidasDe", { nombre: paciente.nombre, apellidos: paciente.apellidos })}
        </h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">{t("medidas.registroMediciones")}</h2>
          <MedidasFormWrapper
            pacienteId={id}
            defaultPeso={paciente.peso}
            defaultAltura={paciente.altura}
          />
        </section>

        <EvolucionCharts data={chartData} />

        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">
            {t("medidas.historial", { count: medidas.length })}
          </h2>
          {medidas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("medidas.noHayMedidas")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t("medidas.fecha")}</th>
                    <th className="pb-2 font-medium">{t("medidas.peso")}</th>
                    <th className="pb-2 font-medium">{t("medidas.imc")}</th>
                    <th className="pb-2 font-medium hidden sm:table-cell">{t("medidas.grasaPorcentaje")}</th>
                    <th className="pb-2 font-medium hidden md:table-cell">{t("medidas.cintura")}</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {medidas.map((m) => (
                    <tr key={m.id as string} className="border-b border-border last:border-0">
                      <td className="py-2">{formatDate(m.fecha as Date)}</td>
                      <td className="py-2 font-medium">
                        {m.peso ? `${m.peso} kg` : "-"}
                      </td>
                      <td className="py-2">{m.imc != null ? String(m.imc) : "-"}</td>
                      <td className="py-2 hidden sm:table-cell">
                        {m.grasaCorporal ? `${m.grasaCorporal}%` : "-"}
                      </td>
                      <td className="py-2 hidden md:table-cell">
                        {m.perimetroCintura ? `${m.perimetroCintura} cm` : "-"}
                      </td>
                      <td className="py-2">
                        <MedidaDeleteButton medidaId={m.id as string} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
