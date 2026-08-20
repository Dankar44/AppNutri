"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { getTranslations } from "next-intl/server";
import type { RepartoPorComida } from "@/lib/reparto-comidas";

/* ─── Types ─── */

export type PlanificacionDatos = {
  actividadActual?: string;
  actividadObjetivo?: string;
  palCustomActual?: number;
  palCustomObjetivo?: number;
  formulaBmr?: string;
  formulaEer?: string;
  formulaMasaGrasa?: string;
  eerObjetivo?: string;
  grasaPct?: number;
  carbPct?: number;
  protPct?: number;
  macroRefIdx?: number;
  fibraFuente?: string;
  fibraCantidad?: string;
  /** Peso y % grasa ACTUALES de esta planificación (independientes de las medidas del paciente):
   *  el nutri puede ajustarlos por planificación y NO modifican la medida real del paciente. */
  pesoActual?: string;
  grasaActual?: string;
  pesoObjetivo?: string;
  grasaObjetivo?: string;
  imcObjetivo?: string;
  /** % de ajuste sobre el gasto según el objetivo (déficit negativo, superávit positivo). Ej: -10.
   *  null = el nutricionista deseleccionó el ajuste (ningún preset aplicado). */
  ajusteObjetivoPct?: number | null;
  /** Objetivos ABSOLUTOS ya calculados (kcal + gramos), persistidos al guardar la planificación
   *  para que la dieta y la IA los hereden sin recalcular las fórmulas (BMR/EER viven en el cliente).
   *  #78-A. Se recalculan en cada guardado desde el useMemo `macros` del editor de planificación. */
  kcalObjetivo?: number;
  protGObjetivo?: number;
  carbGObjetivo?: number;
  grasaGObjetivo?: number;
  /** #78-C (Fase 1) — Reparto de kcal/macros POR COMIDA sobre las 6 comidas actuales.
   *  Opcional: si no está activo, la dieta usa solo el objetivo del día. La lógica compartida
   *  (normalizar + objetivos por comida) vive en `src/lib/reparto-comidas.ts`. */
  repartoPorComida?: RepartoPorComida;
};

export type { RepartoComida, RepartoPorComida } from "@/lib/reparto-comidas";

export type Planificacion = {
  id: string;
  pacienteId: string;
  nombre: string;
  estado: string;
  esDefecto: boolean;
  fechaInicio: string;
  fechaUltimoCambio: string;
  fechaFinPrevista: string | null;
  datos: PlanificacionDatos;
};

/* ─── Queries ─── */

export async function getPlanificaciones(pacienteId: string): Promise<Planificacion[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const rows = await prisma.$queryRawUnsafe<
    {
      id: string;
      pacienteId: string;
      nombre: string;
      estado: string;
      esDefecto: boolean;
      fechaInicio: Date;
      fechaUltimoCambio: Date;
      fechaFinPrevista: Date | null;
      datos: PlanificacionDatos;
    }[]
  >(
    `SELECT id, "pacienteId", nombre, estado, "esDefecto",
            "fechaInicio", "fechaUltimoCambio", "fechaFinPrevista", datos
     FROM planificaciones
     WHERE "pacienteId" = $1 AND "dietistaId" = $2
     ORDER BY "esDefecto" DESC, "createdAt" ASC`,
    pacienteId,
    dietista.id
  );

  return rows.map((r) => ({
    ...r,
    fechaInicio: r.fechaInicio.toISOString(),
    fechaUltimoCambio: r.fechaUltimoCambio.toISOString(),
    fechaFinPrevista: r.fechaFinPrevista?.toISOString() ?? null,
    datos: (r.datos ?? {}) as PlanificacionDatos,
  }));
}

/* ─── Objetivos de la planificación principal (heredar al crear una dieta · #78-A) ─── */

export async function getObjetivosPlanificacionActiva(
  pacienteId: string
): Promise<{
  planificacionId: string;
  nombre: string;
  kcal: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
} | null> {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const planificaciones = await getPlanificaciones(pacienteId);
  if (planificaciones.length === 0) return null;

  // La principal del paciente: por defecto > activa > primera (getPlanificaciones ya ordena así).
  const elegida =
    planificaciones.find((p) => p.esDefecto) ??
    planificaciones.find((p) => p.estado === "activa") ??
    planificaciones[0];

  const d = elegida.datos ?? {};
  const num = (v: unknown) =>
    typeof v === "number" && isFinite(v) && v > 0 ? Math.round(v) : null;

  return {
    planificacionId: elegida.id,
    nombre: elegida.nombre,
    kcal: num(d.kcalObjetivo),
    proteinas: num(d.protGObjetivo),
    carbohidratos: num(d.carbGObjetivo),
    grasas: num(d.grasaGObjetivo),
  };
}

/* ─── Ensure default exists ─── */

