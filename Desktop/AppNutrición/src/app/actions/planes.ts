"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DiaSemana, TipoComida, UnidadMedida } from "@/generated/prisma/client";
import {
  sanitizeString,
  sanitizeSearch,
  validateNumber,
  validateNumberOptional,
  LIMITS,
} from "@/lib/validation";
import { capitalizarNombre } from "@/lib/utils";
import { getRecomendaciones } from "./pacientes";
import type { PlanPDFData } from "@/lib/pdf/generate-plan-pdf";

/**
 * Helper: verifica que una comida pertenezca a un plan del dietista actual.
 * Devuelve el dietistaId del plan o null si no se encuentra la cadena.
 */
async function verificarPropietarioComida(comidaId: string, dietistaId: string) {
  const comida = await prisma.comidaDelDia.findUnique({
    where: { id: comidaId },
    include: { diaDelPlan: { include: { plan: { select: { dietistaId: true } } } } },
  });
  if (!comida || comida.diaDelPlan.plan.dietistaId !== dietistaId) {
    throw new Error("No autorizado");
  }
}

/**
 * Helper: verifica que un alimentoEnComida pertenezca a un plan del dietista actual.
 */
async function verificarPropietarioAlimentoEnComida(alimentoEnComidaId: string, dietistaId: string) {
  const item = await prisma.alimentoEnComida.findUnique({
    where: { id: alimentoEnComidaId },
    include: { comida: { include: { diaDelPlan: { include: { plan: { select: { dietistaId: true } } } } } } },
  });
  if (!item || item.comida.diaDelPlan.plan.dietistaId !== dietistaId) {
    throw new Error("No autorizado");
  }
}

export interface PlanFormData {
  nombre: string;
  pacienteId: string;
  caloriasObjetivo?: number;
  proteinasObjetivo?: number;
  carbohidratosObjetivo?: number;
  grasasObjetivo?: number;
}

const DIAS: DiaSemana[] = [
  "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO",
];

const COMIDAS: TipoComida[] = [
  "DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA",
];

export async function crearPlan(data: PlanFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const nombre = sanitizeString(data.nombre, LIMITS.NOMBRE);
  if (!nombre) throw new Error("El nombre es obligatorio");
  const caloriasObjetivo = data.caloriasObjetivo != null
    ? validateNumber(data.caloriasObjetivo, 0, LIMITS.CALORIAS_MAX)
    : null;
  const proteinasObjetivo = data.proteinasObjetivo != null
    ? validateNumber(data.proteinasObjetivo, 0, LIMITS.MACROS_MAX)
    : null;
  const carbohidratosObjetivo = data.carbohidratosObjetivo != null
    ? validateNumber(data.carbohidratosObjetivo, 0, LIMITS.MACROS_MAX)
    : null;
  const grasasObjetivo = data.grasasObjetivo != null
    ? validateNumber(data.grasasObjetivo, 0, LIMITS.MACROS_MAX)
    : null;

  // La nueva dieta se marca como la actual del paciente:
  // desactivar el resto antes de crear la nueva.
  await prisma.planAlimenticio.updateMany({
    where: { dietistaId: dietista.id, pacienteId: data.pacienteId, activo: true },
    data: { activo: false },
  });

  const plan = await prisma.planAlimenticio.create({
    data: {
      dietista: { connect: { id: dietista.id } },
      paciente: { connect: { id: data.pacienteId } },
      nombre,
      caloriasObjetivo,
      proteinasObjetivo,
      carbohidratosObjetivo,
      grasasObjetivo,
      activo: true,
      dias: {
        create: DIAS.map((dia) => ({
          dia,
          comidas: {
            create: COMIDAS.map((tipo, orden) => ({ tipo, orden })),
          },
        })),
      },
    },
  });

  revalidatePath("/dietas");
  redirect(`/dietas/${plan.id}`);
}

