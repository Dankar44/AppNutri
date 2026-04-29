import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { getHorarioPacientePortal } from "@/app/actions/paciente-auth";
import { HorarioPacienteWrapper } from "./horario-paciente-wrapper";

export default async function HorarioPacientePage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const horarioEntries = await getHorarioPacientePortal();

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Clock}
        title="Mi horario semanal"
        subtitle="Configura tu horario y tu nutricionista lo verá reflejado. Los cambios que haga tu nutricionista también aparecerán aquí."
      />

      <HorarioPacienteWrapper initialEntries={horarioEntries} />
    </div>
  );
}
