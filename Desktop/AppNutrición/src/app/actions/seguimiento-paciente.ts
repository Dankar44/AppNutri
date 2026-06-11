"use server";

import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { revalidatePath } from "next/cache";
import {
  sanitizeStringOptional,
  validateNumber,
  validateNumberOptional,
} from "@/lib/validation";
import { getTranslations } from "next-intl/server";

function cuid(): string {
  const ts = Date.now().toString(36);
  const rand = randomUUID().replace(/-/g, "").slice(0, 16);
  return `c${ts}${rand}`;
}

// ─── Types ───

export interface ComidaSeguimiento {
  tipo: string; // DESAYUNO, MEDIA_MANANA, etc.
  alimentos: {
    nombre: string;
    cantidad: number;
    unidad?: string;
    cumplido: boolean;
  }[];
  horaReal: string | null;
  notas: string | null;
}

export interface SeguimientoPacienteDia {
  id: string;
  fecha: Date;
  cumplido: boolean;
  aguaML: number;
  ejercicio: boolean;
  ejercicioMinutos: number;
  ejercicioKcal: number;
  ejercicioTipo: string | null;
  ejercicioDistanciaKm: number;
  notas: string | null;
  comidasData: ComidaSeguimiento[] | null;
}

export interface GuardarSeguimientoData {
  aguaML?: number;
  ejercicio?: boolean;
  ejercicioMinutos?: number;
  ejercicioKcal?: number;
  ejercicioTipo?: string;
  ejercicioDistanciaKm?: number;
  notas?: string;
  comidasData?: ComidaSeguimiento[];
}

// ─── Comida del día desde el plan activo ───

export interface AlimentoPlanificado {
  nombre: string;
  cantidad: number;
  unidad: string;
}

export interface ComidaPlanificada {
  tipo: string;
  descripcion: string | null;
  alimentos: AlimentoPlanificado[];
}

const DIAS_SEMANA_MAP: Record<number, string> = {
  0: "DOMINGO",
  1: "LUNES",
  2: "MARTES",
  3: "MIERCOLES",
  4: "JUEVES",
  5: "VIERNES",
  6: "SABADO",
};

