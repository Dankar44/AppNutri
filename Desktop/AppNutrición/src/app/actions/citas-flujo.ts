"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { revalidatePath } from "next/cache";
import { fromMadrid, toMadridTimeStr, toMadridDateStr } from "@/lib/tz";
import { syncCitaAmbos, unsyncCitaAntesDeBorrar } from "@/lib/google-sync";

// ─── Tipos auxiliares ─────────────────────────────────────────────

export type SlotLibre = {
  fechaHora: string;  // ISO UTC (para enviar al backend al solicitar)
  fechaLocal: string; // "YYYY-MM-DD" en zona Europe/Madrid (para agrupar por día en UI)
  horaLocal: string;  // "HH:MM" en zona Europe/Madrid (para mostrar al usuario)
  duracion: number;   // minutos
};

export type CitaPortalPaciente = {
  id: string;
  fechaHora: string;
  duracion: number;
  estado: string;
  motivo: string | null;
  notas: string | null;
  origen: "DIETISTA" | "PACIENTE";
  propuestoPor: "DIETISTA" | "PACIENTE";
  citaOriginalId: string | null;
  googleMeetLink: string | null;
  dietista: { nombre: string; apellidos: string };
};

type HorarioLaboralDia = {
  dia: string;
  activo: boolean;
  intervalos: { inicio: string; fin: string }[];
};

type HorarioLaboralRaw = {
  dias?: HorarioLaboralDia[];
  duracionCitaDefault?: number;
};

const DIAS_EN = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DIAS_ES: Record<string, string> = {
  SUNDAY: "DOMINGO", MONDAY: "LUNES", TUESDAY: "MARTES",
  WEDNESDAY: "MIERCOLES", THURSDAY: "JUEVES", FRIDAY: "VIERNES", SATURDAY: "SABADO",
};

// ─── Helpers internos ─────────────────────────────────────────────

async function getPacienteConDietista(pacienteId: string) {
  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      fotoUrl: true,
      dietistaId: true,
      dietista: { select: { id: true, nombre: true, apellidos: true } },
    },
  });
  return paciente;
}

async function getHorarioLaboralDietista(dietistaId: string): Promise<HorarioLaboralRaw | null> {
  const rows = await prisma.$queryRawUnsafe<{ horarioLaboral: unknown; duracionCitaDefault: number | null }[]>(
    `SELECT "horarioLaboral", "duracionCitaDefault" FROM dietistas WHERE id = $1 LIMIT 1`,
    dietistaId,
  );
  const row = rows[0];
  if (!row || !row.horarioLaboral) return null;
  return {
    ...(row.horarioLaboral as Record<string, unknown>),
    duracionCitaDefault: row.duracionCitaDefault ?? 30,
  } as HorarioLaboralRaw;
}

/**
 * Genera los slots del día. Usa `fromMadrid` para que los slots
 * representen HH:MM en Europa/Madrid, independiente del TZ del server.
 */
function generarSlotsDelDia(
  anyo: number,
  mes0: number,
  dia: number,
  intervalos: { inicio: string; fin: string }[],
  duracionSlot: number,
): Date[] {
  const slots: Date[] = [];
  for (const iv of intervalos) {
    const [hi, mi] = iv.inicio.split(":").map(Number);
    const [hf, mf] = iv.fin.split(":").map(Number);
    const inicio = fromMadrid(anyo, mes0, dia, hi, mi);
    const fin = fromMadrid(anyo, mes0, dia, hf, mf);
    let t = inicio.getTime();
    while (t + duracionSlot * 60 * 1000 <= fin.getTime()) {
      slots.push(new Date(t));
      t += duracionSlot * 60 * 1000;
    }
  }
  return slots;
}

// ─── PARA EL PACIENTE (portal) ─────────────────────────────────────

/**
 * Devuelve los huecos libres del nutri del paciente entre dos fechas.
 * Filtra: solo días activos del horario laboral, descarta slots que ya tienen cita,
 * y descarta slots en el pasado.
 */
