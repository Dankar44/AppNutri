import nodemailer from "nodemailer";
import { getResend } from "@/lib/resend";

let _transport: nodemailer.Transporter | null = null;

export function getMailer(): nodemailer.Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  if (!_transport) {
    _transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return _transport;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || "Annonia <noreply@annonia.com>";

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

/**
 * Desde local los correos SÍ salen: Next carga `.env.local` —que en la máquina del mantenedor es
 * PRODUCCIÓN— además del fichero de desarrollo, así que el servidor de pruebas tiene la clave de
 * Resend buena, y así se puede comprobar aquí que el correo llega de verdad en vez de dejarlo para
 * producción (Guillermo, 9 sep 2026: "lo prefiero").
 *
 * Lo que NO sale son los correos de las pruebas automáticas. Usan direcciones inventadas
 * (`@banco.dev`, `@matriz.dev`…) y cada tanda mandaba unos cuantos: gastan cuota —3.000 al mes,
 * 100 al día— y dejan rebotes contra la reputación del dominio. Se reconocen por el dominio, que
 * en las pruebas siempre acaba en `.dev` o `.test`; en producción no se corta nada nunca.
 */
function esCorreoDePruebas(to: string, subject: string): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (/annonia\.com/i.test(process.env.NEXT_PUBLIC_APP_URL ?? "")) return false;
  if (!/\.(dev|test)$/i.test(to.trim())) return false;
  console.log(`[correo] NO enviado, es una dirección de pruebas: «${subject}» → ${to}`);
  return true;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}): Promise<void> {
  if (esCorreoDePruebas(opts.to, opts.subject)) return;
  const from = opts.from || DEFAULT_FROM;

  const resend = getResend();
  if (resend) {
    // El SDK de Resend NO lanza excepción ante errores de API (dominio no
    // verificado, destinatario rechazado, rebote): devuelve { error }. Si no lo
    // comprobamos, un envío fallido pasa por bueno y deja cuentas a medias
    // (p. ej. registros sin verificar). Propagar el error para que el llamante
    // (registro, etc.) pueda hacer rollback.
    const { error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: typeof a.content === "string" ? Buffer.from(a.content, "utf-8") : a.content,
        content_type: a.contentType,
      })),
    });
    if (error) {
      throw new Error(`Resend no pudo enviar el email a ${opts.to}: ${error.message ?? JSON.stringify(error)}`);
    }
    return;
  }

  const mailer = getMailer();
  if (mailer) {
    await mailer.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });
    return;
  }

  throw new Error(
    "No email service configured. Add RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD to environment variables.",
  );
}
