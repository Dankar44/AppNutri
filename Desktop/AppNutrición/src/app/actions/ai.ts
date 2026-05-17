"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { isAIConfigured } from "@/lib/openai";
import { generateDietPlan } from "@/lib/ai/generate-plan";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { MacroObjetivos } from "@/lib/ai/types";
import { DiaSemana, TipoComida } from "@/generated/prisma/client";
import { normalizarNombreAlimento, redondearMacros } from "@/lib/alimento-utils";
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

    // Recalcular macros de la preview usando datos REALES de la DB
    for (const dia of plan.dias) {
      for (const comida of dia.comidas) {
        for (const a of comida.alimentos) {
          const alimentoId = await findAlimentoMasParecido(dietista.id, a.nombre);
          if (alimentoId) {
            const real = await prisma.alimento.findUnique({
              where: { id: alimentoId },
              select: { nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true },
            });
            if (real) {
              // Redondear cantidad a múltiplo de 5
              a.cantidadGramos = Math.round(a.cantidadGramos / 5) * 5 || 5;
              const factor = a.cantidadGramos / 100;
              a.nombre = real.nombre;
              a.estimacion = {
                calorias: Math.round(real.calorias * factor),
                proteinas: Math.round(real.proteinas * factor * 10) / 10,
                carbohidratos: Math.round(real.carbohidratos * factor * 10) / 10,
                grasas: Math.round(real.grasas * factor * 10) / 10,
              };
            }
          }
        }
      }
    }

    // Ajustar cantidades para que el total diario se acerque al objetivo
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

    // Recalcular macros finales con cantidades redondeadas
    for (const dia of plan.dias) {
      for (const comida of dia.comidas) {
        for (const a of comida.alimentos) {
          const alimentoId = await findAlimentoMasParecido(dietista.id, a.nombre);
          if (alimentoId) {
            const real = await prisma.alimento.findUnique({
              where: { id: alimentoId },
              select: { calorias: true, proteinas: true, carbohidratos: true, grasas: true },
            });
            if (real) {
              const f = a.cantidadGramos / 100;
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

// Busca el alimento más parecido en la DB. NUNCA crea nuevos.
// Prioriza: nombre exacto > nombre que empieza igual > primera palabra exacta
async function findAlimentoMasParecido(
  dietistaId: string,
  nombre: string,
): Promise<string | null> {
  const nombreNorm = normalizarNombreAlimento(nombre);
  const or = [{ dietistaId }, { dietistaId: null }];

  // 1. Exacto
  const exacto = await prisma.alimento.findFirst({
    where: { OR: or, nombre: { equals: nombreNorm, mode: "insensitive" } },
    select: { id: true },
  });
  if (exacto) return exacto.id;

  // 2. Buscar con nombre + variantes comunes
  // Ej: "Salmon" → buscar "Salmon", "Salmón" (con tilde)
  const variantes = [nombreNorm];
  // Añadir variante sin/con tilde básica
  const sinTildes = nombreNorm.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (sinTildes !== nombreNorm) variantes.push(sinTildes);

  for (const v of variantes) {
    // Buscar TODOS los que empiezan así y coger el de nombre más corto (más parecido)
    const matches = await prisma.alimento.findMany({
      where: { OR: or, nombre: { startsWith: v, mode: "insensitive" } },
      select: { id: true, nombre: true },
      take: 10,
    });
    if (matches.length > 0) {
      // Priorizar el nombre más corto (Salmon > Salmonete, Patatas > Patatas Fritas)
      matches.sort((a, b) => a.nombre.length - b.nombre.length);
      return matches[0].id;
    }
  }

  // 3. Buscar solo la primera palabra (ej: "Avena copos" → "Avena")
  const primera = nombreNorm.split(" ")[0];
  if (primera && primera.length >= 4) {
    // Buscar EXACTO la primera palabra para evitar "Pan" → "Panga"
    const porPrimera = await prisma.alimento.findFirst({
      where: { OR: or, nombre: { equals: primera, mode: "insensitive" } },
      select: { id: true },
    });
    if (porPrimera) return porPrimera.id;

    // Buscar que empiece por la primera palabra, priorizar nombre más corto
    const porPrimeraStart = await prisma.alimento.findMany({
      where: { OR: or, nombre: { startsWith: primera, mode: "insensitive" } },
      select: { id: true, nombre: true },
      take: 10,
    });
    if (porPrimeraStart.length > 0) {
      porPrimeraStart.sort((a, b) => a.nombre.length - b.nombre.length);
      return porPrimeraStart[0].id;
    }
  }

  return null;
}

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

  // Resolver todos los alimentos (buscar el más parecido, NUNCA crear nuevos)
  const alimentoCache = new Map<string, string | null>();
  for (const dia of planIA.dias) {
    for (const comida of dia.comidas) {
      for (const a of comida.alimentos) {
        if (!alimentoCache.has(a.nombre)) {
          const id = await findAlimentoMasParecido(dietista.id, a.nombre);
          alimentoCache.set(a.nombre, id);
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
