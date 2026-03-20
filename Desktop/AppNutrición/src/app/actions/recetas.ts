"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UnidadMedida } from "@/generated/prisma/client";

export interface RecetaFormData {
  nombre: string;
  descripcion?: string;
  instrucciones?: string;
  porciones: number;
}

export interface IngredienteData {
  alimentoId: string;
  cantidad: number;
  unidad: UnidadMedida;
}

async function recalcularMacrosReceta(recetaId: string) {
  const ingredientes = await prisma.recetaIngrediente.findMany({
    where: { recetaId },
    include: { alimento: true },
  });

  const receta = await prisma.receta.findUnique({ where: { id: recetaId } });
  if (!receta) return;

  let calorias = 0, proteinas = 0, carbohidratos = 0, grasas = 0, fibra = 0;

  for (const ing of ingredientes) {
    const factor = ing.cantidad / 100;
    calorias += ing.alimento.calorias * factor;
    proteinas += ing.alimento.proteinas * factor;
    carbohidratos += ing.alimento.carbohidratos * factor;
    grasas += ing.alimento.grasas * factor;
    fibra += ing.alimento.fibra * factor;
  }

  const porciones = receta.porciones || 1;
  await prisma.receta.update({
    where: { id: recetaId },
    data: {
      calorias: Math.round((calorias / porciones) * 10) / 10,
      proteinas: Math.round((proteinas / porciones) * 10) / 10,
      carbohidratos: Math.round((carbohidratos / porciones) * 10) / 10,
      grasas: Math.round((grasas / porciones) * 10) / 10,
      fibra: Math.round((fibra / porciones) * 10) / 10,
    },
  });
}

export async function crearReceta(
  data: RecetaFormData,
  ingredientes: IngredienteData[]
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const receta = await prisma.receta.create({
    data: {
      dietistaId: dietista.id,
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      instrucciones: data.instrucciones || null,
      porciones: data.porciones || 1,
      ingredientes: {
        create: ingredientes.map((ing) => ({
          alimentoId: ing.alimentoId,
          cantidad: ing.cantidad,
          unidad: ing.unidad,
        })),
      },
    },
  });

  await recalcularMacrosReceta(receta.id);
  revalidatePath("/recetas");
  redirect(`/recetas/${receta.id}`);
}

export async function actualizarReceta(
  id: string,
  data: RecetaFormData,
  ingredientes: IngredienteData[]
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.recetaIngrediente.deleteMany({ where: { recetaId: id } });

  await prisma.receta.update({
    where: { id, dietistaId: dietista.id },
    data: {
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      instrucciones: data.instrucciones || null,
      porciones: data.porciones || 1,
      ingredientes: {
        create: ingredientes.map((ing) => ({
          alimentoId: ing.alimentoId,
          cantidad: ing.cantidad,
          unidad: ing.unidad,
        })),
      },
    },
  });

  await recalcularMacrosReceta(id);
  revalidatePath("/recetas");
  revalidatePath(`/recetas/${id}`);
  redirect(`/recetas/${id}`);
}

export async function eliminarReceta(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.receta.delete({
    where: { id, dietistaId: dietista.id },
  });

  revalidatePath("/recetas");
  redirect("/recetas");
}

export async function getRecetas(busqueda?: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.receta.findMany({
    where: {
      dietistaId: dietista.id,
      ...(busqueda
        ? { nombre: { contains: busqueda, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getReceta(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  return prisma.receta.findUnique({
    where: { id, dietistaId: dietista.id },
    include: {
      ingredientes: {
        include: { alimento: true },
      },
    },
  });
}

export async function buscarAlimentosYRecetas(query: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return { alimentos: [], recetas: [] };

  const [alimentos, recetas] = await Promise.all([
    prisma.alimento.findMany({
      where: {
        OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
        nombre: { contains: query, mode: "insensitive" },
      },
      take: 10,
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true, porcion: true },
    }),
    prisma.receta.findMany({
      where: {
        dietistaId: dietista.id,
        nombre: { contains: query, mode: "insensitive" },
      },
      take: 5,
      orderBy: { nombre: "asc" },
      select: {
        id: true, nombre: true, porciones: true,
        calorias: true, proteinas: true, carbohidratos: true, grasas: true,
        ingredientes: { select: { alimento: { select: { nombre: true } }, cantidad: true } },
      },
    }),
  ]);

  return { alimentos, recetas };
}

export async function buscarAlimentosParaReceta(query: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.alimento.findMany({
    where: {
      OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
      nombre: { contains: query, mode: "insensitive" },
    },
    take: 15,
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
