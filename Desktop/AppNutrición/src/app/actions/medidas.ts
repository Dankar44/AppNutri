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
  pliegueAbdominal?: number;
  pliegueAxilar?: number;
  plieguePectoral?: number;
  pliegueSubescapular?: number;
  pliegueSuprailiaco?: number;
  pliegueTricipital?: number;
  pliegueMuslo?: number;
  colesterolHDL?: number;
  colesterolLDL?: number;
  colesterolTotal?: number;
  presionDiastolica?: number;
  presionSistolica?: number;
  trigliceridos?: number;
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

  // Campos extra no conocidos por Prisma local (pliegues + analíticos)
  const pliegueAbdominal = validateNumberOptional(data.pliegueAbdominal, 0, 100);
  const pliegueAxilar = validateNumberOptional(data.pliegueAxilar, 0, 100);
  const plieguePectoral = validateNumberOptional(data.plieguePectoral, 0, 100);
  const pliegueSubescapular = validateNumberOptional(data.pliegueSubescapular, 0, 100);
  const pliegueSuprailiaco = validateNumberOptional(data.pliegueSuprailiaco, 0, 100);
  const pliegueTricipital = validateNumberOptional(data.pliegueTricipital, 0, 100);
  const pliegueMuslo = validateNumberOptional(data.pliegueMuslo, 0, 100);
  const colesterolHDL = validateNumberOptional(data.colesterolHDL, 0, 500);
  const colesterolLDL = validateNumberOptional(data.colesterolLDL, 0, 500);
  const colesterolTotal = validateNumberOptional(data.colesterolTotal, 0, 500);
  const presionDiastolica = validateNumberOptional(data.presionDiastolica, 0, 300);
  const presionSistolica = validateNumberOptional(data.presionSistolica, 0, 300);
  const trigliceridos = validateNumberOptional(data.trigliceridos, 0, 1000);

  await prisma.$queryRawUnsafe(
    `UPDATE medidas_antropometricas SET
      "pliegueAbdominal" = $1, "pliegueAxilar" = $2, "plieguePectoral" = $3,
      "pliegueSubescapular" = $4, "pliegueSuprailiaco" = $5, "pliegueTricipital" = $6,
      "pliegueMuslo" = $7, "colesterolHDL" = $8, "colesterolLDL" = $9,
      "colesterolTotal" = $10, "presionDiastolica" = $11, "presionSistolica" = $12,
      trigliceridos = $13
    WHERE id = $14`,
    pliegueAbdominal, pliegueAxilar, plieguePectoral,
    pliegueSubescapular, pliegueSuprailiaco, pliegueTricipital,
    pliegueMuslo, colesterolHDL, colesterolLDL,
    colesterolTotal, presionDiastolica, presionSistolica,
    trigliceridos, medida.id
  );

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

export interface MedidaRow {
  id: string;
  pacienteId: string;
  fecha: Date;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  grasaCorporal: number | null;
  masaMuscular: number | null;
  perimetroCintura: number | null;
  perimetroCadera: number | null;
  perimetroBrazo: number | null;
  pliegueAbdominal: number | null;
  pliegueAxilar: number | null;
  plieguePectoral: number | null;
  pliegueSubescapular: number | null;
  pliegueSuprailiaco: number | null;
  pliegueTricipital: number | null;
  pliegueMuslo: number | null;
  colesterolHDL: number | null;
  colesterolLDL: number | null;
  colesterolTotal: number | null;
  presionDiastolica: number | null;
  presionSistolica: number | null;
  trigliceridos: number | null;
  notas: string | null;
  createdAt: Date;
}

export async function getMedidas(pacienteId: string): Promise<MedidaRow[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.$queryRawUnsafe<MedidaRow[]>(
    `SELECT m.* FROM medidas_antropometricas m
     JOIN pacientes p ON m."pacienteId" = p.id
     WHERE m."pacienteId" = $1 AND p."dietistaId" = $2
     ORDER BY m.fecha DESC`,
    pacienteId, dietista.id
  );
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

// Registro rápido desde la ficha del paciente
export async function crearMedidaRapida(
  pacienteId: string,
  data: { peso?: number; altura?: number; grasaCorporal?: number }
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId: dietista.id },
  });
  if (!paciente) throw new Error("Paciente no encontrado");

  const peso = data.peso || paciente.peso || null;
  const altura = data.altura || paciente.altura || null;
  const imc = peso && altura ? Math.round((peso / ((altura / 100) ** 2)) * 10) / 10 : null;

  await prisma.medidaAntropometrica.create({
    data: {
      pacienteId,
      peso: data.peso || null,
      altura: data.altura || null,
      imc,
      grasaCorporal: data.grasaCorporal || null,
    },
  });

  // Actualizar peso/altura del paciente si se proporcionaron
  const updateData: Record<string, number> = {};
  if (data.peso) updateData.peso = data.peso;
  if (data.altura) updateData.altura = data.altura;
  if (Object.keys(updateData).length > 0) {
    await prisma.paciente.update({
      where: { id: pacienteId },
      data: updateData,
    });
  }

  revalidatePath(`/pacientes/${pacienteId}`);
  revalidatePath(`/pacientes/${pacienteId}/medidas`);
}
