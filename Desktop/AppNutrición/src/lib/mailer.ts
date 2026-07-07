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

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}): Promise<void> {
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
