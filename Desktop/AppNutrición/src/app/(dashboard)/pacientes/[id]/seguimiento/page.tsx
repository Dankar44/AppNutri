import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { getPaciente } from "@/app/actions/pacientes";
import { SeguimientoDietistaView } from "./seguimiento-dietista-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SeguimientoDietistaPage({ params }: Props) {
  const { id } = await params;
  const paciente = await getPaciente(id);
  if (!paciente) notFound();

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
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Seguimiento de {paciente.nombre} {paciente.apellidos}
        </h1>
        <p className="text-muted-foreground mt-1">
          Comidas, agua, ejercicio y notas registradas por el paciente
        </p>
      </div>
      <SeguimientoDietistaView pacienteId={id} />
    </div>
  );
}
