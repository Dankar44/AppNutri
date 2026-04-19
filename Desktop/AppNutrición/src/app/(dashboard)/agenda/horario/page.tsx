import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { getHorarioLaboral } from "@/app/actions/horario-laboral";
import { HorarioLaboralEditor } from "./horario-laboral-editor";
import { PageHeader } from "@/components/page-header";

export default async function HorarioLaboralPage() {
  const horario = await getHorarioLaboral();

  return (
    <div>
      <Link
        href="/agenda"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la agenda
      </Link>
      <PageHeader
        icon={Clock}
        title="Horario de trabajo"
        subtitle="Define los días y las franjas en las que atiendes consultas. Se usa para marcar disponibilidad y limitar las horas visibles en la agenda."
      />

      <HorarioLaboralEditor inicial={horario} />
    </div>
  );
}
