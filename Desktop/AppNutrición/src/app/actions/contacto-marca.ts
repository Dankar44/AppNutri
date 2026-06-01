"use server";

import { sendEmail } from "@/lib/mailer";

const DESTINO = "annonianutri@gmail.com";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Formulario "¿Eres una marca o colaborador?" del landing → envía un correo.
export async function enviarContactoMarca(data: {
  email: string;
  asunto: string;
  mensaje: string;
}): Promise<{ ok: boolean; error?: string }> {
  const email = (data.email || "").trim();
  const asunto = (data.asunto || "").trim();
  const mensaje = (data.mensaje || "").trim();

  if (!email || !asunto || !mensaje) return { ok: false, error: "Completa todos los campos." };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "El email no es válido." };
  if (email.length > 200 || asunto.length > 200 || mensaje.length > 5000) {
    return { ok: false, error: "El mensaje es demasiado largo." };
  }

  try {
    await sendEmail({
      to: DESTINO,
      replyTo: email,
      subject: `[Marca/Colaborador] ${asunto}`,
      html: `
        <p><strong>Nueva propuesta de marca / colaborador (landing)</strong></p>
        <p><strong>Email de contacto:</strong> ${escapeHtml(email)}</p>
        <p><strong>Asunto:</strong> ${escapeHtml(asunto)}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(mensaje).replace(/\n/g, "<br>")}</p>
      `,
    });
    return { ok: true };
  } catch (err) {
    console.error("[contacto-marca] error enviando email:", err);
    return { ok: false, error: "No se pudo enviar. Inténtalo de nuevo más tarde." };
  }
}
