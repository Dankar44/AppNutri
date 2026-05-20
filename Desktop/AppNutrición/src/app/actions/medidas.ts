"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
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
  grasaSubcutanea?: number;
  musculoEsqueletico?: number;
  agua?: number;
  masaOsea?: number;
  perimetroAbdomen?: number;
  grasaVisceral?: number;
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
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const paciente = await prisma.paciente.findFirst({
    where: { id: data.pacienteId, dietistaId: dietista.id },
  });
  if (!paciente) throw new Error(t("paciente.pacienteNoEncontrado"));

  // Validar y sanitizar inputs
  const peso = validateNumberOptional(data.peso, 0.1, 500);
  const altura = validateNumberOptional(data.altura, 30, 300);
  const grasaCorporal = validateNumberOptional(data.grasaCorporal, 0, 100);
  const masaMuscular = validateNumberOptional(data.masaMuscular, 0, 200);
  const perimetroCintura = validateNumberOptional(data.perimetroCintura, 0, 300);
  const perimetroCadera = validateNumberOptional(data.perimetroCadera, 0, 300);
  const perimetroBrazo = validateNumberOptional(data.perimetroBrazo, 0, 300);
  const grasaSubcutanea = validateNumberOptional(data.grasaSubcutanea, 0, 100);
  const musculoEsqueletico = validateNumberOptional(data.musculoEsqueletico, 0, 100);
  const agua = validateNumberOptional(data.agua, 0, 100);
  const masaOsea = validateNumberOptional(data.masaOsea, 0, 50);
  const perimetroAbdomen = validateNumberOptional(data.perimetroAbdomen, 0, 300);
  const grasaVisceral = validateNumberOptional(data.grasaVisceral, 0, 60);
  const notas = sanitizeStringOptional(data.notas, 1000);

  const imc = calcularIMC(peso ?? undefined, altura || paciente.altura || undefined);

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
      grasaSubcutanea,
      musculoEsqueletico,
      agua,
      masaOsea,
      perimetroAbdomen,
      grasaVisceral,
      pliegueAbdominal,
      pliegueAxilar,
      plieguePectoral,
      pliegueSubescapular,
      pliegueSuprailiaco,
      pliegueTricipital,
      pliegueMuslo,
      colesterolHDL,
      colesterolLDL,
      colesterolTotal,
      presionDiastolica,
      presionSistolica,
      trigliceridos,
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
  grasaSubcutanea: number | null;
  musculoEsqueletico: number | null;
  agua: number | null;
  masaOsea: number | null;
  perimetroAbdomen: number | null;
  grasaVisceral: number | null;
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

  const rows = await prisma.medidaAntropometrica.findMany({
    where: {
      pacienteId,
      paciente: { dietistaId: dietista.id },
    },
    orderBy: { fecha: "desc" },
  });
  return rows as MedidaRow[];
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
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const medida = await prisma.medidaAntropometrica.findFirst({
    where: { id },
    include: { paciente: { select: { dietistaId: true, id: true } } },
  });
  if (!medida || medida.paciente.dietistaId !== dietista.id) {
    throw new Error(t("auth.noAutorizado"));
  }

  await prisma.medidaAntropometrica.delete({ where: { id } });
  revalidatePath(`/pacientes/${medida.pacienteId}/medidas`);
}

// Registro rápido desde la ficha del paciente
export async function crearMedidaRapida(
  pacienteId: string,
  data: { peso?: number; altura?: number; grasaCorporal?: number }
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId: dietista.id },
  });
  if (!paciente) throw new Error(t("paciente.pacienteNoEncontrado"));

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
