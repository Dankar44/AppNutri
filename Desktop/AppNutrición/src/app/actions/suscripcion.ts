"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";

interface Suscripcion {
  id: string;
  dietistaId: string;
  plan: string;
  estado: string;
  fechaInicio: Date;
  fechaFin: Date | null;
}

export async function getSuscripcion(): Promise<Suscripcion | null> {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  try {
    // Usar $queryRawUnsafe porque el modelo no está generado aún
    const rows = await prisma.$queryRawUnsafe<Suscripcion[]>(
      `SELECT id, "dietistaId", plan, estado, "fechaInicio", "fechaFin"
       FROM suscripciones WHERE "dietistaId" = $1 LIMIT 1`,
      dietista.id
    );

    if (rows.length > 0) return rows[0];

    // Crear suscripción de prueba de 14 días
    const fechaFin = new Date();
    fechaFin.setDate(fechaFin.getDate() + 14);

    const created = await prisma.$queryRawUnsafe<Suscripcion[]>(
      `INSERT INTO suscripciones (id, "dietistaId", plan, estado, "fechaInicio", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'BASICO', 'PRUEBA', NOW(), $2, NOW(), NOW())
       RETURNING id, "dietistaId", plan, estado, "fechaInicio", "fechaFin"`,
      dietista.id,
      fechaFin
    );

    return created[0] || null;
  } catch {
    // Tabla no existe todavía
    return null;
  }
}

export async function cambiarPlan(nuevoPlan: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  if (nuevoPlan !== "BASICO" && nuevoPlan !== "PROFESIONAL") {
    throw new Error("Plan no válido");
  }

  try {
    await prisma.$queryRawUnsafe(
      `UPDATE suscripciones SET plan = $1::"PlanSuscripcion", "updatedAt" = NOW()
       WHERE "dietistaId" = $2`,
      nuevoPlan,
      dietista.id
    );

    revalidatePath("/ajustes");
  } catch {
    throw new Error("Error al cambiar de plan");
  }
}
