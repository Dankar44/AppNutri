import { SignJWT, jwtVerify } from "jose";
import { sendEmail } from "@/lib/mailer";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const SECRET = new TextEncoder().encode(
  (process.env.PATIENT_JWT_SECRET || "annonia-dev-secret") + "-verify-email"
);

export async function generateVerifyToken(authId: string, email: string): Promise<string> {
  return new SignJWT({ authId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyEmailToken(token: string): Promise<{ authId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      authId: payload.authId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

const TEXTS = {
  es: {
    subject: "Verifica tu cuenta — Annonia",
    title: "Verifica tu cuenta",
    greeting: "Hola",
    body: "Hemos recibido una solicitud para verificar tu cuenta en Annonia. Pulsa el botón de abajo para confirmar tu email.",
    cta: "Verificar email",
    fallback: "Si el botón no funciona, copia y pega este enlace:",
    expiry: "Este enlace es válido durante 7 días.",
    ignore: "Si no solicitaste esta cuenta, puedes ignorar este correo.",
    auto: "Este correo es una notificación automática de Annonia.",
  },
  pt: {
    subject: "Verifique sua conta — Annonia",
    title: "Verifique sua conta",
    greeting: "Olá",
    body: "Recebemos uma solicitação para verificar sua conta no Annonia. Clique no botão abaixo para confirmar seu email.",
    cta: "Verificar email",
    fallback: "Se o botão não funcionar, copie e cole este link:",
    expiry: "Este link é válido por 7 dias.",
    ignore: "Se você não solicitou esta conta, pode ignorar este email.",
    auto: "Este email é uma notificação automática do Annonia.",
  },
} as const;

export async function sendVerificationEmail(email: string, nombre: string, token: string, appUrl: string, locale: "es" | "pt" = "es"): Promise<void> {
  const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`;
  const t = TEXTS[locale];

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f4;margin:0;padding:20px;">
<div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:#16a34a;padding:40px 24px 32px;text-align:center;">
    <img src="https://annonia.com/icon-512.png" alt="Annonia" width="56" height="56" style="border-radius:12px;" />
    <h1 style="color:#ffffff;font-size:22px;margin:14px 0 0;font-weight:700;">Annonia</h1>
  </div>
  <div style="padding:32px 24px;border:1px solid #e5e7eb;border-top:0;">
    <h2 style="color:#111827;font-size:18px;margin:0 0 8px;font-weight:600;">${t.title}</h2>
    <p style="color:#374151;font-size:14px;margin:0 0 8px;">${t.greeting}, ${escapeHtml(nombre)}</p>
    <p style="color:#374151;font-size:14px;margin:0 0 24px;line-height:1.6;">${t.body}</p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${verifyUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:15px;">${t.cta}</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:0 0 12px;word-break:break-all;">${t.fallback}<br><a href="${verifyUrl}" style="color:#16a34a;">${escapeHtml(verifyUrl)}</a></p>
    <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">${t.expiry}</p>
    <p style="color:#6b7280;font-size:13px;margin:0 0 16px;">${t.ignore}</p>
    <div style="border-top:1px solid #e5e7eb;padding-top:16px;">
      <p style="color:#9ca3af;font-size:11px;margin:0;text-align:center;">${t.auto}</p>
    </div>
  </div>
</div>
</body></html>`;

  await sendEmail({
    to: email,
    subject: t.subject,
    html,
  });
}
