"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

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

    if (dietista.isDemo) {
      return {
        id: "demo", dietistaId: dietista.id,
        plan: "PROFESIONAL", estado: "ACTIVA",
        fechaInicio: new Date(), fechaFin: null,
      };
    }

    const created = await prisma.$queryRawUnsafe<Suscripcion[]>(
      `INSERT INTO suscripciones (id, "dietistaId", plan, estado, "fechaInicio", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'PROFESIONAL', 'ACTIVA', NOW(), NULL, NOW(), NOW())
       RETURNING id, "dietistaId", plan, estado, "fechaInicio", "fechaFin"`,
      dietista.id
    );

    return created[0] || null;
  } catch {
    // Tabla no existe todavía
    return null;
  }
}

export async function cambiarPlan(nuevoPlan: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  if (nuevoPlan !== "BASICO" && nuevoPlan !== "PROFESIONAL") {
    throw new Error(t("plan.planNoValido"));
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
    throw new Error(t("pago.errorCambiarPlan"));
  }
}
