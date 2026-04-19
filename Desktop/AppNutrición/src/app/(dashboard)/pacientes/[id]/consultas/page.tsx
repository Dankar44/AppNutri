import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, FileText } from "lucide-react";
import { getPaciente } from "@/app/actions/pacientes";
import { getConsultas } from "@/app/actions/consultas";
import { formatDate } from "@/lib/utils";
import { ConsultaActions } from "./consulta-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConsultasPage({ params }: Props) {
  const { id } = await params;
  const paciente = await getPaciente(id);
  if (!paciente) notFound();

  const consultas = await getConsultas(id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/pacientes/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a {paciente.nombre}
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Consultas de {paciente.nombre} {paciente.apellidos}
          </h1>
          <Link
            href={`/pacientes/${id}/consultas/nueva`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nueva consulta
          </Link>
        </div>
      </div>

      {consultas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">Sin consultas</h3>
          <p className="text-muted-foreground mb-4">
            Registra la primera consulta con este paciente
          </p>
          <Link
            href={`/pacientes/${id}/consultas/nueva`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nueva consulta
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {consultas.map((consulta) => (
            <div
              key={consulta.id}
              className="bg-card rounded-xl border border-border p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold">
                    {formatDate(consulta.fecha)}
                  </p>
                  {consulta.motivo && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {consulta.motivo}
                    </p>
                  )}
                </div>
                <ConsultaActions consultaId={consulta.id} />
              </div>

              {consulta.notas && (
                <div className="bg-muted/50 rounded-lg p-3 mb-3">
                  <p className="text-sm whitespace-pre-wrap">{consulta.notas}</p>
                </div>
              )}

              {consulta.medida && (
                <div className="flex flex-wrap gap-3 text-xs">
                  {consulta.medida.peso && (
                    <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                      Peso: {consulta.medida.peso} kg
                    </span>
                  )}
                  {consulta.medida.imc && (
                    <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                      IMC: {consulta.medida.imc}
                    </span>
                  )}
                  {consulta.medida.grasaCorporal && (
                    <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 font-medium">
                      Grasa: {consulta.medida.grasaCorporal}%
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
