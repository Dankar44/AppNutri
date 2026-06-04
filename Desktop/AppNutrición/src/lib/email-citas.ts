import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { getTranslations } from "next-intl/server";
import { renderEmailCita } from "@/lib/email-citas-template";

// Evita reenviar el mismo email de cita (mismo estado) en una ventana corta.
// El envío manual desde la agenda usa { force: true } y se salta el debounce.
const ultimoEnvioCita = new Map<string, number>();
const DEBOUNCE_MS = 5 * 60 * 1000;

/** Fecha larga localizada, p. ej. "lunes, 9 de junio, 17:00". */
async function formatFechaHoraCita(d: Date): Promise<string> {
  const locale = await import("@/i18n/locale").then((m) => m.getLocale());
  const tag = locale === "pt" ? "pt-BR" : "es-ES";
  return d.toLocaleString(tag, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Envía al paciente un email sobre su cita (propuesta, confirmación, nueva fecha
 * o recordatorio, según el estado). Pensada para llamarse fire-and-forget desde
 * los flujos de cita, y con { force } desde el botón manual de la agenda.
 * No valida sesión: el llamador es responsable de la autorización.
 */
export async function enviarEmailCita(
  citaId: string,
  opts: { force?: boolean } = {},
): Promise<{ ok: boolean; motivo?: string }> {
  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    select: {
      estado: true,
      fechaHora: true,
      duracion: true,
      motivo: true,
      isOnline: true,
      googleMeetLink: true,
      propuestoPor: true,
      paciente: { select: { nombre: true, apellidos: true, email: true, esDemo: true } },
      dietista: { select: { nombre: true, apellidos: true, email: true } },
    },
  });
  if (!cita) return { ok: false, motivo: "no-cita" };
  if (cita.paciente.esDemo) return { ok: false, motivo: "demo" };
  if (!cita.paciente.email) return { ok: false, motivo: "sin-email" };

  if (!opts.force) {
    const key = `${citaId}:${cita.estado}`;
    const ahora = Date.now();
    const last = ultimoEnvioCita.get(key);
    if (last && ahora - last < DEBOUNCE_MS) return { ok: false, motivo: "debounce" };
    ultimoEnvioCita.set(key, ahora);
  }

  const te = await getTranslations("emails");
  const fecha = await formatFechaHoraCita(cita.fechaHora);
  const { subject, html } = renderEmailCita(
    {
      estado: cita.estado,
      propuestoPor: cita.propuestoPor,
      duracion: cita.duracion,
      motivo: cita.motivo,
      isOnline: cita.isOnline,
      googleMeetLink: cita.googleMeetLink,
      pacienteNombre: cita.paciente.nombre,
      dietistaNombre: `${cita.dietista.nombre} ${cita.dietista.apellidos}`.trim(),
    },
    fecha,
    (key, params) => te(key, params),
  );

  try {
    await sendEmail({
      to: cita.paciente.email,
      subject,
      html,
      replyTo: cita.dietista.email,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email-citas]", err);
    return { ok: false, motivo: "envio" };
  }
}

/**
 * Construye el texto de recordatorio de cita para enviar por WhatsApp
 * (el nutri abre wa.me con el mensaje ya escrito y solo le da a enviar).
 */
export async function construirMensajeWhatsAppCita(citaId: string): Promise<string | null> {
  const cita = await prisma.cita.findUnique({
    where: { id: citaId },
    select: {
      fechaHora: true,
      isOnline: true,
      googleMeetLink: true,
      paciente: { select: { nombre: true } },
      dietista: { select: { nombre: true, apellidos: true } },
    },
  });
  if (!cita) return null;

  const te = await getTranslations("emails");
  const fecha = await formatFechaHoraCita(cita.fechaHora);
  const dietistaNombre = `${cita.dietista.nombre} ${cita.dietista.apellidos}`.trim();
  let msg = te("cita.whatsapp", { pacienteNombre: cita.paciente.nombre, dietistaNombre, fecha });
  if (cita.isOnline && cita.googleMeetLink) {
    msg += "\n" + te("cita.whatsappEnlace", { enlace: cita.googleMeetLink });
  }
  return msg;
}
