import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { getHorarioPacientePortal } from "@/app/actions/paciente-auth";
import { getIntegracionPaciente } from "@/app/actions/google-integracion";
import { TourSettings } from "@/components/tour/tour-settings";
import { PerfilPacienteForm } from "./perfil-form";
import { HorarioPacienteWrapper } from "./horario-paciente-wrapper";
import { IntegracionesCardPaciente } from "./integraciones-card";

export default async function PerfilPacientePage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; reason?: string }>;
}) {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const [paciente, horarioEntries, integracion, sp] = await Promise.all([
    prisma.paciente.findUnique({
      where: { id: session.pacienteId },
      select: {
        nombre: true,
        apellidos: true,
        email: true,
        telefono: true,
        fotoUrl: true,
      },
    }),
    getHorarioPacientePortal(),
    getIntegracionPaciente(),
    searchParams,
  ]);

  if (!paciente) redirect("/paciente/login");

  const googleFlash =
    sp.google === "ok"
      ? { type: "ok" as const, message: "Google Calendar conectado correctamente." }
      : sp.google === "error"
        ? { type: "error" as const, message: `No se pudo conectar Google (${sp.reason || "error"}).` }
        : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Mi perfil</h1>
        <p className="text-muted-foreground mt-1">Gestiona tu información personal</p>
      </div>

      <PerfilPacienteForm
        nombre={paciente.nombre}
        apellidos={paciente.apellidos}
        email={paciente.email || ""}
        telefono={paciente.telefono || ""}
        fotoUrl={paciente.fotoUrl || ""}
      />

      <IntegracionesCardPaciente integracion={integracion} flash={googleFlash} />

      {/* Horario compartido */}
      <section className="bg-card rounded-xl border border-border p-6 mt-6">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          Mi horario semanal
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Configura tu horario y tu nutricionista lo verá reflejado. Los cambios que haga tu nutricionista también aparecerán aquí.
        </p>
        <HorarioPacienteWrapper initialEntries={horarioEntries} />
      </section>

      {/* Guías interactivas */}
      <TourSettings />
    </div>
  );
}