export async function getComidaDelDiaPaciente(
  fecha: string
): Promise<{ comidas: ComidaPlanificada[]; peso: number | null; ocultarCalorias: boolean }> {
  const session = await getCurrentPaciente();
  if (!session) return { comidas: [], peso: null, ocultarCalorias: false };

  const d = new Date(fecha + "T12:00:00");
  const diaSemana = DIAS_SEMANA_MAP[d.getDay()];

  const plan = await prisma.planAlimenticio.findFirst({
    where: { pacienteId: session.pacienteId, activo: true },
    orderBy: { createdAt: "desc" },
    include: {
      dias: {
        where: { dia: diaSemana as never },
        include: {
          comidas: {
            orderBy: { orden: "asc" },
            include: {
              alimentos: {
                orderBy: { orden: "asc" },
                include: {
                  alimento: { select: { nombre: true } },
                  receta: { select: { nombre: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  const paciente = await prisma.paciente.findUnique({
    where: { id: session.pacienteId },
    select: { peso: true, ocultarCalorias: true },
  });
  const ocultarCalorias = paciente?.ocultarCalorias ?? false;

  if (!plan || plan.dias.length === 0) {
    return { comidas: [], peso: paciente?.peso ?? null, ocultarCalorias };
  }

  const diaDelPlan = plan.dias[0];
  const comidas: ComidaPlanificada[] = diaDelPlan.comidas.map((c) => ({
    tipo: c.tipo,
    descripcion: c.descripcion,
    alimentos: c.alimentos.map((a) => ({
      nombre: a.nombrePersonalizado || a.alimento?.nombre || a.receta?.nombre || "Alimento",
      cantidad: a.cantidad,
      unidad: a.unidad,
    })),
  }));

  return { comidas, peso: paciente?.peso ?? null, ocultarCalorias };
}

// ─── Get seguimiento del día ───

export async function getSeguimientoPacienteDia(
  fecha: string
): Promise<SeguimientoPacienteDia | null> {
  const session = await getCurrentPaciente();
  if (!session) return null;

  const rows = await prisma.$queryRawUnsafe<SeguimientoPacienteDia[]>(
    `SELECT id, fecha, cumplido, "aguaML", ejercicio, "ejercicioMinutos",
            "ejercicioKcal", "ejercicioTipo", "ejercicioDistanciaKm", notas,
            "comidasData"
     FROM seguimiento_diario
     WHERE "pacienteId" = $1 AND fecha = $2::date`,
    session.pacienteId,
    fecha
  );

  return rows[0] ?? null;
}

// ─── Guardar seguimiento del día ───

export async function guardarSeguimientoPaciente(
  fecha: string,
  data: GuardarSeguimientoData
) {
  const t = await getTranslations("validation");
  const session = await getCurrentPaciente();
  if (!session) throw new Error(t("auth.noAutorizado"));

  // Validate
  const aguaML = validateNumber(data.aguaML ?? 0, 0, 10000);
  const ejercicio = data.ejercicio ?? false;
  const ejercicioMinutos = validateNumber(data.ejercicioMinutos ?? 0, 0, 1440);
  const ejercicioKcal = validateNumber(data.ejercicioKcal ?? 0, 0, 20000);
  const ejercicioTipo = sanitizeStringOptional(data.ejercicioTipo, 200);
  const ejercicioDistanciaKm = validateNumberOptional(
    data.ejercicioDistanciaKm,
    0,
    500
  ) ?? 0;
  const notas = sanitizeStringOptional(data.notas, 2000);

  // Sanitize comidas data
  const comidasData = data.comidasData
    ? JSON.stringify(
        data.comidasData.map((c) => ({
          tipo: String(c.tipo).slice(0, 50),
          alimentos: (c.alimentos || []).slice(0, 30).map((a) => ({
            nombre: String(a.nombre).slice(0, 200),
            cantidad: Number(a.cantidad) || 0,
            unidad: a.unidad ? String(a.unidad).slice(0, 20) : undefined,
            cumplido: Boolean(a.cumplido),
          })),
          horaReal: c.horaReal ? String(c.horaReal).slice(0, 10) : null,
          notas: c.notas ? String(c.notas).slice(0, 500) : null,
        }))
      )
    : null;

  // Check if comidasData column exists — if not, upsert without it
  // We compute cumplido from meal check data
  let cumplido = false;
  if (data.comidasData && data.comidasData.length > 0) {
    const totalAlimentos = data.comidasData.reduce(
      (sum, c) => sum + (c.alimentos?.length ?? 0),
      0
    );
    const cumplidos = data.comidasData.reduce(
      (sum, c) => sum + (c.alimentos?.filter((a) => a.cumplido).length ?? 0),
      0
    );
    cumplido = totalAlimentos > 0 && cumplidos / totalAlimentos >= 0.5;
  }

  try {
    await prisma.$queryRawUnsafe(
      `INSERT INTO seguimiento_diario
        (id, "pacienteId", fecha, cumplido, "aguaML", ejercicio, "ejercicioMinutos",
         "ejercicioKcal", "ejercicioTipo", "ejercicioDistanciaKm", notas, "comidasData",
         "createdAt", "updatedAt")
       VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("pacienteId", fecha)
       DO UPDATE SET
         cumplido = $4,
         "aguaML" = $5,
         ejercicio = $6,
         "ejercicioMinutos" = $7,
         "ejercicioKcal" = $8,
         "ejercicioTipo" = $9,
         "ejercicioDistanciaKm" = $10,
         notas = $11,
         "comidasData" = $12::jsonb,
         "updatedAt" = CURRENT_TIMESTAMP`,
      cuid(),
      session.pacienteId,
      fecha,
      cumplido,
      aguaML,
      ejercicio,
      ejercicioMinutos,
      ejercicioKcal,
      ejercicioTipo,
      ejercicioDistanciaKm,
      notas,
      comidasData
    );
  } catch {
    // Fallback: comidasData column might not exist yet, save without it
    await prisma.$queryRawUnsafe(
      `INSERT INTO seguimiento_diario
        (id, "pacienteId", fecha, cumplido, "aguaML", ejercicio, "ejercicioMinutos",
         "ejercicioKcal", "ejercicioTipo", "ejercicioDistanciaKm", notas,
         "createdAt", "updatedAt")
       VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11,
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT ("pacienteId", fecha)
       DO UPDATE SET
         cumplido = $4,
         "aguaML" = $5,
         ejercicio = $6,
         "ejercicioMinutos" = $7,
         "ejercicioKcal" = $8,
         "ejercicioTipo" = $9,
         "ejercicioDistanciaKm" = $10,
         notas = $11,
         "updatedAt" = CURRENT_TIMESTAMP`,
      cuid(),
      session.pacienteId,
      fecha,
      cumplido,
      aguaML,
      ejercicio,
      ejercicioMinutos,
      ejercicioKcal,
      ejercicioTipo,
      ejercicioDistanciaKm,
      notas
    );
  }

  revalidatePath("/paciente/portal/seguimiento");
}
