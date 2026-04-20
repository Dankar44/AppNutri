"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import {
  sanitizeString,
  sanitizeStringOptional,
  validateNumberOptional,
} from "@/lib/validation";

// ─── Types ───

export interface ComidaSeguimientoItem {
  tipo: string;
  alimentos: { nombre: string; cantidad: number; cumplido: boolean }[];
  horaReal: string | null;
  notas: string | null;
}

export interface SeguimientoDia {
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
  comidasData: ComidaSeguimientoItem[] | null;
}

export interface SeguimientoUpsertData {
  cumplido?: boolean;
  aguaML?: number;
  ejercicio?: boolean;
  ejercicioMinutos?: number;
  ejercicioKcal?: number;
  ejercicioTipo?: string;
  ejercicioDistanciaKm?: number;
  notas?: string;
}

export interface ActividadPaciente {
  id: string;
  fecha: Date;
  tipo: "diario" | "consulta" | "ejercicio" | "comida_cumplida" | "comida_cambios";
  titulo: string;
  descripcion: string | null;
  detalles: string[];
}

// ─── Helpers ───

async function verificarPaciente(pacienteId: string, dietistaId: string) {
  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId },
  });
  if (!paciente) throw new Error("Paciente no encontrado");
  return paciente;
}

// ─── Actions ───

export async function getSeguimientoMes(
  pacienteId: string,
  anio: number,
  mes: number
): Promise<SeguimientoDia[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  await verificarPaciente(pacienteId, dietista.id);

  // mes is 1-based (1=enero, 12=diciembre)
  const fechaInicio = `${anio}-${String(mes).padStart(2, "0")}-01`;
  // Last day: go to next month, subtract 1 day
  const nextMonth = mes === 12 ? 1 : mes + 1;
  const nextYear = mes === 12 ? anio + 1 : anio;
  const fechaFin = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

  return prisma.$queryRawUnsafe<SeguimientoDia[]>(
    `SELECT id, fecha, cumplido, "aguaML", ejercicio, "ejercicioMinutos",
            "ejercicioKcal", "ejercicioTipo", "ejercicioDistanciaKm", notas, "comidasData"
     FROM seguimiento_diario
     WHERE "pacienteId" = $1
       AND fecha >= $2::date
       AND fecha < $3::date
     ORDER BY fecha ASC`,
    pacienteId,
    fechaInicio,
    fechaFin
  );
}

export async function getSeguimientoDia(
  pacienteId: string,
  fecha: string
): Promise<SeguimientoDia | null> {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  await verificarPaciente(pacienteId, dietista.id);

  const rows = await prisma.$queryRawUnsafe<SeguimientoDia[]>(
    `SELECT id, fecha, cumplido, "aguaML", ejercicio, "ejercicioMinutos",
            "ejercicioKcal", "ejercicioTipo", "ejercicioDistanciaKm", notas, "comidasData"
     FROM seguimiento_diario
     WHERE "pacienteId" = $1 AND fecha = $2::date`,
    pacienteId,
    fecha
  );

  return rows[0] ?? null;
}

