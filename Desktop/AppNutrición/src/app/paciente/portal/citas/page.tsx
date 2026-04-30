import { Calendar as CalendarIcon } from "lucide-react";
import { getCitasPaciente } from "@/app/actions/citas-flujo";
import { getIntegracionPaciente } from "@/app/actions/google-integracion";
import { CitasPortalClient } from "./citas-client";
import { IntegracionesCardPaciente } from "./integraciones-card";
import { PageHeader } from "@/components/page-header";

function googleErrorMessagePaciente(reason?: string): string {
  switch (reason) {
    case "no_configurado":
      return "Google aún no está disponible. Tu nutricionista debe terminar la configuración.";
    case "state_mismatch":
      return "La conexión con Google se canceló o expiró. Inténtalo de nuevo.";
    case "missing_params":
      return "No se recibió la respuesta de Google. Inténtalo de nuevo.";
    case "no_tokens":
      return "Google no concedió los permisos necesarios. Asegúrate de aceptar todos los permisos.";
    case "exchange_failed":
      return "Error al conectar con Google. Inténtalo de nuevo en unos minutos.";
    case "access_denied":
      return "Se denegó el acceso a Google. Inténtalo de nuevo y acepta los permisos.";
    default:
      return "No se pudo conectar con Google. Inténtalo de nuevo.";
  }
}

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
            message: googleErrorMessagePaciente(sp.reason),
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