export async function getHuecosLibresDelNutri(
  desdeISO: string,
  hastaISO: string,
): Promise<SlotLibre[]> {
  const session = await getCurrentPaciente();
  if (!session) return [];

  const paciente = await getPacienteConDietista(session.pacienteId);
  if (!paciente?.dietistaId) return [];

  const horario = await getHorarioLaboralDietista(paciente.dietistaId);
  if (!horario?.dias) return [];

  const duracion = horario.duracionCitaDefault ?? 30;
  const desde = new Date(desdeISO);
  const hasta = new Date(hastaISO);
  const ahora = new Date();

  // Citas existentes del nutri en el rango (de todos sus pacientes) que bloquean el slot
  const citasOcupadas = await prisma.cita.findMany({
    where: {
      dietistaId: paciente.dietistaId,
      fechaHora: { gte: desde, lte: hasta },
      estado: { in: ["PENDIENTE", "CONFIRMADA", "CONTRAPROPUESTA"] },
    },
    select: { fechaHora: true, duracion: true },
  });
  const ocupados = citasOcupadas.map((c) => ({
    start: c.fechaHora.getTime(),
    end: c.fechaHora.getTime() + c.duracion * 60 * 1000,
  }));

  const diasActivosMap = new Map<string, HorarioLaboralDia>();
  for (const d of horario.dias) {
    if (d.activo) diasActivosMap.set(d.dia, d);
  }

  const WEEKDAY_TO_ES: Record<string, string> = {
    MONDAY: "LUNES", TUESDAY: "MARTES", WEDNESDAY: "MIERCOLES",
    THURSDAY: "JUEVES", FRIDAY: "VIERNES", SATURDAY: "SABADO", SUNDAY: "DOMINGO",
  };
  const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Europe/Madrid" });

  const slots: SlotLibre[] = [];
  // Iterar día a día en zona Europa/Madrid
  for (let t = new Date(desde); t <= hasta; t.setDate(t.getDate() + 1)) {
    const fechaMadrid = toMadridDateStr(t); // "YYYY-MM-DD" en Madrid
    const [anyo, mes, dia] = fechaMadrid.split("-").map(Number);
    const diaKey = WEEKDAY_TO_ES[weekdayFmt.format(t).toUpperCase()];
    const diaInfo = diasActivosMap.get(diaKey);
    if (!diaInfo) continue;

    const hoySlots = generarSlotsDelDia(anyo, mes - 1, dia, diaInfo.intervalos, duracion);
    for (const s of hoySlots) {
      if (s < ahora) continue;
      const sStart = s.getTime();
      const sEnd = sStart + duracion * 60 * 1000;
      const pisa = ocupados.some((o) => sStart < o.end && sEnd > o.start);
      if (pisa) continue;
      slots.push({
        fechaHora: s.toISOString(),
        fechaLocal: toMadridDateStr(s),
        horaLocal: toMadridTimeStr(s),
        duracion,
      });
    }
  }

  return slots;
}

// ─── Vista semanal de disponibilidad (calendario visual) ──────────

export type SlotOcupado = {
  horaInicio: string; // "HH:MM" en Madrid
  horaFin: string; // "HH:MM" en Madrid
};

export type DiaDisponibilidad = {
  /** "LUNES" | "MARTES" | ... */
  dia: string;
  /** "YYYY-MM-DD" en Madrid */
  fechaLocal: string;
  /** Si el dietista trabaja ese día */
  activo: boolean;
  /** Intervalos del horario laboral (HH:MM - HH:MM) */
  intervalos: { inicio: string; fin: string }[];
  /** Citas existentes del dietista que ocupan ese día (horas Madrid) */
  ocupados: SlotOcupado[];
  /** Huecos solicitables por el paciente */
  libres: { fechaHora: string; horaLocal: string; horaFin: string }[];
};

export type DisponibilidadSemanal = {
  /** Lunes ISO YYYY-MM-DD en Madrid */
  lunesFecha: string;
  /** 7 días ordenados de lunes a domingo */
  dias: DiaDisponibilidad[];
  /** Duración default de cita en minutos */
  duracion: number;
  dietistaNombre: string;
  /** Rango horario para pintar el grid (mín-máx de intervalos). */
  rangoHoras: { inicio: number; fin: number };
};

function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m || 0);
}

function minutesToHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Devuelve la disponibilidad de la semana que contiene `lunesISO` (formato
 * YYYY-MM-DD en Madrid, debe ser lunes). 7 días de datos con: horario
 * laboral, citas ocupadas, huecos libres solicitables.
 */
