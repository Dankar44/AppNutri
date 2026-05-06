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

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<void> {
  const from = opts.from || DEFAULT_FROM;

  const resend = getResend();
  if (resend) {
    await resend.emails.send({
      from: DEFAULT_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });
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
    });
    return;
  }

  throw new Error(
    "No hay servicio de email configurado. Añade RESEND_API_KEY o GMAIL_USER + GMAIL_APP_PASSWORD en las variables de entorno.",
  );
}
