import { Calendar as CalendarIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCitasPaciente } from "@/app/actions/citas-flujo";
import { getIntegracionPaciente } from "@/app/actions/google-integracion";
import { CitasPortalClient } from "./citas-client";
import { IntegracionesCardPaciente } from "./integraciones-card";
import { PageHeader } from "@/components/page-header";

function googleErrorKeyPaciente(reason?: string): string {
  switch (reason) {
    case "no_configurado":
      return "integraciones.googleCalendar.errors.noConfigurado";
    case "state_mismatch":
      return "integraciones.googleCalendar.errors.stateMismatch";
    case "missing_params":
      return "integraciones.googleCalendar.errors.missingParams";
    case "no_tokens":
      return "integraciones.googleCalendar.errors.noTokens";
    case "exchange_failed":
      return "integraciones.googleCalendar.errors.exchangeFailed";
    case "access_denied":
      return "integraciones.googleCalendar.errors.accessDenied";
    default:
      return "integraciones.googleCalendar.errors.default";
  }
}

export default async function CitasPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; reason?: string }>;
}) {
  const t = await getTranslations("patient-portal");
  const [citas, integracion, sp] = await Promise.all([
    getCitasPaciente(),
    getIntegracionPaciente(),
    searchParams,
  ]);

  const googleFlash =
    sp.google === "ok"
      ? { type: "ok" as const, message: t("integraciones.googleCalendar.flashOk") }
      : sp.google === "error"
        ? {
            type: "error" as const,
            message: t(googleErrorKeyPaciente(sp.reason) as never),
          }
        : null;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={CalendarIcon}
        title={t("citas.title")}
        subtitle={t("citas.subtitle")}
      />
      <CitasPortalClient citasIniciales={citas} />
      <IntegracionesCardPaciente integracion={integracion} flash={googleFlash} />
    </div>
  );
}