export async function getDisponibilidadSemanaPaciente(
  lunesISO: string,
): Promise<DisponibilidadSemanal | null> {
  const session = await getCurrentPaciente();
  if (!session) return null;

  const paciente = await getPacienteConDietista(session.pacienteId);
  if (!paciente?.dietistaId) return null;

  const horario = await getHorarioLaboralDietista(paciente.dietistaId);
  if (!horario?.dias) return null;

  const duracion = horario.duracionCitaDefault ?? 30;
  const dietistaNombre = paciente.dietista
    ? `${paciente.dietista.nombre} ${paciente.dietista.apellidos}`
    : "Tu nutricionista";

  const [anyoLunes, mesLunes, diaLunes] = lunesISO.split("-").map(Number);
  // Lunes 00:00 Madrid
  const lunesDate = fromMadrid(anyoLunes, mesLunes - 1, diaLunes, 0, 0);
  // Domingo 23:59
  const domingoFinMs = lunesDate.getTime() + 7 * 24 * 60 * 60 * 1000 - 1;
  const domingoFin = new Date(domingoFinMs);

  // Citas ocupadas en la semana
  const citasOcupadas = await prisma.cita.findMany({
    where: {
      dietistaId: paciente.dietistaId,
      fechaHora: { gte: lunesDate, lte: domingoFin },
      estado: { in: ["PENDIENTE", "CONFIRMADA", "CONTRAPROPUESTA"] },
    },
    select: { fechaHora: true, duracion: true },
  });

  const diasActivosMap = new Map<string, HorarioLaboralDia>();
  for (const d of horario.dias) {
    if (d.activo) diasActivosMap.set(d.dia, d);
  }

  const DIAS_ORDEN_ES = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;
  const ahora = new Date();

  // Calcular rango horario (min/max en minutos) entre todos los intervalos
  let minIntervalo = 24 * 60;
  let maxIntervalo = 0;
  for (const d of horario.dias) {
    if (!d.activo) continue;
    for (const iv of d.intervalos) {
      const ini = hhmmToMinutes(iv.inicio);
      const fin = hhmmToMinutes(iv.fin);
      if (ini < minIntervalo) minIntervalo = ini;
      if (fin > maxIntervalo) maxIntervalo = fin;
    }
  }
  if (minIntervalo >= maxIntervalo) {
    minIntervalo = 9 * 60;
    maxIntervalo = 20 * 60;
  }
  // Redondear a hora entera para el grid, con margen mínimo 07:00-21:00
  const rangoInicioHora = Math.min(Math.floor(minIntervalo / 60), 7);
  const rangoFinHora = Math.max(Math.ceil(maxIntervalo / 60), 21);

  const dias: DiaDisponibilidad[] = [];
  for (let idx = 0; idx < 7; idx++) {
    const thisDateMs = lunesDate.getTime() + idx * 24 * 60 * 60 * 1000;
    const thisDate = new Date(thisDateMs);
    const fechaLocal = toMadridDateStr(thisDate);
    const [y, m, d] = fechaLocal.split("-").map(Number);
    const diaKey = DIAS_ORDEN_ES[idx];
    const diaInfo = diasActivosMap.get(diaKey);
    const activo = !!diaInfo;
    const intervalos = diaInfo ? diaInfo.intervalos : [];

    // Citas ocupadas en este día
    const inicioDia = fromMadrid(y, m - 1, d, 0, 0);
    const finDia = new Date(inicioDia.getTime() + 24 * 60 * 60 * 1000 - 1);
    const ocupados: SlotOcupado[] = citasOcupadas
      .filter((c) => c.fechaHora >= inicioDia && c.fechaHora <= finDia)
      .map((c) => {
        const inicio = toMadridTimeStr(c.fechaHora);
        const inicioMin = hhmmToMinutes(inicio);
        const finMin = inicioMin + c.duracion;
        return { horaInicio: inicio, horaFin: minutesToHHMM(finMin) };
      });

    // Slots libres (solicitables)
    const libres: { fechaHora: string; horaLocal: string; horaFin: string }[] = [];
    if (diaInfo) {
      const hoySlots = generarSlotsDelDia(y, m - 1, d, diaInfo.intervalos, duracion);
      for (const s of hoySlots) {
        if (s < ahora) continue;
        const sStart = s.getTime();
        const sEnd = sStart + duracion * 60 * 1000;
        const pisa = citasOcupadas.some(
          (o) =>
            sStart < o.fechaHora.getTime() + o.duracion * 60 * 1000 &&
            sEnd > o.fechaHora.getTime(),
        );
        if (pisa) continue;
        const horaLocal = toMadridTimeStr(s);
        const horaFinMin = hhmmToMinutes(horaLocal) + duracion;
        libres.push({
          fechaHora: s.toISOString(),
          horaLocal,
          horaFin: minutesToHHMM(horaFinMin),
        });
      }
    }

    dias.push({
      dia: diaKey,
      fechaLocal,
      activo,
      intervalos,
      ocupados,
      libres,
    });
  }

  return {
    lunesFecha: lunesISO,
    dias,
    duracion,
    dietistaNombre,
    rangoHoras: { inicio: rangoInicioHora, fin: rangoFinHora },
  };
}

/**
 * El paciente solicita una cita en un slot libre. La cita queda PENDIENTE con origen=PACIENTE.
 * Se genera una notificación al nutri.
 */
export async function solicitarCitaPaciente(fechaHoraISO: string, motivo?: string): Promise<{ id: string }> {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  const paciente = await getPacienteConDietista(session.pacienteId);
  if (!paciente?.dietistaId) throw new Error("Paciente sin nutricionista asignado");

  const fechaHora = new Date(fechaHoraISO);
  if (isNaN(fechaHora.getTime())) throw new Error("Fecha inválida");
  if (fechaHora < new Date()) throw new Error("La fecha no puede ser pasada");

  // Obtener duración del horario
  const horario = await getHorarioLaboralDietista(paciente.dietistaId);
  const duracion = horario?.duracionCitaDefault ?? 30;

  // Validar que el slot no está pisado
  const fin = new Date(fechaHora.getTime() + duracion * 60 * 1000);
  const solapa = await prisma.cita.findFirst({
    where: {
      dietistaId: paciente.dietistaId,
      estado: { in: ["PENDIENTE", "CONFIRMADA", "CONTRAPROPUESTA"] },
      fechaHora: { lt: fin },
    },
    select: { id: true, fechaHora: true, duracion: true },
  });
  if (solapa) {
    const solapaFin = new Date(solapa.fechaHora.getTime() + solapa.duracion * 60 * 1000);
    if (fechaHora < solapaFin && fin > solapa.fechaHora) {
      throw new Error("Ese horario ya está ocupado. Elige otro hueco.");
    }
  }

  const cita = await prisma.cita.create({
    data: {
      pacienteId: paciente.id,
      dietistaId: paciente.dietistaId,
      fechaHora,
      duracion,
      motivo: motivo?.trim().slice(0, 500) || null,
      estado: "PENDIENTE",
      origen: "PACIENTE",
      propuestoPor: "PACIENTE",
    },
    select: { id: true },
  });

  // Notificar al nutri
  await prisma.notificacion.create({
    data: {
      dietistaId: paciente.dietistaId,
      pacienteId: paciente.id,
      citaId: cita.id,
      tipo: "CITA_SOLICITADA",
      titulo: "Nueva solicitud de cita",
      mensaje: `${paciente.nombre} ${paciente.apellidos} te ha solicitado cita para ${formatFechaHora(fechaHora)}`,
      enlace: `/agenda?cita=${cita.id}`,
    },
  });

  void syncCitaAmbos(cita.id);
  revalidatePath("/paciente/portal/citas");
  revalidatePath("/agenda");
  return cita;
}

