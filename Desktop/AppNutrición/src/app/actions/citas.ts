"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { EstadoCita } from "@/generated/prisma/client";
import {
  sanitizeStringOptional,
  validateNumber,
  validateDate,
  LIMITS,
} from "@/lib/validation";

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

  const fechaHora = validateDate(data.fechaHora);
  if (!fechaHora) throw new Error("Fecha y hora inválidas");
  const duracion = validateNumber(data.duracion || 30, LIMITS.DURACION_MIN, LIMITS.DURACION_MAX);
  const motivo = sanitizeStringOptional(data.motivo, LIMITS.MOTIVO);
  const notas = sanitizeStringOptional(data.notas, LIMITS.NOTAS);

  await prisma.cita.create({
    data: {
      pacienteId: data.pacienteId,
      dietistaId: dietista.id,
      fechaHora,
      duracion,
      motivo,
      notas,
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
    include: { paciente: { select: { id: true, nombre: true, apellidos: true } } },
    orderBy: { fechaHora: "asc" },
  });
}

export async function getCitasMes(anio: number, mes: number) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const inicio = new Date(anio, mes, 1);
  const fin = new Date(anio, mes + 1, 1);

  return prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      fechaHora: { gte: inicio, lt: fin },
    },
    include: { paciente: { select: { id: true, nombre: true, apellidos: true } } },
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

/** Citas de un día concreto (fecha local YYYY-MM-DD). */
export async function getCitasDia(fechaYYYYMMDD: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const [y, m, d] = fechaYYYYMMDD.split("-").map(Number);
  if (!y || !m || !d) return [];

  const inicio = new Date(y, m - 1, d, 0, 0, 0, 0);
  const fin = new Date(y, m - 1, d + 1, 0, 0, 0, 0);

  return prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      fechaHora: { gte: inicio, lt: fin },
    },
    include: {
      paciente: {
        select: { id: true, nombre: true, apellidos: true, fotoUrl: true },
      },
    },
    orderBy: { fechaHora: "asc" },
  });
}

/** Citas pendientes o confirmadas desde ahora en adelante (para dashboard). */
export async function getProximasCitas(take = 8) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const ahora = new Date();

  return prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      fechaHora: { gte: ahora },
      estado: { in: [EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA] },
    },
    include: {
      paciente: {
        select: { id: true, nombre: true, apellidos: true, fotoUrl: true },
      },
    },
    orderBy: { fechaHora: "asc" },
    take,
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
