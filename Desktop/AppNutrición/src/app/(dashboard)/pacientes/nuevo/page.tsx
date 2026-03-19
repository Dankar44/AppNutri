import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PacienteForm } from "@/components/paciente-form";
import { crearPaciente } from "@/app/actions/pacientes";

export default function NuevoPacientePage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a pacientes
        </Link>
        <h1 className="text-2xl font-bold">Nuevo paciente</h1>
        <p className="text-muted-foreground mt-1">
          Completa la ficha con los datos del paciente
        </p>
      </div>

      <PacienteForm action={crearPaciente} submitLabel="Crear paciente" />
    </div>
  );
}
