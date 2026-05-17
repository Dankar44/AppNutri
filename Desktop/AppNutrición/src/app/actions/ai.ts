"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { isAIConfigured } from "@/lib/openai";
import { generateDietPlan } from "@/lib/ai/generate-plan";
import { revalidatePath } from "next/cache";
import type { MacroObjetivos } from "@/lib/ai/types";
import { DiaSemana, TipoComida } from "@/generated/prisma/client";
import { findAlimentoEnLista } from "@/lib/alimento-utils";
import { sanitizeString, validateNumber, LIMITS } from "@/lib/validation";
import { getTranslations } from "next-intl/server";
import { getAlimentosGlobales } from "@/lib/alimentos-cache";

export async function checkAIConfigured() {
  return isAIConfigured();
}

export async function generarPlanIA(
  pacienteId: string,
  objetivos: MacroObjetivos,
  instrucciones: string
): Promise<{ generacionId: string; plan: unknown } | { error: string }> {
  try {
    const t = await getTranslations("validation");
    // Validar y sanitizar inputs
    instrucciones = sanitizeString(instrucciones, LIMITS.INSTRUCCIONES_IA);
    objetivos = {
      calorias: validateNumber(objetivos.calorias, 500, 10000),
      proteinas: validateNumber(objetivos.proteinas, 0, LIMITS.MACROS_MAX),
      carbohidratos: validateNumber(objetivos.carbohidratos, 0, LIMITS.MACROS_MAX),
      grasas: validateNumber(objetivos.grasas, 0, LIMITS.MACROS_MAX),
    };

    const dietista = await getCurrentDietista();
    if (!dietista) return { error: t("auth.noAutorizado") };
    if (dietista.isDemo) return { error: t("general.noDisponibleDemo") };
    if (!isAIConfigured()) return { error: t("generacionIA.apiKeysNoConfiguradas") };

    const paciente = await prisma.paciente.findFirst({
      where: { id: pacienteId, dietistaId: dietista.id },
    });
    if (!paciente) return { error: t("paciente.pacienteNoEncontrado") };

    const [alimentosGlobales, alimentosDietista, recetas] = await Promise.all([
      getAlimentosGlobales(),
      prisma.alimento.findMany({
        where: { dietistaId: dietista.id, origen: "PERSONALIZADO" },
        select: { nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true },
        orderBy: { nombre: "asc" },
        take: 50,
      }),
      prisma.receta.findMany({
        where: { dietistaId: dietista.id },
        select: { nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true, porciones: true },
      }),
    ]);
    const alimentos = [...alimentosGlobales, ...alimentosDietista];

    const { plan, promptUsado } = await generateDietPlan(
      paciente,
      objetivos,
      instrucciones,
      alimentos,
      recetas
    );

    const todosAlimentos = [
      ...alimentosGlobales,
      ...await prisma.alimento.findMany({
        where: { dietistaId: dietista.id },
        select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true },
      }),
    ];
    const matchCache = new Map<string, typeof todosAlimentos[0] | null>();

    function findEnMemoria(nombre: string) {
      if (matchCache.has(nombre)) return matchCache.get(nombre)!;
      const result = findAlimentoEnLista(todosAlimentos, nombre);
      matchCache.set(nombre, result);
      return result;
    }

    function recalcularMacros() {
      for (const dia of plan.dias) {
        for (const comida of dia.comidas) {
          for (const a of comida.alimentos) {
            const real = findEnMemoria(a.nombre);
            if (real) {
              a.cantidadGramos = Math.round(a.cantidadGramos / 5) * 5 || 5;
              const f = a.cantidadGramos / 100;
              a.nombre = real.nombre;
              a.estimacion = {
                calorias: Math.round(real.calorias * f),
                proteinas: Math.round(real.proteinas * f * 10) / 10,
                carbohidratos: Math.round(real.carbohidratos * f * 10) / 10,
                grasas: Math.round(real.grasas * f * 10) / 10,
              };
            }
          }
        }
      }
    }

    recalcularMacros();

    for (const dia of plan.dias) {
      const totalDia = dia.comidas.reduce((sum, c) =>
        sum + c.alimentos.reduce((s, a) => s + (a.estimacion?.calorias || 0), 0), 0);
      if (totalDia > 0 && Math.abs(totalDia - objetivos.calorias) > objetivos.calorias * 0.1) {
        const ratio = objetivos.calorias / totalDia;
        for (const comida of dia.comidas) {
          for (const a of comida.alimentos) {
            a.cantidadGramos = Math.round((a.cantidadGramos * ratio) / 5) * 5 || 5;
          }
        }
      }
    }

    recalcularMacros();

    const generacion = await prisma.generacionIA.create({
      data: {
        dietista: { connect: { id: dietista.id } },
        paciente: { connect: { id: pacienteId } },
        prompt: promptUsado,
        respuesta: JSON.parse(JSON.stringify(plan)),
      },
    });

    return { generacionId: generacion.id, plan };
  } catch (err) {
    const t = await getTranslations("validation");
    const msg = err instanceof Error ? err.message : t("general.errorDesconocido");
    return { error: t("generacionIA.errorAlGenerar", { msg }) };
  }
}

