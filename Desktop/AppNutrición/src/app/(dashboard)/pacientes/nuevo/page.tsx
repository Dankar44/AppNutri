import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PacienteForm } from "@/components/paciente-form";
import { crearPaciente } from "@/app/actions/pacientes";

export default async function NuevoPacientePage() {
  const t = await getTranslations("patients");
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("nuevo.volverAPacientes")}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("nuevo.titulo")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("nuevo.descripcion")}
        </p>
      </div>

      <PacienteForm action={crearPaciente} submitLabel={t("nuevo.crearPaciente")} />
    </div>
  );
}
