import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { getPaciente } from "@/app/actions/pacientes";
import { getAccesoPaciente } from "@/app/actions/paciente-auth";
import { PortalConfig } from "./portal-config";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PortalConfigPage({ params }: Props) {
  const { id } = await params;
  const paciente = await getPaciente(id);
  if (!paciente) notFound();

  const acceso = await getAccesoPaciente(id);

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
          <Shield className="w-6 h-6 text-primary" />
          Portal del paciente
        </h1>
        <p className="text-muted-foreground mt-1">
          Configura el acceso de {paciente.nombre} {paciente.apellidos} a su portal
        </p>
      </div>

      <PortalConfig
        pacienteId={id}
        emailDefault={paciente.email || ""}
        accesoExistente={acceso ? { email: acceso.email, activo: acceso.activo, tienePassword: !!acceso.passwordHash, perfilCompleto: acceso.perfilCompleto } : null}
      />
    </div>
  );
}