export async function actualizarPlan(id: string, data: Partial<PlanFormData>) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const updateData: Record<string, unknown> = {};
  if (data.nombre !== undefined) {
    const nombre = sanitizeString(data.nombre, LIMITS.NOMBRE);
    if (!nombre) throw new Error("El nombre es obligatorio");
    updateData.nombre = nombre;
  }
  if (data.caloriasObjetivo !== undefined) {
    updateData.caloriasObjetivo = data.caloriasObjetivo != null
      ? validateNumber(data.caloriasObjetivo, 0, LIMITS.CALORIAS_MAX)
      : null;
  }
  if (data.proteinasObjetivo !== undefined) {
    updateData.proteinasObjetivo = data.proteinasObjetivo != null
      ? validateNumber(data.proteinasObjetivo, 0, LIMITS.MACROS_MAX)
      : null;
  }
  if (data.carbohidratosObjetivo !== undefined) {
    updateData.carbohidratosObjetivo = data.carbohidratosObjetivo != null
      ? validateNumber(data.carbohidratosObjetivo, 0, LIMITS.MACROS_MAX)
      : null;
  }
  if (data.grasasObjetivo !== undefined) {
    updateData.grasasObjetivo = data.grasasObjetivo != null
      ? validateNumber(data.grasasObjetivo, 0, LIMITS.MACROS_MAX)
      : null;
  }

  await prisma.planAlimenticio.update({
    where: { id, dietistaId: dietista.id },
    data: updateData,
  });

  revalidatePath(`/dietas/${id}`);
  revalidatePath("/dietas");
}

export async function eliminarPlan(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  // Borrar manualmente en orden para evitar problemas de cascada con PrismaPg
  const plan = await prisma.planAlimenticio.findUnique({
    where: { id, dietistaId: dietista.id },
    include: {
      dias: {
        include: {
          comidas: {
            include: { alimentos: { select: { id: true } } },
          },
        },
      },
      enlaces: { select: { id: true } },
    },
  });

  if (!plan) throw new Error("Plan no encontrado");

  // Borrar alimentos en comidas
  for (const dia of plan.dias) {
    for (const comida of dia.comidas) {
      if (comida.alimentos.length > 0) {
        await prisma.alimentoEnComida.deleteMany({ where: { comidaId: comida.id } });
      }
    }
    // Borrar comidas del día
    await prisma.comidaDelDia.deleteMany({ where: { diaId: dia.id } });
  }

  // Borrar días
  await prisma.diaDelPlan.deleteMany({ where: { planId: id } });

  // Borrar enlaces compartidos
  await prisma.enlaceCompartido.deleteMany({ where: { planId: id } });

  // Borrar el plan
  await prisma.planAlimenticio.delete({ where: { id } });

  revalidatePath("/dietas");
  revalidatePath("/dashboard");
}

