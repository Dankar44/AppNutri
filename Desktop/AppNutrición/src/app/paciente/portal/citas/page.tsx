import { Calendar as CalendarIcon } from "lucide-react";
import { getCitasPaciente } from "@/app/actions/citas-flujo";
import { CitasPortalClient } from "./citas-client";
import { PageHeader } from "@/components/page-header";

export default async function CitasPortalPage() {
  const citas = await getCitasPaciente();

  return (
    <div>
      <PageHeader
        icon={CalendarIcon}
        title="Mis citas"
        subtitle="Solicita nuevas citas con tu nutricionista y gestiona las que ya tienes."
      />
      <CitasPortalClient citasIniciales={citas} />
    </div>
  );
}
