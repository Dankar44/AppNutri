"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DiaSemana, TipoComida, UnidadMedida } from "@/generated/prisma/client";

export interface PlanFormData {
  nombre: string;
  pacienteId: string;
  caloriasObjetivo?: number;
  proteinasObjetivo?: number;
  carbohidratosObjetivo?: number;
  grasasObjetivo?: number;
}

const DIAS: DiaSemana[] = [
  "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO",
];

const COMIDAS: TipoComida[] = [
  "DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA",
];

export async function crearPlan(data: PlanFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const plan = await prisma.planAlimenticio.create({
    data: {
      dietistaId: dietista.id,
      pacienteId: data.pacienteId,
      nombre: data.nombre,
      caloriasObjetivo: data.caloriasObjetivo || null,
      proteinasObjetivo: data.proteinasObjetivo || null,
      carbohidratosObjetivo: data.carbohidratosObjetivo || null,
      grasasObjetivo: data.grasasObjetivo || null,
      dias: {
        create: DIAS.map((dia) => ({
          dia,
          comidas: {
            create: COMIDAS.map((tipo, orden) => ({ tipo, orden })),
          },
        })),
      },
    },
  });

  revalidatePath("/dietas");
  redirect(`/dietas/${plan.id}`);
}

export async function actualizarPlan(id: string, data: Partial<PlanFormData>) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.planAlimenticio.update({
    where: { id, dietistaId: dietista.id },
    data: {
      ...(data.nombre !== undefined ? { nombre: data.nombre } : {}),
      ...(data.caloriasObjetivo !== undefined ? { caloriasObjetivo: data.caloriasObjetivo || null } : {}),
      ...(data.proteinasObjetivo !== undefined ? { proteinasObjetivo: data.proteinasObjetivo || null } : {}),
      ...(data.carbohidratosObjetivo !== undefined ? { carbohidratosObjetivo: data.carbohidratosObjetivo || null } : {}),
      ...(data.grasasObjetivo !== undefined ? { grasasObjetivo: data.grasasObjetivo || null } : {}),
    },
  });

  revalidatePath(`/dietas/${id}`);
  revalidatePath("/dietas");
}

export async function eliminarPlan(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.planAlimenticio.delete({
    where: { id, dietistaId: dietista.id },
  });

  revalidatePath("/dietas");
  redirect("/dietas");
}

export async function getPlanes() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.planAlimenticio.findMany({
    where: { dietistaId: dietista.id },
    include: { paciente: { select: { nombre: true, apellidos: true, fotoUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlan(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  return prisma.planAlimenticio.findUnique({
    where: { id, dietistaId: dietista.id },
    include: {
      paciente: true,
      dias: {
        orderBy: { dia: "asc" },
        include: {
          comidas: {
            orderBy: { orden: "asc" },
            include: {
              alimentos: {
                orderBy: { orden: "asc" },
                include: {
                  alimento: true,
                  receta: { include: { ingredientes: { include: { alimento: { select: { nombre: true } } } } } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function addAlimentoAComida(
  comidaId: string,
  alimentoId: string | null,
  recetaId: string | null,
  cantidad: number,
  unidad: UnidadMedida = "GRAMOS"
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const count = await prisma.alimentoEnComida.count({ where: { comidaId } });

  await prisma.alimentoEnComida.create({
    data: {
      comidaId,
      alimentoId,
      recetaId,
      cantidad,
      unidad,
      orden: count,
    },
  });
}

export async function removeAlimentoDeComida(alimentoEnComidaId: string) {
  await prisma.alimentoEnComida.delete({
    where: { id: alimentoEnComidaId },
  });
}

export async function actualizarCantidadAlimento(
  alimentoEnComidaId: string,
  cantidad: number
) {
  await prisma.alimentoEnComida.update({
    where: { id: alimentoEnComidaId },
    data: { cantidad },
  });
}

export async function actualizarDescripcionComida(
  comidaId: string,
  descripcion: string
) {
  await prisma.comidaDelDia.update({
    where: { id: comidaId },
    data: { descripcion: descripcion.trim().slice(0, 500) || null },
  });
}

export async function moverAlimentoAComida(
  alimentoEnComidaId: string,
  nuevaComidaId: string
) {
  const item = await prisma.alimentoEnComida.findUnique({
    where: { id: alimentoEnComidaId },
  });
  if (!item) return;
  if (item.comidaId === nuevaComidaId) return;

  const count = await prisma.alimentoEnComida.count({
    where: { comidaId: nuevaComidaId },
  });

  await prisma.alimentoEnComida.update({
    where: { id: alimentoEnComidaId },
    data: { comidaId: nuevaComidaId, orden: count },
  });
}

export async function getPacientesParaPlan() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.paciente.findMany({
    where: { dietistaId: dietista.id, activo: true },
    select: { id: true, nombre: true, apellidos: true },
    orderBy: { nombre: "asc" },
  });
}

export async function getPlanesPaciente(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.planAlimenticio.findMany({
    where: { dietistaId: dietista.id, pacienteId },
    orderBy: { createdAt: "desc" },
  });
}

export async function guardarComoPlantilla(planId: string, nombre: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const plan = await getPlan(planId);
  if (!plan) throw new Error("Plan no encontrado");

  const datos = plan.dias.map((dia) => ({
    dia: dia.dia,
    comidas: dia.comidas.map((comida) => ({
      tipo: comida.tipo,
      alimentos: comida.alimentos.map((a) => ({
        alimentoId: a.alimentoId,
        recetaId: a.recetaId,
        cantidad: a.cantidad,
        unidad: a.unidad,
      })),
    })),
  }));

  const plantilla = await prisma.plantilla.create({
    data: {
      dietistaId: dietista.id,
      nombre,
      datos: JSON.parse(JSON.stringify(datos)),
    },
  });

  revalidatePath("/dietas");
  return plantilla;
}
