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
      <div className="flex min-h-screen">
        <PatientNav
          nombre={paciente.nombre}
          apellidos={paciente.apellidos}
          fotoUrl={paciente.fotoUrl}
          badges={badges}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="pt-16 lg:pt-0 p-4 sm:p-6 lg:px-10 lg:pt-10 lg:pb-8 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </TourWrapper>
  );
}
