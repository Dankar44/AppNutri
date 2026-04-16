"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";

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
  pesoObjetivo?: string;
  grasaObjetivo?: string;
  imcObjetivo?: string;
};

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

/* ─── Ensure default exists ─── */

export async function ensurePlanificacionDefecto(pacienteId: string): Promise<Planificacion> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM planificaciones WHERE "pacienteId" = $1 AND "dietistaId" = $2 AND "esDefecto" = true LIMIT 1`,
    pacienteId,
    dietista.id
  );

  if (existing.length > 0) {
    const all = await getPlanificaciones(pacienteId);
    return all.find((p) => p.esDefecto)!;
  }

  await prisma.$queryRawUnsafe(
    `INSERT INTO planificaciones ("pacienteId", "dietistaId", nombre, "esDefecto", datos)
     VALUES ($1, $2, 'Planificación por defecto', true, '{}'::jsonb)`,
    pacienteId,
    dietista.id
  );

  const all = await getPlanificaciones(pacienteId);
  return all.find((p) => p.esDefecto)!;
}

/* ─── Create ─── */

export async function crearPlanificacion(
  pacienteId: string,
  nombre: string = "Nueva planificación",
  datosIniciales?: PlanificacionDatos
): Promise<string> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const datosJson = JSON.stringify(datosIniciales ?? {});
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO planificaciones ("pacienteId", "dietistaId", nombre, "esDefecto", datos)
     VALUES ($1, $2, $3, false, $4::jsonb)
     RETURNING id`,
    pacienteId,
    dietista.id,
    nombre.slice(0, 100),
    datosJson
  );

  revalidatePath(`/pacientes/${pacienteId}`);
  return rows[0].id;
}

/* ─── Update datos + fechaUltimoCambio ─── */

export async function guardarPlanificacion(
  planId: string,
  datos: PlanificacionDatos
): Promise<void> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

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
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

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
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

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
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

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
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.$queryRawUnsafe(
    `DELETE FROM planificaciones WHERE id = $1 AND "dietistaId" = $2 AND "esDefecto" = false`,
    planId,
    dietista.id
  );

  revalidatePath(`/pacientes/${pacienteId}`);
}
