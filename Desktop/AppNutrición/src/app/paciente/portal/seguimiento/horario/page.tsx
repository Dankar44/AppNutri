import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { getHorarioPacientePortal } from "@/app/actions/paciente-auth";
import { HorarioPacienteWrapper } from "./horario-paciente-wrapper";

export default async function HorarioPacientePage() {
  const t = await getTranslations("patient-portal.horario");
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const horarioEntries = await getHorarioPacientePortal();

  return (
    <div className="space-y-5">
      <PageHeader
        icon={Clock}
        title={t("title")}
        subtitle={t("subtitle")}
      />

      <HorarioPacienteWrapper initialEntries={horarioEntries} />
    </div>
  );
}
