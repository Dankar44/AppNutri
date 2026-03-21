import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { getPaciente } from "@/app/actions/pacientes";
import { DiarioDietistaView } from "./diario-dietista-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DiarioDietistaPage({ params }: Props) {
  const { id } = await params;
  const paciente = await getPaciente(id);
  if (!paciente) notFound();

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
          <BookOpen className="w-6 h-6 text-green-600" />
          Diario de {paciente.nombre} {paciente.apellidos}
        </h1>
        <p className="text-muted-foreground mt-1">
          Registro alimentario del paciente
        </p>
      </div>
      <DiarioDietistaView pacienteId={id} />
    </div>
  );
}