export async function upsertSeguimientoDia(
  pacienteId: string,
  fecha: string,
  data: SeguimientoUpsertData
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await verificarPaciente(pacienteId, dietista.id);

  // Validate & sanitize
  const cumplido = data.cumplido ?? false;
  const aguaML = validateNumberOptional(data.aguaML, 0, 10000) ?? 0;
  const ejercicio = data.ejercicio ?? false;
  const ejercicioMinutos = validateNumberOptional(data.ejercicioMinutos, 0, 1440) ?? 0;
  const ejercicioKcal = validateNumberOptional(data.ejercicioKcal, 0, 20000) ?? 0;
  const ejercicioTipo = sanitizeStringOptional(data.ejercicioTipo, 200);
  const ejercicioDistanciaKm = validateNumberOptional(data.ejercicioDistanciaKm, 0, 500) ?? 0;
  const notas = sanitizeStringOptional(data.notas, 2000);

  await prisma.$queryRawUnsafe(
    `INSERT INTO seguimiento_diario
      ("pacienteId", fecha, cumplido, "aguaML", ejercicio, "ejercicioMinutos",
       "ejercicioKcal", "ejercicioTipo", "ejercicioDistanciaKm", notas)
     VALUES ($1, $2::date, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT ("pacienteId", fecha)
     DO UPDATE SET
       cumplido = $3,
       "aguaML" = $4,
       ejercicio = $5,
       "ejercicioMinutos" = $6,
       "ejercicioKcal" = $7,
       "ejercicioTipo" = $8,
       "ejercicioDistanciaKm" = $9,
       notas = $10,
       "updatedAt" = CURRENT_TIMESTAMP`,
    pacienteId,
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

  revalidatePath(`/pacientes/${pacienteId}`);
}

export async function getActividadesPaciente(
  pacienteId: string,
  tipo?: string
): Promise<ActividadPaciente[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  await verificarPaciente(pacienteId, dietista.id);

  const tipoFilter = tipo ? sanitizeString(tipo, 20) : null;
  const actividades: ActividadPaciente[] = [];

  // 1. Entradas diario
  if (!tipoFilter || tipoFilter === "diario") {
    const diario = await prisma.$queryRawUnsafe<
      {
        id: string;
        fecha: Date;
        tipoComida: string;
        descripcion: string | null;
        notas: string | null;
        cantidad: number | null;
        unidad: string | null;
      }[]
    >(
      `SELECT id, fecha, "tipoComida", descripcion, notas, cantidad, unidad
       FROM entradas_diario
       WHERE "pacienteId" = $1
       ORDER BY fecha DESC
       LIMIT 20`,
      pacienteId
    );

    for (const e of diario) {
      const detalles: string[] = [];
      if (e.cantidad && e.unidad) detalles.push(`${e.cantidad} ${e.unidad}`);
      if (e.notas) detalles.push(e.notas);

      actividades.push({
        id: e.id,
        fecha: e.fecha,
        tipo: "diario",
        titulo: `Diario: ${e.tipoComida}`,
        descripcion: e.descripcion,
        detalles,
      });
    }
  }

  // 2. Consultas
  if (!tipoFilter || tipoFilter === "consulta") {
    const consultas = await prisma.$queryRawUnsafe<
      {
        id: string;
        fecha: Date;
        motivo: string | null;
        notas: string | null;
      }[]
    >(
      `SELECT id, fecha, motivo, notas
       FROM consultas
       WHERE "pacienteId" = $1
       ORDER BY fecha DESC
       LIMIT 20`,
      pacienteId
    );

    for (const c of consultas) {
      const detalles: string[] = [];
      if (c.notas) detalles.push(c.notas);

      actividades.push({
        id: c.id,
        fecha: c.fecha,
        tipo: "consulta",
        titulo: "Consulta",
        descripcion: c.motivo,
        detalles,
      });
    }
  }

  // 3. Ejercicio (from seguimiento_diario where ejercicio=true)
  if (!tipoFilter || tipoFilter === "ejercicio") {
    const ejercicios = await prisma.$queryRawUnsafe<
      {
        id: string;
        fecha: Date;
        ejercicioMinutos: number;
        ejercicioKcal: number;
        ejercicioTipo: string | null;
        ejercicioDistanciaKm: number;
        notas: string | null;
      }[]
    >(
      `SELECT id, fecha, "ejercicioMinutos", "ejercicioKcal", "ejercicioTipo",
              "ejercicioDistanciaKm", notas
       FROM seguimiento_diario
       WHERE "pacienteId" = $1 AND ejercicio = true
       ORDER BY fecha DESC
       LIMIT 20`,
      pacienteId
    );

    for (const ej of ejercicios) {
      const detalles: string[] = [];
      if (ej.ejercicioMinutos > 0) detalles.push(`${ej.ejercicioMinutos} min`);
      if (ej.ejercicioKcal > 0) detalles.push(`${ej.ejercicioKcal} kcal`);
      if (ej.ejercicioDistanciaKm > 0) detalles.push(`${ej.ejercicioDistanciaKm} km`);
      if (ej.notas) detalles.push(ej.notas);

      actividades.push({
        id: ej.id,
        fecha: ej.fecha,
        tipo: "ejercicio",
        titulo: ej.ejercicioTipo
          ? `Ejercicio: ${ej.ejercicioTipo}`
          : "Ejercicio",
        descripcion: null,
        detalles,
      });
    }
  }

  // 4. Comidas del seguimiento diario (from comidasData)
  if (!tipoFilter || tipoFilter === "diario") {
    const seguimientos = await prisma.$queryRawUnsafe<
      { id: string; fecha: Date; comidasData: unknown }[]
    >(
      `SELECT id, fecha, "comidasData"
       FROM seguimiento_diario
       WHERE "pacienteId" = $1 AND "comidasData" IS NOT NULL
       ORDER BY fecha DESC
       LIMIT 10`,
      pacienteId
    );

    const TIPO_LABELS: Record<string, string> = {
      DESAYUNO: "desayuno", MEDIA_MANANA: "media mañana", ALMUERZO: "comida",
      MERIENDA: "merienda", CENA: "cena", RECENA: "recena",
    };
    const HORAS: Record<string, string> = {
      DESAYUNO: "08:30", MEDIA_MANANA: "11:00", ALMUERZO: "14:00",
      MERIENDA: "17:00", CENA: "20:30", RECENA: "23:00",
    };

    for (const seg of seguimientos) {
      const comidas = seg.comidasData as Array<{
        tipo: string;
        horaReal?: string | null;
        alimentos?: Array<{ nombre: string; cantidad: number; cumplido: boolean }>;
      }>;
      if (!Array.isArray(comidas)) continue;

      const fechaStr = seg.fecha instanceof Date
        ? `${String(seg.fecha.getUTCDate()).padStart(2, "0")} de ${["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][seg.fecha.getUTCMonth()]} de ${seg.fecha.getUTCFullYear()}`
        : String(seg.fecha).slice(0, 10);

      for (const comida of comidas) {
        if (!comida.alimentos || comida.alimentos.length === 0) continue;

        const allDone = comida.alimentos.every((a) => a.cumplido);
        const someDone = comida.alimentos.some((a) => a.cumplido);
        if (!someDone && !allDone) continue; // Skip if nothing done

        const hora = comida.horaReal || HORAS[comida.tipo] || "";
        const mealLabel = TIPO_LABELS[comida.tipo] || comida.tipo.toLowerCase();

        if (allDone) {
          actividades.push({
            id: `${seg.id}-${comida.tipo}-done`,
            fecha: seg.fecha,
            tipo: "comida_cumplida",
            titulo: `Cumplió la ${mealLabel} del día ${fechaStr} a las ${hora}.`,
            descripcion: null,
            detalles: [],
          });
        } else {
          // Partial — some done, some not
          const detalles: string[] = [];
          for (const a of comida.alimentos) {
            if (a.cumplido) {
              detalles.push(`✅ ${a.nombre} (${a.cantidad} g)`);
            } else {
              detalles.push(`❌ ~~${a.nombre} (${a.cantidad} g)~~`);
            }
          }
          actividades.push({
            id: `${seg.id}-${comida.tipo}-partial`,
            fecha: seg.fecha,
            tipo: "comida_cambios",
            titulo: `Hizo cambios en la ${mealLabel} del día ${fechaStr} a las ${hora}.`,
            descripcion: null,
            detalles,
          });
        }
      }
    }
  }

  // Sort all by fecha DESC and limit to 20
  actividades.sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
  return actividades.slice(0, 20);
}

// Calcula macros+micros reales de un día basándose en comidasData
export async function calcularMacrosDia(pacienteId: string, fecha: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;
  await verificarPaciente(pacienteId, dietista.id);

  const rows = await prisma.$queryRawUnsafe<{ comidasData: unknown }[]>(
    `SELECT "comidasData" FROM seguimiento_diario WHERE "pacienteId" = $1 AND fecha = $2::date`,
    pacienteId, fecha
  );
  const comidasData = rows[0]?.comidasData as Array<{ tipo: string; alimentos?: Array<{ nombre: string; cantidad: number; cumplido: boolean }> }> | null;
  if (!comidasData) return { macros: { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 }, micro: {} as Record<string, number> };

  // Collect all food names that are cumplido
  const foodsToCalc: { nombre: string; cantidad: number }[] = [];
  for (const c of comidasData) {
    for (const a of (c.alimentos || [])) {
      if (a.cumplido) foodsToCalc.push({ nombre: a.nombre, cantidad: a.cantidad });
    }
  }
  if (foodsToCalc.length === 0) return { macros: { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 }, micro: {} as Record<string, number> };

  // Fetch nutrition data for these foods
  const names = [...new Set(foodsToCalc.map(f => f.nombre))];
  const placeholders = names.map((_, i) => `$${i + 1}`).join(",");
  const dbFoods = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT nombre, calorias, proteinas, carbohidratos, grasas, fibra,
            "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD","vitaminaE","vitaminaK",
            tiamina,riboflavina,niacina,folato,"acidoPantotenico",colina,
            calcio,hierro,magnesio,fosforo,potasio,sodio,cinc,cobre,manganeso,selenio,fluor
     FROM alimentos WHERE nombre IN (${placeholders}) LIMIT ${names.length}`,
    ...names
  );

  const foodMap = new Map<string, Record<string, unknown>>();
  for (const f of dbFoods) foodMap.set(f.nombre as string, f);

  let cal = 0, prot = 0, carb = 0, gras = 0, fib = 0;
  const microKeys = ["vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD","vitaminaE","vitaminaK","tiamina","riboflavina","niacina","folato","acidoPantotenico","colina","calcio","hierro","magnesio","fosforo","potasio","sodio","cinc","cobre","manganeso","selenio","fluor"];
  const micro: Record<string, number> = {};
  for (const k of microKeys) micro[k] = 0;

  for (const item of foodsToCalc) {
    const food = foodMap.get(item.nombre);
    if (!food) continue;
    const factor = item.cantidad / 100;
    cal += ((food.calorias as number) || 0) * factor;
    prot += ((food.proteinas as number) || 0) * factor;
    carb += ((food.carbohidratos as number) || 0) * factor;
    gras += ((food.grasas as number) || 0) * factor;
    fib += ((food.fibra as number) || 0) * factor;
    for (const k of microKeys) {
      micro[k] += ((food[k] as number) || 0) * factor;
    }
  }

  // Round
  for (const k of microKeys) micro[k] = Math.round(micro[k] * 10) / 10;

  return {
    macros: {
      calorias: Math.round(cal * 10) / 10,
      proteinas: Math.round(prot * 10) / 10,
      carbohidratos: Math.round(carb * 10) / 10,
      grasas: Math.round(gras * 10) / 10,
      fibra: Math.round(fib * 10) / 10,
    },
    micro,
  };
}
