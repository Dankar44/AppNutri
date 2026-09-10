import { google, calendar_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getOAuthClient, refreshAccessToken, type GoogleAudience } from "@/lib/google-oauth";
import { encryptToken, decryptToken } from "@/lib/encryption";

type IntegracionNutri = {
  id: string;
  dietistaId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  calendarId: string;
};

type IntegracionPaciente = {
  id: string;
  pacienteId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  calendarId: string;
};

async function ensureFreshToken<
  T extends IntegracionNutri | IntegracionPaciente
>(integracion: T, audience: GoogleAudience): Promise<T> {
  const plainAccess = decryptToken(integracion.accessToken);
  const plainRefresh = decryptToken(integracion.refreshToken);

  const now = Date.now();
  const expiry = integracion.expiryDate.getTime();
  if (expiry - now > 60_000) {
    return { ...integracion, accessToken: plainAccess, refreshToken: plainRefresh };
  }

  const creds = await refreshAccessToken(plainRefresh, audience);
  const newAccess = creds.access_token ?? plainAccess;
  const newExpiry = creds.expiry_date ? new Date(creds.expiry_date) : new Date(Date.now() + 3600_000);

  if (audience === "nutri") {
    await prisma.googleIntegracion.update({
      where: { id: integracion.id },
      data: { accessToken: encryptToken(newAccess), expiryDate: newExpiry },
    });
  } else {
    await prisma.googleIntegracionPaciente.update({
      where: { id: integracion.id },
      data: { accessToken: encryptToken(newAccess), expiryDate: newExpiry },
    });
  }
  return { ...integracion, accessToken: newAccess, refreshToken: plainRefresh, expiryDate: newExpiry };
}

function buildAuthedClient(integracion: IntegracionNutri | IntegracionPaciente, audience: GoogleAudience): OAuth2Client {
  const client = getOAuthClient(audience);
  client.setCredentials({
    access_token: integracion.accessToken,
    refresh_token: integracion.refreshToken,
    expiry_date: integracion.expiryDate.getTime(),
  });
  return client;
}

export type CitaCalendarData = {
  id: string;
  fechaHora: Date;
  duracion: number;
  motivo?: string | null;
  notas?: string | null;
  pacienteNombre?: string;
  pacienteEmail?: string | null;
  dietistaNombre?: string;
  dietistaEmail?: string | null;
  isOnline: boolean;
  enlaceVideollamada?: string | null;
};

function nuevaSolicitudMeet(): calendar_v3.Schema$ConferenceData {
  return {
    createRequest: {
      requestId: randomUUID(),
      conferenceSolutionKey: { type: "hangoutsMeet" },
    },
  };
}

function buildEventResource(cita: CitaCalendarData): calendar_v3.Schema$Event {
  const start = cita.fechaHora;
  const end = new Date(start.getTime() + cita.duracion * 60_000);
  const summary = cita.pacienteNombre
    ? `Cita: ${cita.pacienteNombre}`
    : "Cita nutrición";
  const descLines: string[] = [];
  if (cita.motivo) descLines.push(`Motivo: ${cita.motivo}`);
  if (cita.notas) descLines.push(`Notas: ${cita.notas}`);
  if (cita.enlaceVideollamada) descLines.push(`Videollamada: ${cita.enlaceVideollamada}`);
  if (cita.dietistaNombre) descLines.push(`Nutricionista: ${cita.dietistaNombre}`);

  const event: calendar_v3.Schema$Event = {
    summary,
    description: descLines.join("\n") || undefined,
    start: { dateTime: start.toISOString(), timeZone: "Europe/Madrid" },
    end: { dateTime: end.toISOString(), timeZone: "Europe/Madrid" },
  };

  return event;
}

function getMeetLink(evento: calendar_v3.Schema$Event): string | null {
  return (
    evento.conferenceData?.entryPoints?.find((entrada) => entrada.entryPointType === "video")?.uri ??
    evento.hangoutLink ??
    null
  );
}

async function esperarMeet(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  eventId: string,
  eventoInicial: calendar_v3.Schema$Event,
): Promise<string | null> {
  let evento = eventoInicial;
  for (let intento = 0; intento < 4; intento++) {
    const enlace = getMeetLink(evento);
    if (enlace) return enlace;

    const estado = evento.conferenceData?.createRequest?.status?.statusCode;
    if (estado === "failure") return null;
    await new Promise((resolver) => setTimeout(resolver, 400 * (intento + 1)));
    const respuesta = await calendar.events.get({ calendarId, eventId });
    evento = respuesta.data;
  }
  return getMeetLink(evento);
}

export async function createGoogleEvent(
  integracion: IntegracionNutri | IntegracionPaciente,
  audience: GoogleAudience,
  cita: CitaCalendarData,
  opts: { createMeet: boolean },
): Promise<{ eventId: string; meetLink: string | null }> {
  const fresh = await ensureFreshToken(integracion, audience);
  const auth = buildAuthedClient(fresh, audience);
  const calendar = google.calendar({ version: "v3", auth });

  const calendarId = fresh.calendarId || "primary";
  const requestBody = buildEventResource(cita);
  if (opts.createMeet && cita.isOnline) requestBody.conferenceData = nuevaSolicitudMeet();

  const res = await calendar.events.insert({
    calendarId,
    conferenceDataVersion: opts.createMeet ? 1 : 0,
    requestBody,
  });

  const eventId = res.data.id!;
  const meetLink = opts.createMeet
    ? await esperarMeet(calendar, calendarId, eventId, res.data)
    : null;

  return { eventId, meetLink };
}

export async function updateGoogleEvent(
  integracion: IntegracionNutri | IntegracionPaciente,
  audience: GoogleAudience,
  eventId: string,
  cita: CitaCalendarData,
  opts: { createMeet: boolean },
): Promise<{ meetLink: string | null }> {
  const fresh = await ensureFreshToken(integracion, audience);
  const auth = buildAuthedClient(fresh, audience);
  const calendar = google.calendar({ version: "v3", auth });
  const calendarId = fresh.calendarId || "primary";
  const eventoActual = await calendar.events.get({ calendarId, eventId });
  const requestBody = buildEventResource(cita);

  if (opts.createMeet && cita.isOnline) {
    requestBody.conferenceData = eventoActual.data.conferenceData ?? nuevaSolicitudMeet();
  }

  const res = await calendar.events.update({
    calendarId,
    eventId,
    // Version 1 permite conservar, crear o retirar los datos de conferencia.
    conferenceDataVersion: 1,
    requestBody,
  });
  const meetLink = opts.createMeet
    ? await esperarMeet(calendar, calendarId, eventId, res.data)
    : null;
  return { meetLink };
}

export async function deleteGoogleEvent(
  integracion: IntegracionNutri | IntegracionPaciente,
  audience: GoogleAudience,
  eventId: string,
): Promise<void> {
  try {
    const fresh = await ensureFreshToken(integracion, audience);
    const auth = buildAuthedClient(fresh, audience);
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({
      calendarId: fresh.calendarId || "primary",
      eventId,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("404") || msg.includes("410") || msg.toLowerCase().includes("not found")) {
      return;
    }
    throw e;
  }
}
