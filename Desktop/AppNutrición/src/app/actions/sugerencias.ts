"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { sugerirComplementos, type AlimentoSugerido } from "@/lib/ai/suggest-complement";
import { calcularMacrosPorcion, sumarMacros, convertirAGramos, type Macros } from "@/lib/macros";
import { getCompanyMemberIds } from "@/lib/empresa-utils";

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
      if (a.receta) {
        return {
          calorias: Math.round(a.receta.calorias * a.cantidad * 10) / 10,
          proteinas: Math.round(a.receta.proteinas * a.cantidad * 10) / 10,
          carbohidratos: Math.round(a.receta.carbohidratos * a.cantidad * 10) / 10,
          grasas: Math.round(a.receta.grasas * a.cantidad * 10) / 10,
          fibra: 0,
        };
      }
      if (a.alimento) {
        return calcularMacrosPorcion(
          { calorias: a.alimento.calorias, proteinas: a.alimento.proteinas, carbohidratos: a.alimento.carbohidratos, grasas: a.alimento.grasas, fibra: 0 },
          convertirAGramos(a.cantidad, a.unidad, a.alimento.porcion)
        );
      }
      return { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 };
    })
  );
  const macrosActuales = sumarMacros(todosAlimentos);

  const empresaRow = await prisma.dietista.findUnique({ where: { id: dietista.id }, select: { empresaId: true } });
  const memberIds = await getCompanyMemberIds(dietista.id, empresaRow?.empresaId ?? null);

  const alimentosDB = await prisma.alimento.findMany({
    where: { OR: [{ dietistaId: { in: memberIds } }, { dietistaId: null }] },
    select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true, porcion: true, unidad: true },
    take: 200,
  });

  return sugerirComplementos(
    macrosActuales,
    { ...macrosObjetivo, fibra: 0 },
    alimentosDB
  );
}
