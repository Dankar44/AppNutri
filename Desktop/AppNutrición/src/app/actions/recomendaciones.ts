"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

// ─── Types ───

export interface EjercicioGuardado {
  nombre: string;
  met: number;
  duracion: number; // minutos
  frecuencia: number; // veces por semana (8 = todos los días)
}

export interface RecomendacionesData {
  agua: string;
  ejercicios: EjercicioGuardado[];
  alimentosEvitar: string[];
  otrasRecomendaciones: string;
}

const DEFAULT_DATA: RecomendacionesData = {
  agua: "",
  ejercicios: [],
  alimentosEvitar: [],
  otrasRecomendaciones: "",
};

// ─── Get ───

export async function getRecomendacionesEstructuradas(
  pacienteId: string
): Promise<RecomendacionesData> {
  const dietista = await getCurrentDietista();
  if (!dietista) return DEFAULT_DATA;

  const rows = await prisma.$queryRawUnsafe<
    { recomendaciones: string | null }[]
  >(
    `SELECT recomendaciones FROM pacientes WHERE id = $1 AND "dietistaId" = $2`,
    pacienteId,
    dietista.id
  );

  const raw = rows[0]?.recomendaciones || "";

  // Try to parse as JSON structured data
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "agua" in parsed) {
      return {
        agua: parsed.agua || "",
        ejercicios: Array.isArray(parsed.ejercicios) ? parsed.ejercicios : [],
        alimentosEvitar: Array.isArray(parsed.alimentosEvitar)
          ? parsed.alimentosEvitar
          : [],
        otrasRecomendaciones: parsed.otrasRecomendaciones || "",
      };
    }
  } catch {
    // Not JSON — treat as legacy plain-text recomendaciones
  }

  // Legacy: the field contained plain text, put it in otrasRecomendaciones
  return {
    ...DEFAULT_DATA,
    otrasRecomendaciones: raw,
  };
}

// ─── Save ───

export async function guardarRecomendacionesEstructuradas(
  pacienteId: string,
  data: RecomendacionesData
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  // Sanitize
  const sanitized: RecomendacionesData = {
    agua: (data.agua || "").slice(0, 200),
    ejercicios: Array.isArray(data.ejercicios)
      ? data.ejercicios.slice(0, 50).map((e) => ({
          nombre: (e.nombre || "").slice(0, 200),
          met: typeof e.met === "number" ? e.met : 0,
          duracion: typeof e.duracion === "number" ? Math.max(0, Math.min(e.duracion, 999)) : 20,
          frecuencia: typeof e.frecuencia === "number" ? Math.max(1, Math.min(e.frecuencia, 8)) : 1,
        }))
      : [],
    alimentosEvitar: Array.isArray(data.alimentosEvitar)
      ? data.alimentosEvitar.slice(0, 100).map((s) => String(s).slice(0, 200))
      : [],
    otrasRecomendaciones: (data.otrasRecomendaciones || "").slice(0, 5000),
  };

  const json = JSON.stringify(sanitized);

  await prisma.$queryRawUnsafe(
    `UPDATE pacientes SET recomendaciones = $1 WHERE id = $2 AND "dietistaId" = $3`,
    json,
    pacienteId,
    dietista.id
  );

  revalidatePath(`/pacientes/${pacienteId}`);
}
