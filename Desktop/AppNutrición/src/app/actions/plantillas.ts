"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import type { DiaSemana, TipoComida, UnidadMedida } from "@/generated/prisma/client";

interface PlantillaDia {
  dia: DiaSemana;
  comidas: {
    tipo: TipoComida;
    alimentos: {
      alimentoId: string | null;
      recetaId: string | null;
      cantidad: number;
      unidad: UnidadMedida;
    }[];
  }[];
}

export async function getPlantillas() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.plantilla.findMany({
    where: { dietistaId: dietista.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function eliminarPlantilla(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.plantilla.delete({
    where: { id, dietistaId: dietista.id },
  });

  revalidatePath("/dietas");
}

export async function crearPlanDesdePlantilla(
  plantillaId: string,
  pacienteId: string,
  nombre: string
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const plantilla = await prisma.plantilla.findUnique({
    where: { id: plantillaId, dietistaId: dietista.id },
  });
  if (!plantilla) throw new Error("Plantilla no encontrada");

  const datos = plantilla.datos as unknown as PlantillaDia[];

  const plan = await prisma.planAlimenticio.create({
    data: {
      dietistaId: dietista.id,
      pacienteId,
      nombre,
      dias: {
        create: datos.map((dia) => ({
          dia: dia.dia,
          comidas: {
            create: dia.comidas.map((comida, orden) => ({
              tipo: comida.tipo,
              orden,
              alimentos: {
                create: comida.alimentos.map((a, aOrden) => ({
                  alimentoId: a.alimentoId,
                  recetaId: a.recetaId,
                  cantidad: a.cantidad,
                  unidad: a.unidad,
                  orden: aOrden,
                })),
              },
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/dietas");
  return plan;
}
