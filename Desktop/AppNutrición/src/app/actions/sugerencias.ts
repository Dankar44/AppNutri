"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { sugerirComplementos, type AlimentoSugerido } from "@/lib/ai/suggest-complement";
import { calcularMacrosPorcion, sumarMacros, type Macros } from "@/lib/macros";

export async function getSugerencias(
  comidaId: string,
  macrosObjetivo: { calorias: number; proteinas: number; carbohidratos: number; grasas: number }
): Promise<AlimentoSugerido[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  // Obtener la comida y su día para calcular macros actuales del día
  const comida = await prisma.comidaDelDia.findUnique({
    where: { id: comidaId },
    include: {
      diaDelPlan: {
        include: {
          comidas: {
            include: {
              alimentos: {
                include: { alimento: true, receta: true },
              },
            },
          },
        },
      },
    },
  });

  if (!comida) return [];

  // Calcular macros actuales del día completo
  const todosAlimentos = comida.diaDelPlan.comidas.flatMap((c) =>
    c.alimentos.map((a) => {
      const item = a.alimento || a.receta;
      if (!item) return { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 };
      return calcularMacrosPorcion(
        { calorias: item.calorias, proteinas: item.proteinas, carbohidratos: item.carbohidratos, grasas: item.grasas, fibra: 0 },
        a.cantidad
      );
    })
  );
  const macrosActuales = sumarMacros(todosAlimentos);

  // Obtener alimentos disponibles del dietista
  const alimentosDB = await prisma.alimento.findMany({
    where: { OR: [{ dietistaId: dietista.id }, { dietistaId: null }] },
    select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true, porcion: true },
    take: 200,
  });

  return sugerirComplementos(
    macrosActuales,
    { ...macrosObjetivo, fibra: 0 },
    alimentosDB
  );
}