/** Lista todas las citas del paciente (todas, ordenadas por fecha descendente). */
export async function getCitasPaciente(): Promise<CitaPortalPaciente[]> {
  const session = await getCurrentPaciente();
  if (!session) return [];

  const citas = await prisma.cita.findMany({
    where: { pacienteId: session.pacienteId },
    orderBy: { fechaHora: "desc" },
    include: {
      dietista: { select: { nombre: true, apellidos: true } },
    },
  });

  return citas.map((c) => ({
    id: c.id,
    fechaHora: c.fechaHora.toISOString(),
    duracion: c.duracion,
    estado: c.estado,
    motivo: c.motivo,
    notas: c.notas,
    origen: c.origen,
    propuestoPor: c.propuestoPor,
    citaOriginalId: c.citaOriginalId,
    googleMeetLink: c.googleMeetLink,
    dietista: c.dietista,
  }));
}

/** Paciente acepta la contrapropuesta del nutri. Confirma la cita contrapropuesta. */
export async function aceptarContrapropuestaPaciente(citaId: string): Promise<void> {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    select: { pacienteId: true, dietistaId: true, estado: true, fechaHora: true, paciente: { select: { nombre: true, apellidos: true } } },
  });
  if (!cita || cita.pacienteId !== session.pacienteId) throw new Error("No autorizado");
  if (cita.estado !== "CONTRAPROPUESTA") throw new Error("Esta cita no es una contrapropuesta");

  await prisma.cita.update({
    where: { id: citaId },
    data: { estado: "CONFIRMADA" },
  });

  // Notificar al nutri
  await prisma.notificacion.create({
    data: {
      dietistaId: cita.dietistaId,
      pacienteId: cita.pacienteId,
      citaId,
      tipo: "CITA_CONFIRMADA",
      titulo: "Cita confirmada",
      mensaje: `${cita.paciente.nombre} ${cita.paciente.apellidos} ha aceptado tu propuesta para ${formatFechaHora(cita.fechaHora)}`,
      enlace: `/agenda?cita=${citaId}`,
    },
  });

  void syncCitaAmbos(citaId);
  revalidatePath("/paciente/portal/citas");
  revalidatePath("/agenda");
}

/** Paciente rechaza la contrapropuesta del nutri. */
export async function rechazarContrapropuestaPaciente(citaId: string): Promise<void> {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    select: { pacienteId: true, dietistaId: true, estado: true, fechaHora: true, paciente: { select: { nombre: true, apellidos: true } } },
  });
  if (!cita || cita.pacienteId !== session.pacienteId) throw new Error("No autorizado");
  if (cita.estado !== "CONTRAPROPUESTA") throw new Error("Esta cita no es una contrapropuesta");

  await prisma.cita.update({
    where: { id: citaId },
    data: { estado: "CANCELADA" },
  });

  await prisma.notificacion.create({
    data: {
      dietistaId: cita.dietistaId,
      pacienteId: cita.pacienteId,
      citaId,
      tipo: "CITA_CANCELADA_POR_PACIENTE",
      titulo: "Contrapropuesta rechazada",
      mensaje: `${cita.paciente.nombre} ${cita.paciente.apellidos} ha rechazado tu propuesta para ${formatFechaHora(cita.fechaHora)}`,
      enlace: `/agenda`,
    },
  });

  void syncCitaAmbos(citaId);
  revalidatePath("/paciente/portal/citas");
  revalidatePath("/agenda");
}

/** Paciente cancela una cita suya (PENDIENTE o CONFIRMADA). */
export async function cancelarCitaPaciente(citaId: string): Promise<void> {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    select: { pacienteId: true, dietistaId: true, estado: true, fechaHora: true, paciente: { select: { nombre: true, apellidos: true } } },
  });
  if (!cita || cita.pacienteId !== session.pacienteId) throw new Error("No autorizado");
  if (cita.estado === "CANCELADA" || cita.estado === "COMPLETADA") {
    throw new Error("Esta cita ya no se puede cancelar");
  }

  await prisma.cita.update({
    where: { id: citaId },
    data: { estado: "CANCELADA" },
  });

  await prisma.notificacion.create({
    data: {
      dietistaId: cita.dietistaId,
      pacienteId: cita.pacienteId,
      citaId,
      tipo: "CITA_CANCELADA_POR_PACIENTE",
      titulo: "Cita cancelada por el paciente",
      mensaje: `${cita.paciente.nombre} ${cita.paciente.apellidos} ha cancelado su cita del ${formatFechaHora(cita.fechaHora)}`,
      enlace: `/agenda`,
    },
  });

  void syncCitaAmbos(citaId);
  revalidatePath("/paciente/portal/citas");
  revalidatePath("/agenda");
}

