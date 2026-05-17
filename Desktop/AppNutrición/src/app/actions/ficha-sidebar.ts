"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import type { FichaSidebarData } from "@/lib/ficha-sidebar-types";
import { getTranslations } from "next-intl/server";

export async function getFichaSidebar(pacienteId: string): Promise<FichaSidebarData> {
  const dietista = await getCurrentDietista();
  if (!dietista) return {};

  const rows = await prisma.$queryRawUnsafe<{ fichaSidebar: FichaSidebarData | null }[]>(
    `SELECT "fichaSidebar" FROM pacientes WHERE id = $1 AND "dietistaId" = $2`,
    pacienteId, dietista.id
  );

  const data = rows[0]?.fichaSidebar;
  if (!data || typeof data !== "object") return {};
  return data;
}

export async function guardarFichaSidebar(
  pacienteId: string,
  data: FichaSidebarData
): Promise<void> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await prisma.$queryRawUnsafe(
    `UPDATE pacientes SET "fichaSidebar" = $1::jsonb WHERE id = $2 AND "dietistaId" = $3`,
    JSON.stringify(data), pacienteId, dietista.id
  );

  revalidatePath(`/pacientes/${pacienteId}`);
}
