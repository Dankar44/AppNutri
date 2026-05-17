import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarCheck2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { getTranslations } from "next-intl/server";
import { SolicitarCitaForm } from "./solicitar-cita-form";

export default async function NuevaCitaPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");
  const t = await getTranslations("patient-portal");

  return (
    <div className="space-y-4">
      <div>
        <Link
          href="/paciente/portal/citas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("nuevaCita.volverMisCitas")}
        </Link>
        <PageHeader
          icon={CalendarCheck2}
          title={t("nuevaCita.title")}
          subtitle={t("nuevaCita.subtitle")}
        />
      </div>

      <SolicitarCitaForm />
    </div>
  );
}
