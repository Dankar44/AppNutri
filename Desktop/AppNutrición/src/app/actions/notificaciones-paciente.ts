"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentPaciente } from "@/lib/patient-auth";

export async function getNotificacionesPaciente(soloNoLeidas = false) {
  const session = await getCurrentPaciente();
  if (!session) return [];

  return prisma.notificacion.findMany({
    where: {
      pacienteId: session.pacienteId,
      ...(soloNoLeidas ? { leida: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getNotificacionesPacienteCount(): Promise<number> {
  const session = await getCurrentPaciente();
  if (!session) return 0;

  return prisma.notificacion.count({
    where: { pacienteId: session.pacienteId, leida: false },
  });
}

/** Cuenta las contrapropuestas activas del paciente — el badge más importante de "Mis citas". */
export async function getContrapropuestasPendientesCount(): Promise<number> {
  const session = await getCurrentPaciente();
  if (!session) return 0;

  return prisma.cita.count({
    where: {
      pacienteId: session.pacienteId,
      estado: "CONTRAPROPUESTA",
    },
  });
}

export async function marcarLeidaPaciente(id: string) {
  const session = await getCurrentPaciente();
  if (!session) return;

  await prisma.notificacion.update({
    where: { id, pacienteId: session.pacienteId },
    data: { leida: true },
  });
}

export async function marcarTodasLeidasPaciente() {
  const session = await getCurrentPaciente();
  if (!session) return;

  await prisma.notificacion.updateMany({
    where: { pacienteId: session.pacienteId, leida: false },
    data: { leida: true },
  });
}
