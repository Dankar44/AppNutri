"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { TipoComida, UnidadMedida } from "@/generated/prisma/client";
import { sanitizeStringOptional, validateNumberOptional, validateEnum, LIMITS } from "@/lib/validation";

export interface EntradaDiarioData {
  fecha: string;
  tipoComida: TipoComida;
  descripcion?: string;
  alimentoId?: string;
  recetaId?: string;
  cantidad?: number;
  unidad?: UnidadMedida;
  notas?: string;
}

export async function crearEntradaDiario(data: EntradaDiarioData) {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  // Validar y sanitizar inputs
  const tipoComidaValues = Object.values(TipoComida) as TipoComida[];
  const tipoComida = validateEnum(data.tipoComida, tipoComidaValues);
  if (!tipoComida) throw new Error("Tipo de comida no válido");

  const descripcion = sanitizeStringOptional(data.descripcion, 500);
  const notas = sanitizeStringOptional(data.notas, 1000);
  const cantidad = validateNumberOptional(data.cantidad, 0.1, LIMITS.CANTIDAD_MAX);

  await prisma.entradaDiario.create({
    data: {
      pacienteId: session.pacienteId,
      fecha: new Date(data.fecha),
      tipoComida,
      descripcion,
      alimentoId: data.alimentoId || null,
      recetaId: data.recetaId || null,
      cantidad,
      unidad: data.unidad || null,
      notas,
    },
  });

  revalidatePath("/paciente/portal/diario");
}

export async function getEntradasDia(fecha: string) {
  const session = await getCurrentPaciente();
  if (!session) return [];

  const dia = new Date(fecha);
  dia.setHours(0, 0, 0, 0);
  const siguiente = new Date(dia);
  siguiente.setDate(siguiente.getDate() + 1);

  return prisma.entradaDiario.findMany({
    where: {
      pacienteId: session.pacienteId,
      fecha: { gte: dia, lt: siguiente },
    },
    include: { alimento: true, receta: true },
    orderBy: [{ tipoComida: "asc" }, { createdAt: "asc" }],
  });
}

export async function eliminarEntradaDiario(id: string) {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  await prisma.entradaDiario.delete({
    where: { id, pacienteId: session.pacienteId },
  });

  revalidatePath("/paciente/portal/diario");
}

export async function getEntradasDiarioDietista(pacienteId: string, fecha: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const dia = new Date(fecha);
  dia.setHours(0, 0, 0, 0);
  const siguiente = new Date(dia);
  siguiente.setDate(siguiente.getDate() + 1);

  return prisma.entradaDiario.findMany({
    where: {
      pacienteId,
      paciente: { dietistaId: dietista.id },
      fecha: { gte: dia, lt: siguiente },
    },
    include: { alimento: true, receta: true },
    orderBy: [{ tipoComida: "asc" }, { createdAt: "asc" }],
  });
}

export async function buscarAlimentosPaciente(query: string) {
  if (!query || query.length < 2) return [];

  return prisma.alimento.findMany({
    where: {
      nombre: { contains: query, mode: "insensitive" },
    },
    take: 10,
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      calorias: true,
      proteinas: true,
      carbohidratos: true,
      grasas: true,
      porcion: true,
    },
  });
}
