import { prisma } from "@/lib/prisma";
import {
  createGoogleEvent,
  updateGoogleEvent,
  deleteGoogleEvent,
  type CitaCalendarData,
} from "@/lib/google-calendar";

const ESTADOS_SINCRONIZABLES = new Set(["PENDIENTE", "CONFIRMADA", "COMPLETADA"]);

async function loadCitaFull(citaId: string) {
  return prisma.cita.findUnique({
    where: { id: citaId },
    include: {
      paciente: { select: { nombre: true, apellidos: true, email: true, esDemo: true } },
      dietista: { select: { nombre: true, apellidos: true, email: true } },
    },
  });
}

function toCalendarData(cita: NonNullable<Awaited<ReturnType<typeof loadCitaFull>>>): CitaCalendarData {
  return {
    id: cita.id,
    fechaHora: cita.fechaHora,
    duracion: cita.duracion,
    motivo: cita.motivo,
    notas: cita.notas,
    pacienteNombre: `${cita.paciente.nombre} ${cita.paciente.apellidos}`.trim(),
    pacienteEmail: cita.paciente.email,
    dietistaNombre: `${cita.dietista.nombre} ${cita.dietista.apellidos}`.trim(),
    dietistaEmail: cita.dietista.email,
    isOnline: cita.isOnline,
  };
}

/**
 * Sincroniza una cita con Google Calendar del nutri.
 * - Si estado es sincronizable y no hay evento → lo crea.
 * - Si estado es sincronizable y ya hay evento → lo actualiza.
 * - Si estado NO es sincronizable (CANCELADA/CONTRAPROPUESTA) y hay evento → lo borra.
 * Nunca lanza: todos los errores se loguean.
 */
export async function syncCitaNutri(citaId: string): Promise<void> {
  try {
    const cita = await loadCitaFull(citaId);
    if (!cita) return;
    if (cita.paciente.esDemo) return;

    const integracion = await prisma.googleIntegracion.findUnique({
      where: { dietistaId: cita.dietistaId },
    });
    if (!integracion || !integracion.sincronizar) return;

    const debeEstarEnGoogle = ESTADOS_SINCRONIZABLES.has(cita.estado);

    if (!debeEstarEnGoogle && cita.googleEventId) {
      await deleteGoogleEvent(integracion, "nutri", cita.googleEventId);
      await prisma.cita.update({
        where: { id: cita.id },
        data: { googleEventId: null, googleMeetLink: null },
      });
      return;
    }

    if (!debeEstarEnGoogle) return;

    const data = toCalendarData(cita);
    const createMeet = cita.isOnline;

    if (cita.googleEventId) {
      const { meetLink } = await updateGoogleEvent(
        integracion,
        "nutri",
        cita.googleEventId,
        data,
        { createMeet },
      );
      if (meetLink && meetLink !== cita.googleMeetLink) {
        await prisma.cita.update({
          where: { id: cita.id },
          data: { googleMeetLink: meetLink },
        });
      }
    } else {
      const { eventId, meetLink } = await createGoogleEvent(
        integracion,
        "nutri",
        data,
        { createMeet },
      );
      await prisma.cita.update({
        where: { id: cita.id },
        data: { googleEventId: eventId, googleMeetLink: meetLink },
      });
    }
  } catch (e) {
    console.error(`[google-sync] cita ${citaId}:`, e);
  }
}

/**
 * Sincroniza una cita con el Google Calendar del paciente (si la tiene conectado).
 * Nunca lanza.
 */
export async function syncCitaPaciente(citaId: string): Promise<void> {
  try {
    const cita = await loadCitaFull(citaId);
    if (!cita) return;
    if (cita.paciente.esDemo) return;

    const integracion = await prisma.googleIntegracionPaciente.findUnique({
      where: { pacienteId: cita.pacienteId },
    });
    if (!integracion || !integracion.sincronizar) return;

    const debeEstarEnGoogle = ESTADOS_SINCRONIZABLES.has(cita.estado);

    if (!debeEstarEnGoogle && cita.googleEventIdPaciente) {
      await deleteGoogleEvent(integracion, "paciente", cita.googleEventIdPaciente);
      await prisma.cita.update({
        where: { id: cita.id },
        data: { googleEventIdPaciente: null },
      });
      return;
    }

    if (!debeEstarEnGoogle) return;

    const data = toCalendarData(cita);

    if (cita.googleEventIdPaciente) {
      await updateGoogleEvent(
        integracion,
        "paciente",
        cita.googleEventIdPaciente,
        data,
        // No creamos Meet desde el calendar del paciente (ya viene del del nutri)
        { createMeet: false },
      );
    } else {
      const { eventId } = await createGoogleEvent(
        integracion,
        "paciente",
        data,
        { createMeet: false },
      );
      await prisma.cita.update({
        where: { id: cita.id },
        data: { googleEventIdPaciente: eventId },
      });
    }
  } catch (e) {
    console.error(`[google-sync] cita paciente ${citaId}:`, e);
  }
}

