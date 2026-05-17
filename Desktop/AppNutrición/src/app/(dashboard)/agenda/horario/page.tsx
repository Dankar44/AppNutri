import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getHorarioLaboral } from "@/app/actions/horario-laboral";
import { HorarioLaboralEditor } from "./horario-laboral-editor";
import { PageHeader } from "@/components/page-header";

export default async function HorarioLaboralPage() {
  const [horario, t] = await Promise.all([
    getHorarioLaboral(),
    getTranslations("agenda.horario"),
  ]);

  return (
    <div>
      <Link
        href="/agenda"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("backToAgenda")}
      </Link>
      <PageHeader
        icon={Clock}
        title={t("pageTitle")}
        subtitle={t("subtitle")}
      />

      <HorarioLaboralEditor inicial={horario} />
    </div>
  );
}
