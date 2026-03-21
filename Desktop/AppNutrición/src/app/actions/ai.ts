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

export async function checkAIConfigured() {
  return isAIConfigured();
}

export async function generarPlanIA(
  pacienteId: string,
  objetivos: MacroObjetivos,
  instrucciones: string
): Promise<{ generacionId: string; plan: unknown } | { error: string }> {
  try {
    // Validar y sanitizar inputs
    instrucciones = sanitizeString(instrucciones, LIMITS.INSTRUCCIONES_IA);
    objetivos = {
      calorias: validateNumber(objetivos.calorias, 500, 10000),
      proteinas: validateNumber(objetivos.proteinas, 0, LIMITS.MACROS_MAX),
      carbohidratos: validateNumber(objetivos.carbohidratos, 0, LIMITS.MACROS_MAX),
      grasas: validateNumber(objetivos.grasas, 0, LIMITS.MACROS_MAX),
    };

    const dietista = await getCurrentDietista();
    if (!dietista) return { error: "No autorizado" };
    if (!isAIConfigured()) return { error: "API keys de Groq no configuradas. Ve a Ajustes." };

    const paciente = await prisma.paciente.findFirst({
      where: { id: pacienteId, dietistaId: dietista.id },
    });
    if (!paciente) return { error: "Paciente no encontrado" };

    const [alimentosGlobales, alimentosDietista, recetas] = await Promise.all([
      prisma.alimento.findMany({
        where: { dietistaId: null },
        select: { nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true },
        orderBy: { nombre: "asc" },
      }),
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

    const generacion = await prisma.generacionIA.create({
      data: {
        dietistaId: dietista.id,
        pacienteId,
        prompt: promptUsado,
        respuesta: JSON.parse(JSON.stringify(plan)),
      },
    });

    return { generacionId: generacion.id, plan };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return { error: `Error al generar: ${msg}` };
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

// Busca un alimento por nombre (fuzzy) o lo crea con los macros estimados
async function findOrCreateAlimento(
  dietistaId: string,
  nombre: string,
  estimacion: { calorias: number; proteinas: number; carbohidratos: number; grasas: number }
): Promise<string> {
  const nombreNorm = normalizarNombreAlimento(nombre);

  // Buscar exacto primero (con nombre normalizado)
  const exacto = await prisma.alimento.findFirst({
    where: {
      OR: [{ dietistaId }, { dietistaId: null }],
      nombre: { equals: nombreNorm, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (exacto) return exacto.id;

  // Buscar por contiene
  const parcial = await prisma.alimento.findFirst({
    where: {
      OR: [{ dietistaId }, { dietistaId: null }],
      nombre: { contains: nombreNorm, mode: "insensitive" },
    },
    select: { id: true },
  });
  if (parcial) return parcial.id;

  // Buscar por la primera palabra significativa (ej: "Pechuga de pollo" → buscar "pollo")
  const palabras = nombreNorm.split(" ").filter((p) => p.length > 3);
  for (const palabra of palabras) {
    const porPalabra = await prisma.alimento.findFirst({
      where: {
        OR: [{ dietistaId }, { dietistaId: null }],
        nombre: { contains: palabra, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (porPalabra) return porPalabra.id;
  }

  // No existe: crear uno nuevo con nombre normalizado y macros redondeados
  const nuevo = await prisma.alimento.create({
    data: {
      dietistaId,
      nombre: nombreNorm,
      categoria: "OTROS",
      calorias: redondearMacros(estimacion.calorias),
      proteinas: redondearMacros(estimacion.proteinas),
      carbohidratos: redondearMacros(estimacion.carbohidratos),
      grasas: redondearMacros(estimacion.grasas),
      porcion: 100,
      unidad: "GRAMOS",
      origen: "PERSONALIZADO",
    },
  });

  return nuevo.id;
}

export async function aceptarPlanIA(
  generacionId: string,
  planId: string,
  objetivos: MacroObjetivos
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const generacion = await prisma.generacionIA.findFirst({
    where: { id: generacionId, dietistaId: dietista.id },
  });
  if (!generacion) throw new Error("Generación no encontrada");

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
  if (!planExistente) throw new Error("Plan no encontrado");

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
  };

  // Resolver todos los alimentos (buscar o crear)
  const alimentoCache = new Map<string, string>();
  for (const dia of planIA.dias) {
    for (const comida of dia.comidas) {
      for (const a of comida.alimentos) {
        if (!alimentoCache.has(a.nombre)) {
          const est = a.estimacion || { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 };
          const id = await findOrCreateAlimento(dietista.id, a.nombre, est);
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

      for (let i = 0; i < comidaIA.alimentos.length; i++) {
        const a = comidaIA.alimentos[i];
        const alimentoId = alimentoCache.get(a.nombre) || null;
        await prisma.alimentoEnComida.create({
          data: {
            comidaId: comidaExistente.id,
            alimentoId,
            cantidad: a.cantidadGramos,
            unidad: "GRAMOS",
            orden: i,
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