export async function getPlanes(busqueda?: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const search = busqueda ? sanitizeSearch(busqueda) : undefined;

  return prisma.planAlimenticio.findMany({
    where: {
      dietistaId: dietista.id,
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: "insensitive" as const } },
              { paciente: { nombre: { contains: search, mode: "insensitive" as const } } },
              { paciente: { apellidos: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    include: { paciente: { select: { nombre: true, apellidos: true, fotoUrl: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlan(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  return prisma.planAlimenticio.findUnique({
    where: { id, dietistaId: dietista.id },
    include: {
      paciente: true,
      dias: {
        orderBy: { dia: "asc" },
        include: {
          comidas: {
            orderBy: { orden: "asc" },
            include: {
              alimentos: {
                orderBy: { orden: "asc" },
                include: {
                  alimento: true,
                  receta: { include: { ingredientes: { include: { alimento: { select: { nombre: true } } } } } },
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function addAlimentoAComida(
  comidaId: string,
  alimentoId: string | null,
  recetaId: string | null,
  cantidad: number,
  unidad: UnidadMedida = "GRAMOS"
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await verificarPropietarioComida(comidaId, dietista.id);
  cantidad = validateNumber(cantidad, 0.1, LIMITS.CANTIDAD_MAX);

  const count = await prisma.alimentoEnComida.count({ where: { comidaId } });

  await prisma.alimentoEnComida.create({
    data: {
      comidaId,
      alimentoId,
      recetaId,
      cantidad,
      unidad,
      orden: count,
    },
  });
}

export async function removeAlimentoDeComida(alimentoEnComidaId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await verificarPropietarioAlimentoEnComida(alimentoEnComidaId, dietista.id);

  await prisma.alimentoEnComida.delete({
    where: { id: alimentoEnComidaId },
  });
}

export async function actualizarCantidadAlimento(
  alimentoEnComidaId: string,
  cantidad: number
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await verificarPropietarioAlimentoEnComida(alimentoEnComidaId, dietista.id);
  cantidad = validateNumber(cantidad, 0.1, LIMITS.CANTIDAD_MAX);

  await prisma.alimentoEnComida.update({
    where: { id: alimentoEnComidaId },
    data: { cantidad },
  });
}

export async function actualizarDescripcionComida(
  comidaId: string,
  descripcion: string
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await verificarPropietarioComida(comidaId, dietista.id);

  await prisma.comidaDelDia.update({
    where: { id: comidaId },
    data: { descripcion: descripcion.trim().slice(0, 500) || null },
  });
}

export async function moverAlimentoAComida(
  alimentoEnComidaId: string,
  nuevaComidaId: string
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await verificarPropietarioAlimentoEnComida(alimentoEnComidaId, dietista.id);
  await verificarPropietarioComida(nuevaComidaId, dietista.id);

  const item = await prisma.alimentoEnComida.findUnique({
    where: { id: alimentoEnComidaId },
  });
  if (!item) return;
  if (item.comidaId === nuevaComidaId) return;

  const count = await prisma.alimentoEnComida.count({
    where: { comidaId: nuevaComidaId },
  });

  await prisma.alimentoEnComida.update({
    where: { id: alimentoEnComidaId },
    data: { comidaId: nuevaComidaId, orden: count },
  });
}

export async function getPacientesParaPlan() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.paciente.findMany({
    where: { dietistaId: dietista.id, activo: true },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      fotoUrl: true,
      email: true,
      telefono: true,
      fechaNacimiento: true,
      objetivo: true,
      objetivoDetalle: true,
      peso: true,
      altura: true,
    },
    orderBy: { nombre: "asc" },
  });
}

/**
 * Devuelve contexto enriquecido de un paciente para mostrar al crear un plan:
 * - Datos del paciente
 * - Plan activo (si existe)
 * - Conteo total de planes
 * - Última medida antropométrica
 * - Próxima cita
 */
export async function getPacienteContextoPlan(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId: dietista.id },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      fotoUrl: true,
      email: true,
      telefono: true,
      fechaNacimiento: true,
      objetivo: true,
      objetivoDetalle: true,
      peso: true,
      altura: true,
    },
  });
  if (!paciente) return null;

  const ahora = new Date();
  const [planActivo, totalPlanes, ultimaMedida, proximaCita] = await Promise.all([
    prisma.planAlimenticio.findFirst({
      where: { pacienteId, dietistaId: dietista.id, activo: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombre: true,
        caloriasObjetivo: true,
        proteinasObjetivo: true,
        carbohidratosObjetivo: true,
        grasasObjetivo: true,
        createdAt: true,
      },
    }),
    prisma.planAlimenticio.count({
      where: { pacienteId, dietistaId: dietista.id },
    }),
    prisma.medidaAntropometrica.findFirst({
      where: { pacienteId },
      orderBy: { fecha: "desc" },
      select: { fecha: true, peso: true, imc: true },
    }),
    prisma.cita.findFirst({
      where: { pacienteId, dietistaId: dietista.id, fechaHora: { gte: ahora } },
      orderBy: { fechaHora: "asc" },
      select: { id: true, fechaHora: true, motivo: true, estado: true },
    }),
  ]);

  return { paciente, planActivo, totalPlanes, ultimaMedida, proximaCita };
}

export async function getPlanesPaciente(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.planAlimenticio.findMany({
    where: { dietistaId: dietista.id, pacienteId },
    orderBy: { createdAt: "desc" },
  });
}

const MICRO_COLS = [
  "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
  "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
  "folato","acidoPantotenico","colina","calcio","hierro",
  "magnesio","fosforo","potasio","sodio","cinc",
  "cobre","manganeso","selenio","fluor",
] as const;

/**
 * Carga todos los planes de un paciente con datos completos (días, comidas,
 * alimentos + micronutrientes, recetas) en un mínimo de queries.
 * Reemplaza el patrón N+1 anterior (getPlan por cada plan + getMicronutrientes por cada plan).
 */
export async function getPlanesDetallePaciente(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const planes = await prisma.planAlimenticio.findMany({
    where: { dietistaId: dietista.id, pacienteId },
    orderBy: { createdAt: "desc" },
    include: {
      dias: {
        orderBy: { dia: "asc" },
        include: {
          comidas: {
            orderBy: { orden: "asc" },
            include: {
              alimentos: {
                orderBy: { orden: "asc" },
                include: {
                  alimento: true,
                  receta: {
                    select: {
                      id: true, nombre: true, calorias: true, proteinas: true,
                      carbohidratos: true, grasas: true, fibra: true, porciones: true,
                      descripcion: true, dietistaId: true,
                      ingredientes: { include: { alimento: { select: { nombre: true } } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Recoger IDs únicos de alimentos de todos los planes
  const alimentoIdSet = new Set<string>();
  for (const plan of planes) {
    for (const dia of plan.dias) {
      for (const comida of dia.comidas) {
        for (const a of comida.alimentos) {
          if (a.alimento?.id) alimentoIdSet.add(a.alimento.id);
        }
      }
    }
  }

  // 1 sola query de micronutrientes para todos los planes combinados
  const microMap: Record<string, Record<string, number>> = {};
  if (alimentoIdSet.size > 0) {
    const ids = [...alimentoIdSet];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const selectCols = MICRO_COLS.map((c) => `"${c}"`).join(",");
    const rows = await prisma.$queryRawUnsafe<(Record<string, unknown> & { id: string })[]>(
      `SELECT id, ${selectCols} FROM alimentos WHERE id IN (${placeholders})`,
      ...ids,
    );
    for (const row of rows) {
      const micros: Record<string, number> = {};
      for (const col of MICRO_COLS) micros[col] = typeof row[col] === "number" ? (row[col] as number) : 0;
      microMap[row.id] = micros;
    }
  }

  // Formatear resultado
  const result = planes.map((plan) => ({
    id: plan.id,
    nombre: plan.nombre,
    caloriasObjetivo: plan.caloriasObjetivo,
    activo: plan.activo,
    proteinasObjetivo: plan.proteinasObjetivo,
    carbohidratosObjetivo: plan.carbohidratosObjetivo,
    grasasObjetivo: plan.grasasObjetivo,
    createdAt: plan.createdAt?.toISOString?.() ?? new Date(plan.createdAt).toISOString(),
    dias: plan.dias.map((dia) => ({
      id: dia.id,
      dia: dia.dia,
      comidas: dia.comidas.map((comida) => ({
        id: comida.id,
        tipo: comida.tipo,
        descripcion: comida.descripcion,
        alimentos: comida.alimentos.map((a) => {
          const micros = a.alimento?.id ? (microMap[a.alimento.id] || {}) : {};
          return {
            id: a.id,
            cantidad: a.cantidad,
            unidad: a.unidad,
            alimento: a.alimento
              ? {
                  id: a.alimento.id,
                  nombre: a.alimento.nombre,
                  calorias: a.alimento.calorias ?? 0,
                  proteinas: a.alimento.proteinas ?? 0,
                  carbohidratos: a.alimento.carbohidratos ?? 0,
                  grasas: a.alimento.grasas ?? 0,
                  fibra: a.alimento.fibra ?? 0,
                  porcion: a.alimento.porcion ?? 100,
                  categoria: a.alimento.categoria ?? "OTROS",
                  enlaceProducto: a.alimento.enlaceProducto ?? null,
                  imagenUrl: a.alimento.imagenUrl ?? null,
                  esPropio: !!a.alimento.dietistaId && a.alimento.dietistaId === dietista.id,
                  ...micros,
                }
              : null,
            receta: a.receta
              ? {
                  id: a.receta.id,
                  nombre: a.receta.nombre,
                  calorias: a.receta.calorias ?? 0,
                  proteinas: a.receta.proteinas ?? 0,
                  carbohidratos: a.receta.carbohidratos ?? 0,
                  grasas: a.receta.grasas ?? 0,
                  fibra: a.receta.fibra ?? 0,
                  porciones: a.receta.porciones ?? 1,
                  descripcion: a.receta.descripcion ?? null,
                  ingredientes: a.receta.ingredientes?.map((i) => ({ nombre: i.alimento.nombre, cantidad: i.cantidad, unidad: i.unidad })) ?? [],
                  esPropio: !!a.receta.dietistaId && a.receta.dietistaId === dietista.id,
                }
              : null,
          };
        }),
      })),
    })),
  }));

  return JSON.parse(JSON.stringify(result));
}

/**
 * Marca un plan como "actual" (activo) para el paciente actual,
 * desactivando el resto de planes del mismo paciente.
 */
export async function asignarPlanComoActual(planId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const plan = await prisma.planAlimenticio.findUnique({
    where: { id: planId },
    select: { id: true, pacienteId: true, dietistaId: true },
  });

  if (!plan || plan.dietistaId !== dietista.id) throw new Error("No autorizado");

  await prisma.$transaction([
    prisma.planAlimenticio.updateMany({
      where: { dietistaId: dietista.id, pacienteId: plan.pacienteId, activo: true },
      data: { activo: false },
    }),
    prisma.planAlimenticio.update({
      where: { id: planId, dietistaId: dietista.id },
      data: { activo: true },
    }),
  ]);

  revalidatePath(`/pacientes/${plan.pacienteId}`);
  revalidatePath(`/pacientes/${plan.pacienteId}?pestana=plan-alimentacion`);
}

export async function guardarComoPlantilla(planId: string, nombre: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  nombre = sanitizeString(nombre, LIMITS.NOMBRE);
  if (!nombre) throw new Error("El nombre es obligatorio");

  const plan = await getPlan(planId);
  if (!plan) throw new Error("Plan no encontrado");

  const datos = plan.dias.map((dia) => ({
    dia: dia.dia,
    comidas: dia.comidas.map((comida) => ({
      tipo: comida.tipo,
      alimentos: comida.alimentos.map((a) => ({
        alimentoId: a.alimentoId,
        recetaId: a.recetaId,
        cantidad: a.cantidad,
        unidad: a.unidad,
      })),
    })),
  }));

  const plantilla = await prisma.plantilla.create({
    data: {
      dietista: { connect: { id: dietista.id } },
      nombre,
      datos: JSON.parse(JSON.stringify(datos)),
    },
  });

  revalidatePath("/dietas");
  return plantilla;
}

/**
 * Returns everything needed to render the PDF on the client.
 */
export async function getPlanPDFData(planId: string): Promise<PlanPDFData | null> {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const plan = await getPlan(planId);
  if (!plan) return null;

  const recomendaciones = await getRecomendaciones(plan.pacienteId);

  const { getTheme } = await import("@/lib/pdf/pdf-themes");
  const tema = getTheme(dietista.temaPdf, dietista.colorPrimarioPdf);

  return {
    planNombre: plan.nombre,
    pacienteNombre: `${capitalizarNombre(plan.paciente.nombre)} ${capitalizarNombre(plan.paciente.apellidos)}`,
    dietistaNombre: `${dietista.nombre} ${dietista.apellidos}`,
    tema,
    brandName: dietista.marcaPdf || undefined,
    logoDataUrl: dietista.pdfLogoUrl || undefined,
    clinica: dietista.clinica || undefined,
    dias: plan.dias.map((dia) => ({
      dia: dia.dia,
      comidas: dia.comidas.map((comida) => ({
        tipo: comida.tipo,
        descripcion: comida.descripcion,
        alimentos: comida.alimentos.map((a) => ({
          cantidad: a.cantidad,
          unidad: a.unidad,
          alimento: a.alimento
            ? {
                id: a.alimento.id,
                nombre: a.alimento.nombre,
                categoria: a.alimento.categoria ?? "OTROS",
                calorias: a.alimento.calorias ?? 0,
                proteinas: a.alimento.proteinas ?? 0,
                carbohidratos: a.alimento.carbohidratos ?? 0,
                grasas: a.alimento.grasas ?? 0,
                fibra: a.alimento.fibra ?? 0,
                porcion: a.alimento.porcion ?? 100,
                enlaceProducto: a.alimento.enlaceProducto ?? null,
                imagenUrl: a.alimento.imagenUrl ?? null,
              }
            : null,
          receta: a.receta
            ? {
                id: a.receta.id,
                nombre: a.receta.nombre,
                descripcion: a.receta.descripcion,
                instrucciones: a.receta.instrucciones,
                porciones: a.receta.porciones ?? 1,
                calorias: a.receta.calorias ?? 0,
                proteinas: a.receta.proteinas ?? 0,
                carbohidratos: a.receta.carbohidratos ?? 0,
                grasas: a.receta.grasas ?? 0,
                ingredientes: (a.receta.ingredientes ?? []).map((i) => ({
                  alimento: { nombre: i.alimento.nombre },
                  cantidad: i.cantidad,
                  unidad: i.unidad,
                })),
              }
            : null,
        })),
      })),
    })),
    recomendaciones,
    caloriasObjetivo: plan.caloriasObjetivo,
  };
}
