import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PacienteForm } from "@/components/paciente-form";
import { getPaciente, actualizarPaciente } from "@/app/actions/pacientes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarPacientePage({ params }: Props) {
  const { id } = await params;
  const paciente = await getPaciente(id);
  if (!paciente) notFound();

  async function handleUpdate(data: Parameters<typeof actualizarPaciente>[1]) {
    "use server";
    await actualizarPaciente(id, data);
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/pacientes/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al paciente
        </Link>
        <h1 className="text-2xl font-bold">
          Editar: {paciente.nombre} {paciente.apellidos}
        </h1>
        <p className="text-muted-foreground mt-1">
          Modifica los datos del paciente
        </p>
      </div>

      <PacienteForm
        paciente={paciente}
        action={handleUpdate}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