// ─── PROPUESTAS del NUTRI al PACIENTE (el paciente responde desde su portal) ──

/** Paciente acepta una cita propuesta por el nutri → CONFIRMADA. */
export async function aceptarPropuestaDietista(citaId: string): Promise<void> {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    select: {
      pacienteId: true, dietistaId: true, estado: true, origen: true, fechaHora: true,
      paciente: { select: { nombre: true, apellidos: true } },
    },
  });
  if (!cita || cita.pacienteId !== session.pacienteId) throw new Error("No autorizado");
  if (cita.origen !== "DIETISTA" || cita.estado !== "PENDIENTE") {
    throw new Error("Esta cita no es una propuesta del nutricionista");
  }

  await prisma.cita.update({
    where: { id: citaId },
    data: { estado: "CONFIRMADA" },
  });

  await prisma.notificacion.create({
    data: {
      dietistaId: cita.dietistaId,
      pacienteId: cita.pacienteId,
      citaId,
      tipo: "CITA_CONFIRMADA",
      titulo: "Cita confirmada",
      mensaje: `${cita.paciente.nombre} ${cita.paciente.apellidos} ha aceptado la cita del ${formatFechaHora(cita.fechaHora)}`,
      enlace: `/agenda?cita=${citaId}`,
    },
  });

  void syncCitaAmbos(citaId);
  revalidatePath("/paciente/portal/citas");
  revalidatePath("/agenda");
}

/** Paciente rechaza una cita propuesta por el nutri → CANCELADA. */
export async function rechazarPropuestaDietista(citaId: string, motivoRechazo?: string): Promise<void> {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    select: {
      pacienteId: true, dietistaId: true, estado: true, origen: true, fechaHora: true,
      paciente: { select: { nombre: true, apellidos: true } },
    },
  });
  if (!cita || cita.pacienteId !== session.pacienteId) throw new Error("No autorizado");
  if (cita.origen !== "DIETISTA" || cita.estado !== "PENDIENTE") {
    throw new Error("Esta cita no es una propuesta del nutricionista");
  }

  await prisma.cita.update({
    where: { id: citaId },
    data: {
      estado: "CANCELADA",
      notas: motivoRechazo?.trim().slice(0, 500) || null,
    },
  });

  await prisma.notificacion.create({
    data: {
      dietistaId: cita.dietistaId,
      pacienteId: cita.pacienteId,
      citaId,
      tipo: "CITA_RECHAZADA",
      titulo: "El paciente ha rechazado la cita",
      mensaje:
        `${cita.paciente.nombre} ${cita.paciente.apellidos} ha rechazado la cita del ${formatFechaHora(cita.fechaHora)}` +
        (motivoRechazo ? `. Motivo: ${motivoRechazo}` : "."),
      enlace: "/agenda",
    },
  });

  void syncCitaAmbos(citaId);
  revalidatePath("/paciente/portal/citas");
  revalidatePath("/agenda");
}

/**
 * Paciente contrapropone otra fecha para una cita propuesta por el nutri.
 * Crea una nueva cita CONTRAPROPUESTA enlazada a la original (que queda PENDIENTE).
 */
