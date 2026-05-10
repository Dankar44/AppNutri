import { redirect } from "next/navigation";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { PatientNav } from "@/components/paciente/patient-nav";
import { TourWrapper } from "@/components/tour/tour-wrapper";
import { HelpWidget } from "@/components/help/help-widget";
import { getContrapropuestasPendientesCount } from "@/app/actions/notificaciones-paciente";
import { getContadorNoLeidosPaciente } from "@/app/actions/mensajes";

export default async function PatientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const [paciente, contrapropuestas, mensajesNoLeidos] = await Promise.all([
    prisma.paciente.findUnique({
      where: { id: session.pacienteId },
      select: { nombre: true, apellidos: true, fotoUrl: true },
    }),
    getContrapropuestasPendientesCount(),
    getContadorNoLeidosPaciente(),
  ]);
  if (!paciente) redirect("/paciente/login");

  prisma.paciente.update({
    where: { id: session.pacienteId },
    data: { lastAccessAt: new Date() },
  }).catch(() => {});

  const badges: Record<string, number> = {};
  if (contrapropuestas > 0) badges["/paciente/portal/citas"] = contrapropuestas;
  if (mensajesNoLeidos > 0) badges["/paciente/portal/mensajes"] = mensajesNoLeidos;

  return (
    <TourWrapper audience="paciente">
      <div className="flex min-h-dvh bg-background">
        <PatientNav
          nombre={paciente.nombre}
          apellidos={paciente.apellidos}
          fotoUrl={paciente.fotoUrl}
          badges={badges}
        />
        <main className="flex-1 overflow-y-auto min-w-0 bg-background">
          <div className="w-full max-w-none pt-14 lg:pt-6 lg:px-5 pb-safe lg:pb-6">
            <div className="bg-transparent border-0 rounded-none shadow-none px-4 py-3 sm:px-5 sm:py-4 lg:bg-card lg:rounded-xl lg:border lg:border-border lg:shadow-sm lg:px-8 lg:py-8">
              {children}
            </div>
          </div>
        </main>
        <HelpWidget />
      </div>
    </TourWrapper>
  );
}
