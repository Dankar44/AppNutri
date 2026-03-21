import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ruler, Trash2 } from "lucide-react";
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

  const [medidas, evolucion] = await Promise.all([
    getMedidas(id),
    getMedidasEvolucion(id),
  ]);

  const chartData = evolucion.map((m) => ({
    fecha: new Date(m.fecha).toLocaleDateString("es-ES", {
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
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a {paciente.nombre}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Ruler className="w-6 h-6 text-primary" />
          Medidas de {paciente.nombre} {paciente.apellidos}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <EvolucionCharts data={chartData} />

          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">
              Historial ({medidas.length})
            </h2>
            {medidas.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay medidas registradas
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Fecha</th>
                      <th className="pb-2 font-medium">Peso</th>
                      <th className="pb-2 font-medium">IMC</th>
                      <th className="pb-2 font-medium hidden sm:table-cell">% Grasa</th>
                      <th className="pb-2 font-medium hidden md:table-cell">Cintura</th>
                      <th className="pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {medidas.map((m) => (
                      <tr key={m.id} className="border-b border-border last:border-0">
                        <td className="py-2">{formatDate(m.fecha)}</td>
                        <td className="py-2 font-medium">
                          {m.peso ? `${m.peso} kg` : "-"}
                        </td>
                        <td className="py-2">{m.imc ?? "-"}</td>
                        <td className="py-2 hidden sm:table-cell">
                          {m.grasaCorporal ? `${m.grasaCorporal}%` : "-"}
                        </td>
                        <td className="py-2 hidden md:table-cell">
                          {m.perimetroCintura ? `${m.perimetroCintura} cm` : "-"}
                        </td>
                        <td className="py-2">
                          <MedidaDeleteButton medidaId={m.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div>
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">Nueva medición</h2>
            <MedidasFormWrapper
              pacienteId={id}
              defaultPeso={paciente.peso}
              defaultAltura={paciente.altura}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
