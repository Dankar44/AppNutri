import { redirect } from "next/navigation";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { PatientNav } from "@/components/paciente/patient-nav";

export default async function PatientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const paciente = await prisma.paciente.findUnique({
    where: { id: session.pacienteId },
    select: { nombre: true, apellidos: true, fotoUrl: true },
  });
  if (!paciente) redirect("/paciente/login");

  return (
    <div className="flex min-h-screen">
      <PatientNav nombre={paciente.nombre} apellidos={paciente.apellidos} fotoUrl={paciente.fotoUrl} />
      <main className="flex-1 overflow-y-auto">
        <div className="pt-16 lg:pt-0 p-4 sm:p-6 lg:px-10 lg:pt-10 lg:pb-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
