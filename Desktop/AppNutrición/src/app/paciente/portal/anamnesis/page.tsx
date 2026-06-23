import { redirect } from "next/navigation";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { getPreconsultaContextPaciente } from "@/app/actions/preconsulta";
import { PreconsultaForm } from "@/components/paciente/preconsulta-form";

export const dynamic = "force-dynamic";

export default async function AnamnesisPortalPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const context = await getPreconsultaContextPaciente();
  if (!context) redirect("/paciente/login");

  return <PreconsultaForm context={context} modo="portal" />;
}
