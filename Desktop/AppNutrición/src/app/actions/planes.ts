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

  const plan = await prisma.planAlimenticio.create({
    data: {
      dietistaId: dietista.id,
      pacienteId: data.pacienteId,
      nombre,
      caloriasObjetivo,
      proteinasObjetivo,
      carbohidratosObjetivo,
      grasasObjetivo,
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
    select: { id: true, nombre: true, apellidos: true },
    orderBy: { nombre: "asc" },
  });
}

export async function getPlanesPaciente(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.planAlimenticio.findMany({
    where: { dietistaId: dietista.id, pacienteId },
    orderBy: { createdAt: "desc" },
  });
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
      dietistaId: dietista.id,
      nombre,
      datos: JSON.parse(JSON.stringify(datos)),
    },
  });

  revalidatePath("/dietas");
  return plantilla;
}