export async function contraproponerPorPaciente(
  citaOriginalId: string,
  nuevaFechaHoraISO: string,
  motivo?: string,
): Promise<{ id: string }> {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  const original = await prisma.cita.findUnique({
    where: { id: citaOriginalId },
    select: {
      pacienteId: true, dietistaId: true, estado: true, origen: true, propuestoPor: true, motivo: true, fechaHora: true, duracion: true,
      paciente: { select: { nombre: true, apellidos: true } },
    },
  });
  if (!original || original.pacienteId !== session.pacienteId) throw new Error("No autorizado");
  // El paciente puede contraponer si:
  //  - La cita es PENDIENTE con origen DIETISTA (propuesta directa del nutri), O
  //  - La cita es CONTRAPROPUESTA con propuestoPor DIETISTA (el nutri contrapone algo que el paciente había pedido)
  const esPropuestaNutri = original.origen === "DIETISTA" && original.estado === "PENDIENTE";
  const esContrapropuestaNutri = original.estado === "CONTRAPROPUESTA" && original.propuestoPor === "DIETISTA";
  if (!esPropuestaNutri && !esContrapropuestaNutri) {
    throw new Error("Esta cita no permite contrapropuesta del paciente");
  }

  const nuevaFechaHora = new Date(nuevaFechaHoraISO);
  if (isNaN(nuevaFechaHora.getTime())) throw new Error("Fecha inválida");
  if (nuevaFechaHora < new Date()) throw new Error("La fecha no puede ser pasada");

  // Validar que el slot no está pisado
  const fin = new Date(nuevaFechaHora.getTime() + original.duracion * 60 * 1000);
  const solapa = await prisma.cita.findFirst({
    where: {
      dietistaId: original.dietistaId,
      id: { not: citaOriginalId },
      estado: { in: ["CONFIRMADA", "CONTRAPROPUESTA"] },
      fechaHora: { lt: fin },
    },
    select: { fechaHora: true, duracion: true },
  });
  if (solapa) {
    const solapaFin = new Date(solapa.fechaHora.getTime() + solapa.duracion * 60 * 1000);
    if (nuevaFechaHora < solapaFin && fin > solapa.fechaHora) {
      throw new Error("Ese horario ya está ocupado por otra cita");
    }
  }

  // Borrar evento de Google antes de eliminar la cita original
  await unsyncCitaAntesDeBorrar(citaOriginalId);

  // Transacción: eliminar la cita anterior + crear la contrapropuesta.
  // Eliminamos físicamente para que el historial y el calendario solo muestren
  // la versión más reciente activa (sin basura de canceladas intermedias).
  const [, contrapropuesta] = await prisma.$transaction([
    prisma.cita.delete({ where: { id: citaOriginalId } }),
    prisma.cita.create({
      data: {
        pacienteId: original.pacienteId,
        dietistaId: original.dietistaId,
        fechaHora: nuevaFechaHora,
        duracion: original.duracion,
        motivo: motivo?.trim().slice(0, 500) || original.motivo,
        estado: "CONTRAPROPUESTA",
        origen: original.origen,
        propuestoPor: "PACIENTE",
        citaOriginalId: null,
      },
      select: { id: true },
    }),
  ]);

  await prisma.notificacion.create({
    data: {
      dietistaId: original.dietistaId,
      pacienteId: original.pacienteId,
      citaId: contrapropuesta.id,
      tipo: "CITA_CONTRAPROPUESTA",
      titulo: "El paciente propone otra fecha",
      mensaje: `${original.paciente.nombre} ${original.paciente.apellidos} propone el ${formatFechaHora(nuevaFechaHora)} en vez del ${formatFechaHora(original.fechaHora)}`,
      enlace: `/agenda?cita=${contrapropuesta.id}`,
    },
  });

  void syncCitaAmbos(contrapropuesta.id);
  revalidatePath("/paciente/portal/citas");
  revalidatePath("/agenda");
  return contrapropuesta;
}

/** Nutri acepta la contrapropuesta del paciente → confirma la contrapropuesta y cancela la original. */
export async function aceptarContrapropuestaDietista(citaId: string): Promise<void> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const cita = await prisma.cita.findUnique({
    where: { id: citaId, dietistaId: dietista.id },
    select: { estado: true, pacienteId: true, propuestoPor: true, fechaHora: true },
  });
  if (!cita) throw new Error("Cita no encontrada");
  if (cita.estado !== "CONTRAPROPUESTA" || cita.propuestoPor !== "PACIENTE") {
    throw new Error("Esta cita no es una contrapropuesta del paciente");
  }

  await prisma.cita.update({
    where: { id: citaId },
    data: { estado: "CONFIRMADA" },
  });

  await prisma.notificacion.create({
    data: {
      pacienteId: cita.pacienteId,
      citaId,
      tipo: "CITA_CONFIRMADA",
      titulo: "Cita confirmada",
      mensaje: `${dietista.nombre} ${dietista.apellidos} ha aceptado tu propuesta para ${formatFechaHora(cita.fechaHora)}`,
      enlace: "/paciente/portal/citas",
    },
  });

  void syncCitaAmbos(citaId);
  revalidatePath("/agenda");
  revalidatePath("/paciente/portal/citas");
}

/** Nutri rechaza la contrapropuesta del paciente. */
export async function rechazarContrapropuestaDietista(citaId: string): Promise<void> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const cita = await prisma.cita.findUnique({
    where: { id: citaId, dietistaId: dietista.id },
    select: { estado: true, pacienteId: true, propuestoPor: true, fechaHora: true },
  });
  if (!cita) throw new Error("Cita no encontrada");
  if (cita.estado !== "CONTRAPROPUESTA" || cita.propuestoPor !== "PACIENTE") {
    throw new Error("Esta cita no es una contrapropuesta del paciente");
  }

  await prisma.cita.update({
    where: { id: citaId },
    data: { estado: "CANCELADA" },
  });

  await prisma.notificacion.create({
    data: {
      pacienteId: cita.pacienteId,
      citaId,
      tipo: "CITA_RECHAZADA",
      titulo: "Tu nutricionista ha rechazado tu propuesta",
      mensaje: `${dietista.nombre} ${dietista.apellidos} ha rechazado tu propuesta del ${formatFechaHora(cita.fechaHora)}`,
      enlace: "/paciente/portal/citas",
    },
  });

  void syncCitaAmbos(citaId);
  revalidatePath("/agenda");
  revalidatePath("/paciente/portal/citas");
}

