import { MessageSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { getConversacionPaciente, getMensajesPaciente } from "@/app/actions/mensajes";
import { redirect } from "next/navigation";
import { PacienteMensajesClient } from "./paciente-mensajes-client";
import { PageHeader } from "@/components/page-header";

export default async function MensajesPacientePage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const paciente = await prisma.paciente.findUnique({
    where: { id: session.pacienteId },
    include: {
      dietista: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          especialidad: true,
        },
      },
    },
  });
  if (!paciente) redirect("/paciente/login");

  // Asegurar que la conversación existe
  const conversacion = await getConversacionPaciente();

  const mensajes = await getMensajesPaciente();

  return (
    <div>
      <PageHeader
        icon={MessageSquare}
        title="Mensajes"
        subtitle="Habla con tu nutricionista"
      />
      <PacienteMensajesClient
        dietista={paciente.dietista}
        mensajesIniciales={mensajes}
        conversacionId={conversacion?.id ?? null}
        pacienteId={paciente.id}
      />
    </div>
  );
}
