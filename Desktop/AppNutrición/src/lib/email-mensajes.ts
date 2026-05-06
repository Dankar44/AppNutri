import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://annonia.com";

const ultimoEnvio = new Map<string, number>();
const DEBOUNCE_MS = 5 * 60 * 1000;

function puedeEnviar(key: string): boolean {
  const ahora = Date.now();
  const last = ultimoEnvio.get(key);
  if (last && ahora - last < DEBOUNCE_MS) return false;
  ultimoEnvio.set(key, ahora);
  return true;
}

async function trySendEmail(to: string, subject: string, html: string) {
  try {
    await sendEmail({ to, subject, html });
    return true;
  } catch (err) {
    console.error("[email-mensajes]", err);
    return false;
  }
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncar(s: string, max = 140): string {
  if (s.length <= max) return s;
  return s.slice(0, max).trim() + "…";
}

const BASE_STYLES = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f4; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e7e5e4; }
    .header { padding: 24px; border-bottom: 1px solid #e7e5e4; display: flex; align-items: center; gap: 10px; }
    .logo { font-size: 18px; font-weight: 700; color: #16a34a; }
    .content { padding: 28px 24px; }
    h1 { font-size: 20px; margin: 0 0 8px 0; color: #0a0a0a; }
    p { color: #57534e; line-height: 1.5; margin: 8px 0; }
    .message-box { background: #f5f5f4; border-left: 4px solid #16a34a; padding: 12px 16px; border-radius: 4px; margin: 16px 0; }
    .cta { display: inline-block; background: #16a34a; color: #ffffff !important; padding: 10px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { padding: 16px 24px; font-size: 12px; color: #a8a29e; border-top: 1px solid #e7e5e4; text-align: center; }
  </style>
`;

/** Envía email al paciente avisando de un nuevo mensaje del dietista. */
export async function notificarPacienteNuevoMensaje(
  pacienteId: string,
  textoMensaje: string,
) {
  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    select: {
      id: true,
      nombre: true,
      email: true,
      dietista: { select: { nombre: true, apellidos: true } },
    },
  });

  if (!paciente?.email) return;

  const key = `paciente:${paciente.id}`;
  if (!puedeEnviar(key)) return;

  const nombreDietista = `${paciente.dietista.nombre} ${paciente.dietista.apellidos}`;
  const preview = truncar(textoMensaje);
  const subject = `Tienes un mensaje de ${nombreDietista}`;
  const link = `${APP_URL}/paciente/portal/mensajes`;

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">${BASE_STYLES}</head><body>
<div class="container">
  <div class="header">
    <span class="logo">Annonia</span>
  </div>
  <div class="content">
    <h1>Hola, ${escape(paciente.nombre)}</h1>
    <p><strong>${escape(nombreDietista)}</strong> te ha enviado un mensaje:</p>
    <div class="message-box">${escape(preview)}</div>
    <a href="${link}" class="cta">Ver mensaje</a>
    <p style="margin-top:18px; font-size:13px;">Responde desde la aplicación para mantener toda la conversación en un único sitio.</p>
  </div>
  <div class="footer">
    Este correo es una notificación automática de Annonia.<br>
    Si no quieres recibir estos avisos, desactívalos desde tu portal.
  </div>
</div>
</body></html>`;

  await trySendEmail(paciente.email, subject, html);
}

/** Envía email al dietista avisando de un nuevo mensaje del paciente. */
export async function notificarDietistaNuevoMensaje(
  dietistaId: string,
  pacienteId: string,
  textoMensaje: string,
) {
  const [dietista, paciente] = await Promise.all([
    prisma.dietista.findUnique({
      where: { id: dietistaId },
      select: { id: true, nombre: true, email: true },
    }),
    prisma.paciente.findUnique({
      where: { id: pacienteId },
      select: { nombre: true, apellidos: true },
    }),
  ]);

  if (!dietista?.email || !paciente) return;

  const key = `dietista:${dietista.id}:${pacienteId}`;
  if (!puedeEnviar(key)) return;

  const nombrePaciente = `${paciente.nombre} ${paciente.apellidos}`;
  const preview = truncar(textoMensaje);
  const subject = `Nuevo mensaje de ${nombrePaciente}`;
  const link = `${APP_URL}/mensajes`;

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8">${BASE_STYLES}</head><body>
<div class="container">
  <div class="header">
    <span class="logo">Annonia</span>
  </div>
  <div class="content">
    <h1>Hola, ${escape(dietista.nombre)}</h1>
    <p>Tu paciente <strong>${escape(nombrePaciente)}</strong> te ha enviado un mensaje:</p>
    <div class="message-box">${escape(preview)}</div>
    <a href="${link}" class="cta">Abrir mensajes</a>
  </div>
  <div class="footer">
    Este correo es una notificación automática de Annonia.<br>
    Puedes ajustar las preferencias desde tu panel.
  </div>
</div>
</body></html>`;

  await trySendEmail(dietista.email, subject, html);
}
