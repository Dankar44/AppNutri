"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sanitizeStringOptional, LIMITS } from "@/lib/validation";

export interface ConsultaFormData {
  pacienteId: string;
  fecha?: string;
  motivo?: string;
  notas?: string;
  medidaId?: string;
}

export async function crearConsulta(data: ConsultaFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const consulta = await prisma.consulta.create({
    data: {
      pacienteId: data.pacienteId,
      dietistaId: dietista.id,
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
      motivo: sanitizeStringOptional(data.motivo, LIMITS.MOTIVO),
      notas: sanitizeStringOptional(data.notas, LIMITS.NOTAS),
      medidaId: data.medidaId || null,
    },
  });

  revalidatePath(`/pacientes/${data.pacienteId}`);
  revalidatePath(`/pacientes/${data.pacienteId}/consultas`);
  redirect(`/pacientes/${data.pacienteId}/consultas`);
}

export async function actualizarConsulta(id: string, data: Partial<ConsultaFormData>) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const consulta = await prisma.consulta.findFirst({
    where: { id, dietistaId: dietista.id },
  });
  if (!consulta) throw new Error("Consulta no encontrada");

  await prisma.consulta.update({
    where: { id },
    data: {
      ...(data.motivo !== undefined ? { motivo: sanitizeStringOptional(data.motivo, LIMITS.MOTIVO) } : {}),
      ...(data.notas !== undefined ? { notas: sanitizeStringOptional(data.notas, LIMITS.NOTAS) } : {}),
      ...(data.fecha ? { fecha: new Date(data.fecha) } : {}),
    },
  });

  revalidatePath(`/pacientes/${consulta.pacienteId}/consultas`);
}

export async function eliminarConsulta(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const consulta = await prisma.consulta.findFirst({
    where: { id, dietistaId: dietista.id },
  });
  if (!consulta) throw new Error("Consulta no encontrada");

  await prisma.consulta.delete({ where: { id } });
  revalidatePath(`/pacientes/${consulta.pacienteId}/consultas`);
}

export async function getConsultas(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.consulta.findMany({
    where: { pacienteId, dietistaId: dietista.id },
    include: { medida: true },
    orderBy: { fecha: "desc" },
  });
}
