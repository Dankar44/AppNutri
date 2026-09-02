import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { PLAN_COMPLETO, aDetalleVisual } from "@/lib/plan-para-ver";
import { expandirGruposDeDias } from "@/lib/grupos-dias";
import type { PlanVisualDetalle } from "@/components/paciente/plan-visual";
import type { PlanificacionDatos } from "@/app/actions/planificaciones";

/**
 * #40 — La entrega de un caso es una FOTO FIJA (Guillermo, 2 sep 2026): "lo que se envíe se envíe;
 * por mucho que modifique el alumno después, si no le da a enviar otra vez no se refleja".
 *
 * Al entregar se congela aquí el trabajo tal y como está —el paciente, sus planificaciones y sus
 * planes, ya en la forma en que se pintan— y eso es lo que el profesor ve al corregir. El alumno
 * puede seguir tocando su paciente, que es suyo; la entrega no cambia.
 */
export interface PacienteCongelado {
  id: string;
  nombre: string;
  apellidos: string;
  peso: number | null;
  altura: number | null;
  objetivo: string;
  notas: string | null;
  patologias: string[];
  alergias: string[];
}

export interface PlanificacionCongelada {
  id: string;
  nombre: string;
  esDefecto: boolean;
  estado: string;
  datos: PlanificacionDatos;
}

export interface EntregaCongelada {
  v: 1;
  paciente: PacienteCongelado;
  planificaciones: PlanificacionCongelada[];
  planes: PlanVisualDetalle[];
}

/** Máximo de planes que se congelan: los más recientes. Nadie corrige veinte dietas de un caso. */
const MAX_PLANES = 6;

export async function leerPacienteCongelable(pacienteId: string): Promise<PacienteCongelado | null> {
  return prisma.paciente.findUnique({
    where: { id: pacienteId },
    select: {
      id: true, nombre: true, apellidos: true, peso: true, altura: true,
      objetivo: true, notas: true, patologias: true, alergias: true,
    },
  });
}

export async function leerPlanificaciones(pacienteId: string): Promise<PlanificacionCongelada[]> {
  const filas = await prisma.planificacion.findMany({
    where: { pacienteId },
    orderBy: [{ esDefecto: "desc" }, { createdAt: "asc" }],
    select: { id: true, nombre: true, esDefecto: true, estado: true, datos: true },
  });
  return filas.map((f) => ({ ...f, datos: (f.datos ?? {}) as PlanificacionDatos }));
}

/** Un plan entero, en la forma en que lo pinta `PlanVisual`, con sus objetivos. */
export async function leerPlanParaVer(planId: string): Promise<PlanVisualDetalle | null> {
  const plan = await prisma.planAlimenticio.findUnique({ where: { id: planId }, include: PLAN_COMPLETO });
  if (!plan) return null;
  // #75 — los días agrupados enseñan el menú de su día representante, como en el enlace público.
  const dias = await expandirGruposDeDias(plan.id, plan.dias);
  return {
    ...aDetalleVisual(plan, dias),
    activo: plan.activo,
    caloriasObjetivo: plan.caloriasObjetivo,
    proteinasObjetivo: plan.proteinasObjetivo,
    carbohidratosObjetivo: plan.carbohidratosObjetivo,
    grasasObjetivo: plan.grasasObjetivo,
  };
}

export async function congelarTrabajo(pacienteId: string): Promise<EntregaCongelada | null> {
  const paciente = await leerPacienteCongelable(pacienteId);
  if (!paciente) return null;
  const planificaciones = await leerPlanificaciones(pacienteId);
  const ids = await prisma.planAlimenticio.findMany({
    where: { pacienteId },
    orderBy: [{ activo: "desc" }, { createdAt: "desc" }],
    take: MAX_PLANES,
    select: { id: true },
  });
  const planes: PlanVisualDetalle[] = [];
  for (const { id } of ids) {
    const p = await leerPlanParaVer(id);
    if (p) planes.push(p);
  }
  return { v: 1, paciente, planificaciones, planes };
}

/** Lo guardado en la fila, con la forma comprobada por encima (v: 1). */
export function leerCongelado(valor: Prisma.JsonValue | null | undefined): EntregaCongelada | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const v = valor as unknown as EntregaCongelada;
  if (v.v !== 1 || !v.paciente || !Array.isArray(v.planes)) return null;
  return { ...v, planificaciones: Array.isArray(v.planificaciones) ? v.planificaciones : [] };
}
