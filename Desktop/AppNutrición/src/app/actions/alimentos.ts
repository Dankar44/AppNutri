"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CategoriaAlimento,
  UnidadMedida,
  OrigenAlimento,
} from "@/generated/prisma/client";
import { buscarAlimentosOFF, type AlimentoAPIResult } from "@/lib/openfoodfacts";

export interface AlimentoFormData {
  nombre: string;
  categoria: CategoriaAlimento;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  porcion: number;
  unidad: UnidadMedida;
}

export async function crearAlimento(data: AlimentoFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const alimento = await prisma.alimento.create({
    data: {
      dietistaId: dietista.id,
      nombre: data.nombre,
      categoria: data.categoria,
      calorias: data.calorias,
      proteinas: data.proteinas,
      carbohidratos: data.carbohidratos,
      grasas: data.grasas,
      fibra: data.fibra,
      porcion: data.porcion,
      unidad: data.unidad,
      origen: "PERSONALIZADO",
    },
  });

  revalidatePath("/alimentos");
  redirect(`/alimentos/${alimento.id}`);
}

export async function actualizarAlimento(id: string, data: AlimentoFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.alimento.update({
    where: { id, dietistaId: dietista.id },
    data: {
      nombre: data.nombre,
      categoria: data.categoria,
      calorias: data.calorias,
      proteinas: data.proteinas,
      carbohidratos: data.carbohidratos,
      grasas: data.grasas,
      fibra: data.fibra,
      porcion: data.porcion,
      unidad: data.unidad,
    },
  });

  revalidatePath("/alimentos");
  revalidatePath(`/alimentos/${id}`);
  redirect(`/alimentos/${id}`);
}

export async function eliminarAlimento(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.alimento.delete({
    where: { id, dietistaId: dietista.id },
  });

  revalidatePath("/alimentos");
  redirect("/alimentos");
}

export async function getAlimentos(
  busqueda?: string,
  categoria?: CategoriaAlimento
) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.alimento.findMany({
    where: {
      OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
      ...(categoria ? { categoria } : {}),
      ...(busqueda
        ? { nombre: { contains: busqueda, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { nombre: "asc" },
  });
}

export async function getAlimento(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  return prisma.alimento.findFirst({
    where: {
      id,
      OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
    },
  });
}

export async function buscarAlimentosAPI(query: string) {
  if (!query || query.length < 2) return [];
  const { resultados } = await buscarAlimentosOFF(query, 1, 15);
  return resultados;
}

export async function importarAlimentoAPI(data: AlimentoAPIResult) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const existente = await prisma.alimento.findFirst({
    where: { codigoBarras: data.codigoBarras, dietistaId: dietista.id },
  });
  if (existente) return existente;

  const alimento = await prisma.alimento.create({
    data: {
      dietistaId: dietista.id,
      nombre: data.nombre,
      categoria: "OTROS",
      calorias: data.calorias,
      proteinas: data.proteinas,
      carbohidratos: data.carbohidratos,
      grasas: data.grasas,
      fibra: data.fibra,
      porcion: 100,
      unidad: "GRAMOS",
      origen: "API",
      codigoBarras: data.codigoBarras,
    },
  });

  revalidatePath("/alimentos");
  return alimento;
}
