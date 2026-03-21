"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { validateNumberOptional, sanitizeStringOptional } from "@/lib/validation";

export interface MedidaFormData {
  pacienteId: string;
  fecha?: string;
  peso?: number;
  altura?: number;
  grasaCorporal?: number;
  masaMuscular?: number;
  perimetroCintura?: number;
  perimetroCadera?: number;
  perimetroBrazo?: number;
  notas?: string;
}

function calcularIMC(peso?: number, altura?: number): number | null {
  if (!peso || !altura) return null;
  const alturaM = altura / 100;
  return Math.round((peso / (alturaM * alturaM)) * 10) / 10;
}

export async function crearMedida(data: MedidaFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const paciente = await prisma.paciente.findFirst({
    where: { id: data.pacienteId, dietistaId: dietista.id },
  });
  if (!paciente) throw new Error("Paciente no encontrado");

  // Validar y sanitizar inputs
  const peso = validateNumberOptional(data.peso, 0.1, 500);
  const altura = validateNumberOptional(data.altura, 30, 300);
  const grasaCorporal = validateNumberOptional(data.grasaCorporal, 0, 100);
  const masaMuscular = validateNumberOptional(data.masaMuscular, 0, 200);
  const perimetroCintura = validateNumberOptional(data.perimetroCintura, 0, 300);
  const perimetroCadera = validateNumberOptional(data.perimetroCadera, 0, 300);
  const perimetroBrazo = validateNumberOptional(data.perimetroBrazo, 0, 300);
  const notas = sanitizeStringOptional(data.notas, 1000);

  const imc = calcularIMC(peso ?? undefined, altura || paciente.altura || undefined);

  const medida = await prisma.medidaAntropometrica.create({
    data: {
      pacienteId: data.pacienteId,
      fecha: data.fecha ? new Date(data.fecha) : new Date(),
      peso,
      altura,
      imc,
      grasaCorporal,
      masaMuscular,
      perimetroCintura,
      perimetroCadera,
      perimetroBrazo,
      notas,
    },
  });

  if (peso) {
    await prisma.paciente.update({
      where: { id: data.pacienteId },
      data: {
        peso,
        ...(altura ? { altura } : {}),
      },
    });
  }

  revalidatePath(`/pacientes/${data.pacienteId}`);
  revalidatePath(`/pacientes/${data.pacienteId}/medidas`);
  return medida;
}

export async function getMedidas(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.medidaAntropometrica.findMany({
    where: {
      pacienteId,
      paciente: { dietistaId: dietista.id },
    },
    orderBy: { fecha: "desc" },
  });
}

export async function getMedidasEvolucion(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.medidaAntropometrica.findMany({
    where: {
      pacienteId,
      paciente: { dietistaId: dietista.id },
    },
    orderBy: { fecha: "asc" },
    select: {
      id: true,
      fecha: true,
      peso: true,
      imc: true,
      grasaCorporal: true,
      masaMuscular: true,
      perimetroCintura: true,
    },
  });
}

export async function eliminarMedida(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const medida = await prisma.medidaAntropometrica.findFirst({
    where: { id },
    include: { paciente: { select: { dietistaId: true, id: true } } },
  });
  if (!medida || medida.paciente.dietistaId !== dietista.id) {
    throw new Error("No autorizado");
  }

  await prisma.medidaAntropometrica.delete({ where: { id } });
  revalidatePath(`/pacientes/${medida.pacienteId}/medidas`);
}
