import nodemailer from "nodemailer";

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
