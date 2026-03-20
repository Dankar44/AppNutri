"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { isAIConfigured } from "@/lib/openai";
import { generateDietPlan } from "@/lib/ai/generate-plan";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MacroObjetivos } from "@/lib/ai/types";
import { DiaSemana, TipoComida } from "@/generated/prisma/client";

export async function checkAIConfigured() {
  return isAIConfigured();
}

export async function generarPlanIA(
  pacienteId: string,
  objetivos: MacroObjetivos,
  instrucciones: string
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (!isAIConfigured()) throw new Error("API key de OpenAI no configurada");

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId: dietista.id },
  });
  if (!paciente) throw new Error("Paciente no encontrado");

  const { plan, promptUsado } = await generateDietPlan(
    paciente,
    objetivos,
    instrucciones
  );

  const generacion = await prisma.generacionIA.create({
    data: {
      dietistaId: dietista.id,
      pacienteId,
      prompt: promptUsado,
      respuesta: JSON.parse(JSON.stringify(plan)),
    },
  });

  return { generacionId: generacion.id, plan };
}

const DIAS_MAP: Record<string, DiaSemana> = {
  LUNES: "LUNES", MARTES: "MARTES", MIERCOLES: "MIERCOLES",
  JUEVES: "JUEVES", VIERNES: "VIERNES", SABADO: "SABADO", DOMINGO: "DOMINGO",
};

const COMIDAS_MAP: Record<string, TipoComida> = {
  DESAYUNO: "DESAYUNO", MEDIA_MANANA: "MEDIA_MANANA", ALMUERZO: "ALMUERZO",
  MERIENDA: "MERIENDA", CENA: "CENA", RECENA: "RECENA",
};

// Busca un alimento por nombre (fuzzy) o lo crea con los macros estimados
async function findOrCreateAlimento(
  dietistaId: string,
  nombre: string,
  estimacion: { calorias: number; proteinas: number; carbohidratos: number; grasas: number }
): Promise<string> {
  // Buscar primero en la BD (global o del dietista)
  const existente = await prisma.alimento.findFirst({
    where: {
      OR: [{ dietistaId }, { dietistaId: null }],
      nombre: { contains: nombre, mode: "insensitive" },
    },
    select: { id: true },
  });

  if (existente) return existente.id;

  // No existe: crear uno nuevo con los macros de la IA
  const nuevo = await prisma.alimento.create({
    data: {
      dietistaId,
      nombre,
      categoria: "OTROS",
      calorias: estimacion.calorias,
      proteinas: estimacion.proteinas,
      carbohidratos: estimacion.carbohidratos,
      grasas: estimacion.grasas,
      porcion: 100,
      unidad: "GRAMOS",
      origen: "PERSONALIZADO",
    },
  });

  return nuevo.id;
}

export async function aceptarPlanIA(
  generacionId: string,
  pacienteId: string,
  nombre: string,
  objetivos: MacroObjetivos
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const generacion = await prisma.generacionIA.findFirst({
    where: { id: generacionId, dietistaId: dietista.id },
  });
  if (!generacion) throw new Error("Generación no encontrada");

  const planIA = generacion.respuesta as unknown as {
    dias: {
      dia: string;
      comidas: {
        tipo: string;
        alimentos: {
          nombre: string;
          cantidadGramos: number;
          estimacion: { calorias: number; proteinas: number; carbohidratos: number; grasas: number };
        }[];
      }[];
    }[];
  };

  // Primero resolver todos los alimentos (buscar o crear)
  const alimentoCache = new Map<string, string>();
  for (const dia of planIA.dias) {
    for (const comida of dia.comidas) {
      for (const a of comida.alimentos) {
        if (!alimentoCache.has(a.nombre)) {
          const id = await findOrCreateAlimento(dietista.id, a.nombre, a.estimacion);
          alimentoCache.set(a.nombre, id);
        }
      }
    }
  }

  // Crear el plan con los alimentoId reales
  const plan = await prisma.planAlimenticio.create({
    data: {
      dietistaId: dietista.id,
      pacienteId,
      nombre,
      caloriasObjetivo: objetivos.calorias,
      proteinasObjetivo: objetivos.proteinas,
      carbohidratosObjetivo: objetivos.carbohidratos,
      grasasObjetivo: objetivos.grasas,
      dias: {
        create: planIA.dias.map((dia) => ({
          dia: DIAS_MAP[dia.dia] || "LUNES",
          comidas: {
            create: dia.comidas.map((comida, orden) => ({
              tipo: COMIDAS_MAP[comida.tipo] || "DESAYUNO",
              orden,
              alimentos: {
                create: comida.alimentos.map((alimento, aOrden) => ({
                  alimentoId: alimentoCache.get(alimento.nombre) || null,
                  cantidad: alimento.cantidadGramos,
                  unidad: "GRAMOS" as const,
                  orden: aOrden,
                })),
              },
            })),
          },
        })),
      },
    },
  });

  await prisma.generacionIA.update({
    where: { id: generacionId },
    data: { estado: "APLICADO" },
  });

  revalidatePath("/dietas");
  redirect(`/dietas/${plan.id}`);
}
