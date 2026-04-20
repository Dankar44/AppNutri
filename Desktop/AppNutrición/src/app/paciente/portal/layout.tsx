import { redirect } from "next/navigation";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { PatientNav } from "@/components/paciente/patient-nav";
import { TourWrapper } from "@/components/tour/tour-wrapper";
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
          <div className="w-full max-w-none pt-14 lg:pt-0 px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 lg:pb-6 pb-safe">
            <div className="bg-card rounded-2xl border border-border shadow-sm px-5 sm:px-7 lg:px-8 pt-3 sm:pt-4 pb-5 sm:pb-7 lg:pb-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </TourWrapper>
  );
}
