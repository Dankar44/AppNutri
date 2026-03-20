"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";

export interface PerfilFormData {
  nombre: string;
  apellidos: string;
  telefono?: string;
  especialidad?: string;
  numColegiado?: string;
  clinica?: string;
}

export async function actualizarPerfil(data: PerfilFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: {
      nombre: data.nombre,
      apellidos: data.apellidos,
      telefono: data.telefono || null,
      especialidad: data.especialidad || null,
      numColegiado: data.numColegiado || null,
      clinica: data.clinica || null,
    },
  });

  revalidatePath("/ajustes");
  revalidatePath("/dashboard");
}

export async function actualizarFotoDietista(fotoUrl: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { logoUrl: fotoUrl },
  });

  revalidatePath("/ajustes");
  revalidatePath("/dashboard");
}