export async function ensurePlanificacionDefecto(pacienteId: string): Promise<Planificacion> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));

  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM planificaciones WHERE "pacienteId" = $1 AND "dietistaId" = $2 AND "esDefecto" = true LIMIT 1`,
    pacienteId,
    dietista.id
  );

  if (existing.length > 0) {
    const all = await getPlanificaciones(pacienteId);
    return all.find((p) => p.esDefecto)!;
  }

  if (dietista.isDemo) {
    // Demo: do not create, return a stub
    return { id: "", pacienteId, nombre: t("planificacion.porDefecto"), estado: "activa", esDefecto: true, fechaInicio: new Date().toISOString(), fechaUltimoCambio: new Date().toISOString(), fechaFinPrevista: null, datos: {} };
  }

  await prisma.$queryRawUnsafe(
    `INSERT INTO planificaciones ("pacienteId", "dietistaId", nombre, "esDefecto", datos)
     VALUES ($1, $2, $3, true, '{}'::jsonb)`,
    pacienteId,
    dietista.id,
    t("planificacion.porDefecto")
  );

  const all = await getPlanificaciones(pacienteId);
  return all.find((p) => p.esDefecto)!;
}

/* ─── Create ─── */

export async function crearPlanificacion(
  pacienteId: string,
  nombre?: string,
  datosIniciales?: PlanificacionDatos
): Promise<string> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return "";

  const datosJson = JSON.stringify(datosIniciales ?? {});
  const nombreFinal = nombre || t("planificacion.nueva");
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO planificaciones ("pacienteId", "dietistaId", nombre, "esDefecto", datos)
     VALUES ($1, $2, $3, false, $4::jsonb)
     RETURNING id`,
    pacienteId,
    dietista.id,
    nombreFinal.slice(0, 100),
    datosJson
  );

  revalidatePath(`/pacientes/${pacienteId}`);
  const id = rows[0]?.id;
  if (!id) throw new Error(t("planificacion.errorCrear"));
  return id;
}

/* ─── Update datos + fechaUltimoCambio ─── */

export async function guardarPlanificacion(
  planId: string,
  datos: PlanificacionDatos
): Promise<void> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await prisma.$queryRawUnsafe(
    `UPDATE planificaciones
     SET datos = $1::jsonb,
         "fechaUltimoCambio" = CURRENT_TIMESTAMP,
         "updatedAt" = CURRENT_TIMESTAMP
     WHERE id = $2 AND "dietistaId" = $3`,
    JSON.stringify(datos),
    planId,
    dietista.id
  );
}

/* ─── Update dates ─── */

export async function actualizarFechasPlanificacion(
  planId: string,
  fechas: { fechaInicio?: string; fechaUltimoCambio?: string; fechaFinPrevista?: string | null }
): Promise<void> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (fechas.fechaInicio !== undefined) {
    sets.push(`"fechaInicio" = $${idx}::timestamp`);
    params.push(new Date(fechas.fechaInicio));
    idx++;
  }
  if (fechas.fechaUltimoCambio !== undefined) {
    sets.push(`"fechaUltimoCambio" = $${idx}::timestamp`);
    params.push(new Date(fechas.fechaUltimoCambio));
    idx++;
  }
  if (fechas.fechaFinPrevista !== undefined) {
    if (fechas.fechaFinPrevista === null) {
      sets.push(`"fechaFinPrevista" = NULL`);
    } else {
      sets.push(`"fechaFinPrevista" = $${idx}::timestamp`);
      params.push(new Date(fechas.fechaFinPrevista));
      idx++;
    }
  }

  if (sets.length === 0) return;

  sets.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  params.push(planId, dietista.id);

  await prisma.$queryRawUnsafe(
    `UPDATE planificaciones SET ${sets.join(", ")} WHERE id = $${idx} AND "dietistaId" = $${idx + 1}`,
    ...params
  );
}

/* ─── Change estado ─── */

export async function cambiarEstadoPlanificacion(
  planId: string,
  estado: "activa" | "terminada" | "guardada"
): Promise<void> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await prisma.$queryRawUnsafe(
    `UPDATE planificaciones SET estado = $1, "updatedAt" = CURRENT_TIMESTAMP
     WHERE id = $2 AND "dietistaId" = $3`,
    estado,
    planId,
    dietista.id
  );
}

/* ─── Rename ─── */

export async function renombrarPlanificacion(planId: string, nombre: string): Promise<void> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await prisma.$queryRawUnsafe(
    `UPDATE planificaciones SET nombre = $1, "updatedAt" = CURRENT_TIMESTAMP
     WHERE id = $2 AND "dietistaId" = $3`,
    nombre.slice(0, 100),
    planId,
    dietista.id
  );
}

/* ─── Delete (no se puede borrar la por defecto) ─── */

export async function eliminarPlanificacion(planId: string, pacienteId: string): Promise<void> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await prisma.$queryRawUnsafe(
    `DELETE FROM planificaciones WHERE id = $1 AND "dietistaId" = $2 AND "esDefecto" = false`,
    planId,
    dietista.id
  );

  revalidatePath(`/pacientes/${pacienteId}`);
}
