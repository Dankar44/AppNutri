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
    select: { nombre: true },
  });
  if (!paciente) redirect("/paciente/login");

  return (
    <>
      <PatientNav nombre={paciente.nombre} />
      <main className="max-w-4xl mx-auto p-4 md:p-6">{children}</main>
    </>
  );
}
