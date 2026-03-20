"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { EstadoCita } from "@/generated/prisma/client";

export interface CitaFormData {
  pacienteId: string;
  fechaHora: string;
  duracion?: number;
  motivo?: string;
  notas?: string;
}

export async function crearCita(data: CitaFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.cita.create({
    data: {
      pacienteId: data.pacienteId,
      dietistaId: dietista.id,
      fechaHora: new Date(data.fechaHora),
      duracion: data.duracion || 30,
      motivo: data.motivo || null,
      notas: data.notas || null,
    },
  });

  revalidatePath("/agenda");
}

export async function actualizarEstadoCita(id: string, estado: EstadoCita) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.cita.update({
    where: { id, dietistaId: dietista.id },
    data: { estado },
  });

  revalidatePath("/agenda");
}

export async function eliminarCita(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.cita.delete({
    where: { id, dietistaId: dietista.id },
  });

  revalidatePath("/agenda");
}

export async function getCitasSemana(fechaInicio: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const inicio = new Date(fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 7);

  return prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      fechaHora: { gte: inicio, lt: fin },
    },
    include: { paciente: { select: { nombre: true, apellidos: true } } },
    orderBy: { fechaHora: "asc" },
  });
}

export async function getCitasHoy() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  return prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      fechaHora: { gte: hoy, lt: manana },
    },
    include: { paciente: { select: { nombre: true, apellidos: true } } },
    orderBy: { fechaHora: "asc" },
  });
}

export async function getPacientesParaCita() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.paciente.findMany({
    where: { dietistaId: dietista.id, activo: true },
    select: { id: true, nombre: true, apellidos: true },
    orderBy: { nombre: "asc" },
  });
}
