import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarCheck2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { SolicitarCitaForm } from "./solicitar-cita-form";

export default async function NuevaCitaPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/paciente/portal/citas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mis citas
        </Link>
        <PageHeader
          icon={CalendarCheck2}
          title="Solicitar nueva cita"
          subtitle="Elige un hueco libre en la agenda de tu nutricionista. Verás en tiempo real qué horas tiene disponibles."
        />
      </div>

      <SolicitarCitaForm />
    </div>
  );
}
