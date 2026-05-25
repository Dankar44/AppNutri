"use server";

import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { getTranslations } from "next-intl/server";

const RECOVERY_EXPIRY = "1h";

function getSecret() {
  const secret = process.env.PATIENT_JWT_SECRET || "recovery-fallback-secret";
  return new TextEncoder().encode(secret);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function solicitarRecuperacion(email: string, origin: string): Promise<{ ok: boolean }> {
  const normalizedEmail = email.trim().toLowerCase();

  const dietista = await prisma.dietista.findFirst({
    where: { email: normalizedEmail },
  });

  if (!dietista) return { ok: true };

  const token = await new SignJWT({ sub: dietista.authId, email: normalizedEmail })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(RECOVERY_EXPIRY)
    .sign(getSecret());

  const baseUrl = origin || "https://annonia.com";
  const resetLink = `${baseUrl}/nueva-password?token=${token}`;

  const te = await getTranslations("emails");

  const html = buildRecoveryEmail({
    nombre: dietista.nombre,
    resetLink,
    t: (key: string) => te(`recuperarPassword.${key}`),
  });

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: te("recuperarPassword.subject"),
      html,
    });
  } catch (err) {
    console.error("[recovery] Error enviando email:", err);
  }

  return { ok: true };
}

export async function verificarTokenRecuperacion(
  token: string
): Promise<{ ok: boolean; authId?: string }> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub) return { ok: false };
    return { ok: true, authId: payload.sub };
  } catch {
    return { ok: false };
  }
}

export async function resetearPassword(
  token: string,
  nuevaPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("auth.nuevaPassword");

  if (!nuevaPassword || nuevaPassword.length < 6) {
    return { ok: false, error: t("errorMinLength") };
  }

  const verificacion = await verificarTokenRecuperacion(token);
  if (!verificacion.ok || !verificacion.authId) {
    return { ok: false, error: t("errorNoSession") };
  }

  try {
    await prisma.$queryRawUnsafe(
      `UPDATE auth.users SET encrypted_password = crypt($1, gen_salt('bf')), updated_at = NOW() WHERE id = $2::uuid`,
      nuevaPassword,
      verificacion.authId
    );
    return { ok: true };
  } catch (err) {
    console.error("[recovery] Error reseteando password:", err);
    return { ok: false, error: t("errorGeneric") };
  }
}

function buildRecoveryEmail({
  nombre,
  resetLink,
  t,
}: {
  nombre: string;
  resetLink: string;
  t: (key: string) => string;
}): string {
  return `<div style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#ffffff;">
  <div style="background:#16a34a;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
    <img src="https://annonia.com/icon-512.png" alt="Annonia" width="72" height="72" style="border-radius:14px;" />
    <h1 style="color:#ffffff;font-size:26px;margin:16px 0 4px;font-weight:700;">Annonia</h1>
  </div>
  <div style="padding:32px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
    <h2 style="color:#111827;font-size:20px;margin:0 0 8px;font-weight:600;">${t("titulo")}</h2>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 8px;">
      ${t("saludo").replace("{nombre}", escapeHtml(nombre))}
    </p>
    <p style="color:#4b5563;font-size:15px;line-height:1.6;margin:0 0 24px;">
      ${t("cuerpo")}
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${resetLink}" target="_blank" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:16px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none;">
        ${t("boton")}
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:0 0 8px;">
      ${t("expiracion")}
    </p>
    <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:0 0 16px;">
      ${t("ignorar")}
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
    <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
      ${t("footer")}
    </p>
  </div>
</div>`;
}
