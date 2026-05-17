import { redirect } from "next/navigation";
import { User } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { TourSettings } from "@/components/tour/tour-settings";
import { getTranslations } from "next-intl/server";
import { PerfilPacienteForm } from "./perfil-form";

export default async function PerfilPacientePage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const paciente = await prisma.paciente.findUnique({
    where: { id: session.pacienteId },
    select: {
      nombre: true,
      apellidos: true,
      email: true,
      telefono: true,
      fotoUrl: true,
    },
  });

  if (!paciente) redirect("/paciente/login");
  const t = await getTranslations("patient-portal");

  return (
    <div className="space-y-8">
      <PageHeader
        icon={User}
        title={t("perfil.title")}
        subtitle={t("perfil.subtitle")}
      />

      <PerfilPacienteForm
        nombre={paciente.nombre}
        apellidos={paciente.apellidos}
        email={paciente.email || ""}
        telefono={paciente.telefono || ""}
        fotoUrl={paciente.fotoUrl || ""}
      />

      {/* Guías interactivas */}
      <TourSettings />
    </div>
  );
}