const DIAS_MAP: Record<string, DiaSemana> = {
  LUNES: "LUNES", MARTES: "MARTES", MIERCOLES: "MIERCOLES",
  JUEVES: "JUEVES", VIERNES: "VIERNES", SABADO: "SABADO", DOMINGO: "DOMINGO",
};

const COMIDAS_MAP: Record<string, TipoComida> = {
  DESAYUNO: "DESAYUNO", MEDIA_MANANA: "MEDIA_MANANA", ALMUERZO: "ALMUERZO",
  MERIENDA: "MERIENDA", CENA: "CENA", RECENA: "RECENA",
};


export async function aceptarPlanIA(
  generacionId: string,
  planId: string,
  objetivos: MacroObjetivos
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const generacion = await prisma.generacionIA.findFirst({
    where: { id: generacionId, dietistaId: dietista.id },
  });
  if (!generacion) throw new Error(t("generacionIA.generacionNoEncontrada"));

  // Obtener el plan existente con sus días y comidas
  const planExistente = await prisma.planAlimenticio.findUnique({
    where: { id: planId, dietistaId: dietista.id },
    include: {
      dias: {
        include: {
          comidas: {
            include: { alimentos: { select: { id: true } } },
          },
        },
      },
    },
  });
  if (!planExistente) throw new Error(t("plan.planNoEncontrado"));

  const planIA = generacion.respuesta as unknown as {
    dias: {
      dia: string;
      comidas: {
        tipo: string;
        descripcion?: string;
        alimentos: {
          nombre: string;
          cantidadGramos: number;
          estimacion: { calorias: number; proteinas: number; carbohidratos: number; grasas: number };
        }[];
      }[];
    }[];
  } | null;

  if (!planIA?.dias || !Array.isArray(planIA.dias)) {
    throw new Error(t("generacionIA.respuestaFormatoInvalido"));
  }

  const [alimentosGlobales, alimentosDietista] = await Promise.all([
    getAlimentosGlobales(),
    prisma.alimento.findMany({
      where: { dietistaId: dietista.id },
      select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true },
    }),
  ]);
  const todosAlimentos = [...alimentosGlobales, ...alimentosDietista];

  const alimentoCache = new Map<string, string | null>();
  for (const dia of planIA.dias) {
    for (const comida of dia.comidas) {
      for (const a of comida.alimentos) {
        if (!alimentoCache.has(a.nombre)) {
          const match = findAlimentoEnLista(todosAlimentos, a.nombre);
          alimentoCache.set(a.nombre, match?.id ?? null);
        }
      }
    }
  }

  // Limpiar los alimentos existentes de todas las comidas del plan
  for (const dia of planExistente.dias) {
    for (const comida of dia.comidas) {
      if (comida.alimentos.length > 0) {
        await prisma.alimentoEnComida.deleteMany({ where: { comidaId: comida.id } });
      }
    }
  }

  // Rellenar las comidas existentes con los alimentos de la IA
  for (const diaIA of planIA.dias) {
    const diaExistente = planExistente.dias.find((d) => d.dia === (DIAS_MAP[diaIA.dia] || diaIA.dia));
    if (!diaExistente) continue;

    for (const comidaIA of diaIA.comidas) {
      const comidaExistente = diaExistente.comidas.find(
        (c) => c.tipo === (COMIDAS_MAP[comidaIA.tipo] || comidaIA.tipo)
      );
      if (!comidaExistente) continue;

      // Guardar la descripción del plato generada por la IA
      if (comidaIA.descripcion) {
        await prisma.comidaDelDia.update({
          where: { id: comidaExistente.id },
          data: { descripcion: comidaIA.descripcion },
        });
      }

      let orden = 0;
      for (const a of comidaIA.alimentos) {
        const alimentoId = alimentoCache.get(a.nombre) ?? null;
        // Solo añadir si se encontró un alimento real en la DB
        if (!alimentoId) continue;
        await prisma.alimentoEnComida.create({
          data: {
            comidaId: comidaExistente.id,
            alimentoId,
            cantidad: a.cantidadGramos,
            unidad: "GRAMOS",
            orden: orden++,
          },
        });
      }
    }
  }

  // Actualizar objetivos del plan
  await prisma.planAlimenticio.update({
    where: { id: planId },
    data: {
      caloriasObjetivo: objetivos.calorias,
      proteinasObjetivo: objetivos.proteinas,
      carbohidratosObjetivo: objetivos.carbohidratos,
      grasasObjetivo: objetivos.grasas,
    },
  });

  await prisma.generacionIA.update({
    where: { id: generacionId },
    data: { estado: "APLICADO" },
  });

  revalidatePath(`/dietas/${planId}`);
  revalidatePath("/dietas");
}
