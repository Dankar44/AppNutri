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
  /** Lo que necesita la pestaña de planificación para sus cálculos (edad, sexo, objetivo). */
  sexo: string | null;
  fechaNacimiento: string | null;
  objetivoDetalle: string | null;
  createdAt: string | null;
}

export interface PlanificacionCongelada {
  id: string;
  nombre: string;
  esDefecto: boolean;
  estado: string;
  datos: PlanificacionDatos;
  /** Compartida por el profesor (copia de la suya). */
  origenId?: string | null;
  /** Las fechas, que también se pintan: sin ellas la pestaña sale con «Seleccionar mes» vacío
   *  y el profesor no ve la duración que puso el alumno (Guillermo, 7 sep 2026). */
  fechaInicio?: string | null;
  fechaUltimoCambio?: string | null;
  fechaFinPrevista?: string | null;
}

export interface EntregaCongelada {
  v: 1;
  paciente: PacienteCongelado;
  planificaciones: PlanificacionCongelada[];
  planes: PlanVisto[];
  /** Las mediciones y la anamnesis, tal y como las pinta la ficha: la pestaña de planificación
   *  las usa (peso y grasa actuales, actividad). Serializadas (fechas como texto). */
  medidas: unknown[];
  fichaInformacion: unknown | null;
}

/** Máximo de planes que se congelan: los más recientes. Nadie corrige veinte dietas de un caso. */
const MAX_PLANES = 6;

export async function leerPacienteCongelable(pacienteId: string): Promise<PacienteCongelado | null> {
  const p = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    select: {
      id: true, nombre: true, apellidos: true, peso: true, altura: true,
      objetivo: true, notas: true, patologias: true, alergias: true,
      sexo: true, fechaNacimiento: true, objetivoDetalle: true, createdAt: true,
    },
  });
  if (!p) return null;
  return {
    ...p,
    fechaNacimiento: p.fechaNacimiento ? p.fechaNacimiento.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

/** Las mediciones como las recibe la ficha (`getMedidas` + JSON): fechas en texto. */
export async function leerMedidasSerializadas(pacienteId: string): Promise<unknown[]> {
  const medidas = await prisma.medidaAntropometrica.findMany({ where: { pacienteId }, orderBy: { fecha: "desc" } });
  return JSON.parse(JSON.stringify(medidas)) as unknown[];
}

export async function leerFichaInformacion(pacienteId: string): Promise<unknown | null> {
  const p = await prisma.paciente.findUnique({ where: { id: pacienteId }, select: { fichaInformacion: true } });
  return p?.fichaInformacion ?? null;
}

export async function leerPlanificaciones(pacienteId: string): Promise<PlanificacionCongelada[]> {
  const filas = await prisma.planificacion.findMany({
    where: { pacienteId },
    orderBy: [{ esDefecto: "desc" }, { createdAt: "asc" }],
    select: {
      id: true, nombre: true, esDefecto: true, estado: true, datos: true, origenId: true,
      fechaInicio: true, fechaUltimoCambio: true, fechaFinPrevista: true,
    },
  });
  return filas.map((f) => ({
    ...f,
    datos: (f.datos ?? {}) as PlanificacionDatos,
    fechaInicio: f.fechaInicio ? f.fechaInicio.toISOString() : null,
    fechaUltimoCambio: f.fechaUltimoCambio ? f.fechaUltimoCambio.toISOString() : null,
    fechaFinPrevista: f.fechaFinPrevista ? f.fechaFinPrevista.toISOString() : null,
  }));
}

/** Un plan entero, en la forma en que lo pinta `PlanVisual`, con sus objetivos. */
export type PlanVisto = PlanVisualDetalle & { origenId?: string | null };

export async function leerPlanParaVer(planId: string): Promise<PlanVisto | null> {
  const plan = await prisma.planAlimenticio.findUnique({ where: { id: planId }, include: PLAN_COMPLETO });
  if (!plan) return null;
  // #75 — los días agrupados enseñan el menú de su día representante, como en el enlace público.
  const dias = await expandirGruposDeDias(plan.id, plan.dias);
  return {
    ...aDetalleVisual(plan, dias),
    origenId: plan.origenId,
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
  const planes: PlanVisto[] = [];
  for (const { id } of ids) {
    const p = await leerPlanParaVer(id);
    if (p) planes.push(p);
  }
  return {
    v: 1, paciente, planificaciones, planes,
    medidas: await leerMedidasSerializadas(pacienteId),
    fichaInformacion: await leerFichaInformacion(pacienteId),
  };
}

/** Lo guardado en la fila, con la forma comprobada por encima (v: 1). */
export function leerCongelado(valor: Prisma.JsonValue | null | undefined): EntregaCongelada | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const v = valor as unknown as EntregaCongelada;
  if (v.v !== 1 || !v.paciente || !Array.isArray(v.planes)) return null;
  return {
    ...v,
    planificaciones: Array.isArray(v.planificaciones) ? v.planificaciones : [],
    medidas: Array.isArray(v.medidas) ? v.medidas : [],
    fichaInformacion: v.fichaInformacion ?? null,
    // Fotos de antes de guardar estos campos: se rellenan a null para que la pestaña no reviente.
    paciente: {
      ...v.paciente,
      sexo: v.paciente.sexo ?? null,
      fechaNacimiento: v.paciente.fechaNacimiento ?? null,
      objetivoDetalle: v.paciente.objetivoDetalle ?? null,
      createdAt: v.paciente.createdAt ?? null,
    },
  };
}