// ─── PARA EL NUTRI (agenda) ────────────────────────────────────────

/** Nutri acepta una cita solicitada por el paciente → CONFIRMADA. */
export async function aceptarSolicitudCita(citaId: string): Promise<void> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const cita = await prisma.cita.findUnique({
    where: { id: citaId, dietistaId: dietista.id },
    select: { estado: true, pacienteId: true, fechaHora: true },
  });
  if (!cita) throw new Error("Cita no encontrada");
  if (cita.estado !== "PENDIENTE") throw new Error("Esta cita ya no está pendiente");

  await prisma.cita.update({
    where: { id: citaId },
    data: { estado: "CONFIRMADA" },
  });

  // Notificar al paciente
  await prisma.notificacion.create({
    data: {
      pacienteId: cita.pacienteId,
      citaId,
      tipo: "CITA_CONFIRMADA",
      titulo: "Tu cita ha sido confirmada",
      mensaje: `${dietista.nombre} ${dietista.apellidos} ha confirmado tu cita para ${formatFechaHora(cita.fechaHora)}`,
      enlace: `/paciente/portal/citas`,
    },
  });

  void syncCitaAmbos(citaId);
  revalidatePath("/agenda");
  revalidatePath("/paciente/portal/citas");
}

/**
 * Nutri propone otra fecha para una cita solicitada por el paciente.
 * Crea una NUEVA cita CONTRAPROPUESTA enlazada a la original (que queda en PENDIENTE).
 */
export async function contraproponerCita(
  citaOriginalId: string,
  nuevaFechaHoraISO: string,
  duracion?: number,
  nota?: string,
): Promise<{ id: string }> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const original = await prisma.cita.findUnique({
    where: { id: citaOriginalId, dietistaId: dietista.id },
    select: { estado: true, pacienteId: true, motivo: true, fechaHora: true, duracion: true, origen: true, propuestoPor: true },
  });
  if (!original) throw new Error("Cita no encontrada");
  // El nutri puede contraponer si la pelota está en su tejado:
  //  - Solicitud nueva del paciente: PENDIENTE + origen PACIENTE.
  //  - Contrapropuesta del paciente en curso: CONTRAPROPUESTA + propuestoPor PACIENTE.
  const esSolicitud = original.estado === "PENDIENTE" && original.origen === "PACIENTE";
  const esContrapropuestaPaciente = original.estado === "CONTRAPROPUESTA" && original.propuestoPor === "PACIENTE";
  if (!esSolicitud && !esContrapropuestaPaciente) {
    throw new Error("Esta cita no permite contrapropuesta del nutricionista");
  }

  const nuevaFechaHora = new Date(nuevaFechaHoraISO);
  if (isNaN(nuevaFechaHora.getTime())) throw new Error("Fecha inválida");
  if (nuevaFechaHora < new Date()) throw new Error("La fecha no puede ser pasada");

  // Validar que el slot no está pisado (excluyendo la original que está pendiente)
  const dur = duracion ?? original.duracion ?? 30;
  const fin = new Date(nuevaFechaHora.getTime() + dur * 60 * 1000);
  const solapa = await prisma.cita.findFirst({
    where: {
      dietistaId: dietista.id,
      id: { not: citaOriginalId },
      estado: { in: ["CONFIRMADA", "CONTRAPROPUESTA"] },
      fechaHora: { lt: fin },
    },
    select: { fechaHora: true, duracion: true },
  });
  if (solapa) {
    const solapaFin = new Date(solapa.fechaHora.getTime() + solapa.duracion * 60 * 1000);
    if (nuevaFechaHora < solapaFin && fin > solapa.fechaHora) {
      throw new Error("Ese horario está ocupado por otra cita");
    }
  }

  // Borrar evento de Google antes de eliminar la cita original
  await unsyncCitaAntesDeBorrar(citaOriginalId);

  // Transacción: eliminar la cita anterior + crear la contrapropuesta.
  // Eliminamos físicamente para no ensuciar calendario/historial con intermedias.
  // Solo queda la versión más reciente activa.
  const [, contrapropuesta] = await prisma.$transaction([
    prisma.cita.delete({ where: { id: citaOriginalId } }),
    prisma.cita.create({
      data: {
        pacienteId: original.pacienteId,
        dietistaId: dietista.id,
        fechaHora: nuevaFechaHora,
        duracion: dur,
        motivo: original.motivo,
        notas: nota?.trim().slice(0, 500) || null,
        estado: "CONTRAPROPUESTA",
        origen: original.origen, // preservar quién inició la cadena
        propuestoPor: "DIETISTA",
        citaOriginalId: null, // ya no hay original viva, no encadenar
      },
      select: { id: true },
    }),
  ]);

  // Notificar al paciente
  await prisma.notificacion.create({
    data: {
      pacienteId: original.pacienteId,
      citaId: contrapropuesta.id,
      tipo: "CITA_CONTRAPROPUESTA",
      titulo: "Tu nutricionista ha propuesto otra fecha",
      mensaje: `${dietista.nombre} ${dietista.apellidos} propone el ${formatFechaHora(nuevaFechaHora)} en vez del ${formatFechaHora(original.fechaHora)}`,
      enlace: `/paciente/portal/citas`,
    },
  });

  void syncCitaAmbos(contrapropuesta.id);
  revalidatePath("/agenda");
  revalidatePath("/paciente/portal/citas");
  return contrapropuesta;
}

