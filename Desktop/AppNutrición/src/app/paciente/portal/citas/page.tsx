import { Calendar as CalendarIcon } from "lucide-react";
import { getCitasPaciente } from "@/app/actions/citas-flujo";
import { getIntegracionPaciente } from "@/app/actions/google-integracion";
import { CitasPortalClient } from "./citas-client";
import { IntegracionesCardPaciente } from "./integraciones-card";
import { PageHeader } from "@/components/page-header";

export default async function CitasPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; reason?: string }>;
}) {
  const [citas, integracion, sp] = await Promise.all([
    getCitasPaciente(),
    getIntegracionPaciente(),
    searchParams,
  ]);

  const googleFlash =
    sp.google === "ok"
      ? { type: "ok" as const, message: "Google Calendar conectado correctamente." }
      : sp.google === "error"
        ? {
            type: "error" as const,
            message:
              sp.reason === "no_configurado"
                ? "Google aún no está disponible. Tu nutricionista debe terminar la configuración."
                : `No se pudo conectar Google (${sp.reason || "error"}).`,
          }
        : null;

  return (
    <div className="space-y-5">
      <PageHeader
        icon={CalendarIcon}
        title="Mis citas"
        subtitle="Solicita nuevas citas con tu nutricionista y gestiona las que ya tienes."
      />
      <CitasPortalClient citasIniciales={citas} />
      <IntegracionesCardPaciente integracion={integracion} flash={googleFlash} />
    </div>
  );
}
