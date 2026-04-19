import { MessageSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { getConversacionPaciente, getMensajesPaciente } from "@/app/actions/mensajes";
import { redirect } from "next/navigation";
import { PacienteMensajesClient } from "./paciente-mensajes-client";

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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start gap-3 mb-5 sm:mb-6">
        <MessageSquare
          strokeWidth={1.75}
          className="w-7 h-7 sm:w-9 sm:h-9 text-foreground shrink-0 mt-1 sm:mt-1.5"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold leading-tight">Mensajes</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Habla con tu nutricionista
          </p>
        </div>
      </div>

      <PacienteMensajesClient
        dietista={paciente.dietista}
        mensajesIniciales={mensajes}
        conversacionId={conversacion?.id ?? null}
        pacienteId={paciente.id}
      />
    </div>
  );
}