/** Nutri rechaza una cita solicitada por el paciente. */
export async function rechazarSolicitudCita(citaId: string, motivoRechazo?: string): Promise<void> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const cita = await prisma.cita.findUnique({
    where: { id: citaId, dietistaId: dietista.id },
    select: { estado: true, pacienteId: true, fechaHora: true },
  });
  if (!cita) throw new Error("Cita no encontrada");
  if (cita.estado !== "PENDIENTE") throw new Error("Esta cita ya no está pendiente");

  await prisma.cita.update({
    where: { id: citaId },
    data: {
      estado: "CANCELADA",
      notas: motivoRechazo?.trim().slice(0, 500) || null,
    },
  });

  await prisma.notificacion.create({
    data: {
      pacienteId: cita.pacienteId,
      citaId,
      tipo: "CITA_RECHAZADA",
      titulo: "Tu solicitud de cita ha sido rechazada",
      mensaje:
        `${dietista.nombre} ${dietista.apellidos} ha rechazado tu solicitud para ${formatFechaHora(cita.fechaHora)}` +
        (motivoRechazo ? `. Motivo: ${motivoRechazo}` : "."),
      enlace: `/paciente/portal/citas`,
    },
  });

  void syncCitaAmbos(citaId);
  revalidatePath("/agenda");
  revalidatePath("/paciente/portal/citas");
}

/**
 * Devuelve los huecos libres del propio nutri autenticado, en un rango de fechas.
 * Se usa para el modal de "Proponer otra fecha" del nutri.
 */
export async function getMisHuecosLibres(desdeISO: string, hastaISO: string, excluirCitaId?: string): Promise<SlotLibre[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const horario = await getHorarioLaboralDietista(dietista.id);
  if (!horario?.dias) return [];

  const duracion = horario.duracionCitaDefault ?? 30;
  const desde = new Date(desdeISO);
  const hasta = new Date(hastaISO);
  const ahora = new Date();

  const citasOcupadas = await prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      fechaHora: { gte: desde, lte: hasta },
      estado: { in: ["PENDIENTE", "CONFIRMADA", "CONTRAPROPUESTA"] },
      ...(excluirCitaId ? { id: { not: excluirCitaId } } : {}),
    },
    select: { fechaHora: true, duracion: true },
  });
  const ocupados = citasOcupadas.map((c) => ({
    start: c.fechaHora.getTime(),
    end: c.fechaHora.getTime() + c.duracion * 60 * 1000,
  }));

  const diasActivosMap = new Map<string, HorarioLaboralDia>();
  for (const d of horario.dias) {
    if (d.activo) diasActivosMap.set(d.dia, d);
  }

  const WEEKDAY_TO_ES: Record<string, string> = {
    MONDAY: "LUNES", TUESDAY: "MARTES", WEDNESDAY: "MIERCOLES",
    THURSDAY: "JUEVES", FRIDAY: "VIERNES", SATURDAY: "SABADO", SUNDAY: "DOMINGO",
  };
  const weekdayFmt = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Europe/Madrid" });

  const slots: SlotLibre[] = [];
  for (let t = new Date(desde); t <= hasta; t.setDate(t.getDate() + 1)) {
    const fechaMadrid = toMadridDateStr(t);
    const [anyo, mes, dia] = fechaMadrid.split("-").map(Number);
    const diaKey = WEEKDAY_TO_ES[weekdayFmt.format(t).toUpperCase()];
    const diaInfo = diasActivosMap.get(diaKey);
    if (!diaInfo) continue;

    const hoySlots = generarSlotsDelDia(anyo, mes - 1, dia, diaInfo.intervalos, duracion);
    for (const s of hoySlots) {
      if (s < ahora) continue;
      const sStart = s.getTime();
      const sEnd = sStart + duracion * 60 * 1000;
      const pisa = ocupados.some((o) => sStart < o.end && sEnd > o.start);
      if (pisa) continue;
      slots.push({
        fechaHora: s.toISOString(),
        fechaLocal: toMadridDateStr(s),
        horaLocal: toMadridTimeStr(s),
        duracion,
      });
    }
  }

  return slots;
}

/** Listado de solicitudes pendientes (PENDIENTE + origen PACIENTE) para el nutri. */
export async function getSolicitudesPendientes() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      estado: "PENDIENTE",
      origen: "PACIENTE",
    },
    orderBy: { createdAt: "desc" },
    include: {
      paciente: { select: { id: true, nombre: true, apellidos: true, fotoUrl: true } },
    },
  });
}

// ─── Utilidades de formato ─────────────────────────────────────────

function formatFechaHora(d: Date): string {
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const dia = dias[d.getDay()];
  const numDia = d.getDate();
  const mes = meses[d.getMonth()];
  const hora = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dia} ${numDia} de ${mes} a las ${hora}:${min}`;
}
