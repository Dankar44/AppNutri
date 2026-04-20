import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { getHorarioPacientePortal } from "@/app/actions/paciente-auth";
import { getIntegracionPaciente } from "@/app/actions/google-integracion";
import { HorarioPacienteWrapper } from "./horario-paciente-wrapper";
import { IntegracionesCardPaciente } from "./integraciones-card";

export default async function HorarioPacientePage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; reason?: string }>;
}) {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const [horarioEntries, integracion, sp] = await Promise.all([
    getHorarioPacientePortal(),
    getIntegracionPaciente(),
    searchParams,
  ]);

  const googleFlash =
    sp.google === "ok"
      ? { type: "ok" as const, message: "Google Calendar conectado correctamente." }
      : sp.google === "error"
        ? {
            type: "error" as const,
            message:
              sp.reason === "no_configurado"
                ? "Google aún no está disponible. Tu nutricionista debe terminar la configuración."
                : `No se pudo conectar Google (${sp.reason || "error"}).`,
          }
        : null;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Clock}
        title="Mi horario semanal"
        subtitle="Configura tu horario y tu nutricionista lo verá reflejado. Los cambios que haga tu nutricionista también aparecerán aquí."
      />

      <HorarioPacienteWrapper initialEntries={horarioEntries} />

      <IntegracionesCardPaciente integracion={integracion} flash={googleFlash} />
    </div>
  );
}