/** Sincroniza una cita con ambos calendars (nutri y paciente) en paralelo. */
export async function syncCitaAmbos(citaId: string): Promise<void> {
  await Promise.all([syncCitaNutri(citaId), syncCitaPaciente(citaId)]);
}

/**
 * Borra el evento en Google (si lo hay) ANTES de eliminar la cita en BD.
 * Llamar justo antes de prisma.cita.delete(). Borra de ambos calendars.
 */
export async function unsyncCitaAntesDeBorrar(citaId: string): Promise<void> {
  try {
    const cita = await prisma.cita.findUnique({
      where: { id: citaId },
      select: {
        dietistaId: true,
        pacienteId: true,
        googleEventId: true,
        googleEventIdPaciente: true,
      },
    });
    if (!cita) return;

    const tasks: Promise<unknown>[] = [];

    if (cita.googleEventId) {
      const integracionNutri = await prisma.googleIntegracion.findUnique({
        where: { dietistaId: cita.dietistaId },
      });
      if (integracionNutri) {
        tasks.push(deleteGoogleEvent(integracionNutri, "nutri", cita.googleEventId));
      }
    }

    if (cita.googleEventIdPaciente) {
      const integracionPaciente = await prisma.googleIntegracionPaciente.findUnique({
        where: { pacienteId: cita.pacienteId },
      });
      if (integracionPaciente) {
        tasks.push(deleteGoogleEvent(integracionPaciente, "paciente", cita.googleEventIdPaciente));
      }
    }

    await Promise.all(tasks);
  } catch (e) {
    console.error(`[google-sync] unsync cita ${citaId}:`, e);
  }
}

/**
 * Backfill: crea eventos en Google para todas las citas sincronizables del nutri
 * que no tengan aún googleEventId. Se ejecuta al conectar o al reactivar el toggle.
 */
export async function backfillCitasNutri(dietistaId: string): Promise<{ creadas: number; errores: number }> {
  let creadas = 0;
  let errores = 0;

  const integracion = await prisma.googleIntegracion.findUnique({
    where: { dietistaId },
  });
  if (!integracion || !integracion.sincronizar) return { creadas, errores };

  const citas = await prisma.cita.findMany({
    where: {
      dietistaId,
      googleEventId: null,
      estado: { in: ["PENDIENTE", "CONFIRMADA", "COMPLETADA"] },
      paciente: { esDemo: false },
    },
    include: {
      paciente: { select: { nombre: true, apellidos: true, email: true, esDemo: true } },
      dietista: { select: { nombre: true, apellidos: true, email: true } },
    },
    orderBy: { fechaHora: "asc" },
  });

  for (const cita of citas) {
    try {
      const data = toCalendarData(cita);
      const { eventId, meetLink } = await createGoogleEvent(
        integracion,
        "nutri",
        data,
        { createMeet: cita.isOnline },
      );
      await prisma.cita.update({
        where: { id: cita.id },
        data: { googleEventId: eventId, googleMeetLink: meetLink },
      });
      creadas++;
    } catch (e) {
      console.error(`[backfill] cita ${cita.id}:`, e);
      errores++;
    }
  }

  return { creadas, errores };
}

/** Backfill equivalente para el calendar del paciente. */
export async function backfillCitasPaciente(pacienteId: string): Promise<{ creadas: number; errores: number }> {
  let creadas = 0;
  let errores = 0;

  const integracion = await prisma.googleIntegracionPaciente.findUnique({
    where: { pacienteId },
  });
  if (!integracion || !integracion.sincronizar) return { creadas, errores };

  const citas = await prisma.cita.findMany({
    where: {
      pacienteId,
      googleEventIdPaciente: null,
      estado: { in: ["PENDIENTE", "CONFIRMADA", "COMPLETADA"] },
      paciente: { esDemo: false },
    },
    include: {
      paciente: { select: { nombre: true, apellidos: true, email: true, esDemo: true } },
      dietista: { select: { nombre: true, apellidos: true, email: true } },
    },
    orderBy: { fechaHora: "asc" },
  });

  for (const cita of citas) {
    try {
      const data = toCalendarData(cita);
      const { eventId } = await createGoogleEvent(
        integracion,
        "paciente",
        data,
        { createMeet: false },
      );
      await prisma.cita.update({
        where: { id: cita.id },
        data: { googleEventIdPaciente: eventId },
      });
      creadas++;
    } catch (e) {
      console.error(`[backfill-paciente] cita ${cita.id}:`, e);
      errores++;
    }
  }

  return { creadas, errores };
}
