"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";

export type DiaLaboralKey =
  | "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO" | "DOMINGO";

export interface IntervaloHorario {
  inicio: string; // HH:MM
  fin: string;    // HH:MM
}

export interface DiaLaboral {
  dia: DiaLaboralKey;
  activo: boolean;
  intervalos: IntervaloHorario[];
}

export interface HorarioLaboral {
  dias: DiaLaboral[];
  duracionCitaDefault: number;
}

const DIAS_ORDEN: DiaLaboralKey[] = [
  "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO",
];

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function validarHora(h: unknown): string | null {
  if (typeof h !== "string") return null;
  return HORA_REGEX.test(h) ? h : null;
}

function horaAMinutos(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

function horarioVacio(): HorarioLaboral {
  return {
    dias: DIAS_ORDEN.map((dia) => ({
      dia,
      activo: dia !== "SABADO" && dia !== "DOMINGO",
      intervalos:
        dia === "SABADO" || dia === "DOMINGO"
          ? []
          : [{ inicio: "09:00", fin: "14:00" }, { inicio: "16:00", fin: "20:00" }],
    })),
    duracionCitaDefault: 30,
  };
}

export async function getHorarioLaboral(): Promise<HorarioLaboral> {
  const dietista = await getCurrentDietista();
  if (!dietista) return horarioVacio();

  const rows = await prisma.$queryRawUnsafe<
    Array<{ horarioLaboral: unknown; duracionCitaDefault: number | null }>
  >(
    `SELECT "horarioLaboral", "duracionCitaDefault"
     FROM dietistas WHERE id = $1 LIMIT 1`,
    dietista.id,
  );
  const row = rows[0];
  const duracion =
    row?.duracionCitaDefault && row.duracionCitaDefault > 0
      ? row.duracionCitaDefault
      : 30;

  const raw = row?.horarioLaboral as { dias?: DiaLaboral[] } | null | undefined;
  if (!raw || !Array.isArray(raw.dias)) {
    return { ...horarioVacio(), duracionCitaDefault: duracion };
  }

  const byDia = new Map<DiaLaboralKey, DiaLaboral>();
  for (const d of raw.dias) {
    if (!DIAS_ORDEN.includes(d.dia as DiaLaboralKey)) continue;
    const intervalos = Array.isArray(d.intervalos)
      ? d.intervalos
          .filter(
            (i) =>
              typeof i?.inicio === "string" &&
              typeof i?.fin === "string" &&
              HORA_REGEX.test(i.inicio) &&
              HORA_REGEX.test(i.fin),
          )
          .map((i) => ({ inicio: i.inicio, fin: i.fin }))
      : [];
    byDia.set(d.dia as DiaLaboralKey, {
      dia: d.dia as DiaLaboralKey,
      activo: Boolean(d.activo),
      intervalos,
    });
  }

  return {
    dias: DIAS_ORDEN.map(
      (dia) => byDia.get(dia) ?? { dia, activo: false, intervalos: [] },
    ),
    duracionCitaDefault: duracion,
  };
}

function sanitizarHorario(input: HorarioLaboral): HorarioLaboral {
  const duracion = Math.max(5, Math.min(480, Math.round(Number(input.duracionCitaDefault) || 30)));

  const diasSanitizados: DiaLaboral[] = DIAS_ORDEN.map((dia) => {
    const d = input.dias?.find((x) => x.dia === dia);
    if (!d || !d.activo) return { dia, activo: false, intervalos: [] };

    const intervalos: IntervaloHorario[] = [];
    for (const iv of d.intervalos ?? []) {
      const ini = validarHora(iv?.inicio);
      const fin = validarHora(iv?.fin);
      if (!ini || !fin) continue;
      if (horaAMinutos(fin) <= horaAMinutos(ini)) continue;
      intervalos.push({ inicio: ini, fin });
    }
    // ordenar y fusionar solapamientos
    intervalos.sort((a, b) => horaAMinutos(a.inicio) - horaAMinutos(b.inicio));
    const fusionados: IntervaloHorario[] = [];
    for (const iv of intervalos) {
      const last = fusionados[fusionados.length - 1];
      if (last && horaAMinutos(iv.inicio) <= horaAMinutos(last.fin)) {
        if (horaAMinutos(iv.fin) > horaAMinutos(last.fin)) last.fin = iv.fin;
      } else {
        fusionados.push({ ...iv });
      }
    }
    return {
      dia,
      activo: fusionados.length > 0,
      intervalos: fusionados,
    };
  });

  return { dias: diasSanitizados, duracionCitaDefault: duracion };
}

export async function guardarHorarioLaboral(data: HorarioLaboral) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const limpio = sanitizarHorario(data);

  await prisma.$executeRawUnsafe(
    `UPDATE dietistas
     SET "horarioLaboral" = $1::jsonb, "duracionCitaDefault" = $2
     WHERE id = $3`,
    JSON.stringify({ dias: limpio.dias }),
    limpio.duracionCitaDefault,
    dietista.id,
  );

  revalidatePath("/agenda");
  revalidatePath("/agenda/horario");
  return limpio;
}
