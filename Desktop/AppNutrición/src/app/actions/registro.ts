"use server";

import { headers } from "next/headers";
import { checkRateLimit, LIMITES } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { sanitizeString, sanitizeStringOptional } from "@/lib/validation";
import { generateVerifyToken, sendVerificationEmail } from "@/lib/verify-email";
import { getLocale } from "next-intl/server";

export async function verificarLimiteRegistro(): Promise<{
  ok: boolean;
  error?: string;
  retryAfter?: number;
}> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";

  const result = checkRateLimit({
    key: `reg:${ip}`,
    ...LIMITES.registro,
  });

  if (!result.ok) {
    return {
      ok: false,
      error: "Demasiados intentos de registro. Inténtalo de nuevo en una hora.",
      retryAfter: result.retryAfter,
    };
  }

  return { ok: true };
}

export async function verificarEmailDisponible(email: string): Promise<{
  disponible: boolean;
  error?: string;
}> {
  const t = await getTranslations("validation");
  const normalized = email.trim().toLowerCase();

  const dietista = await prisma.dietista.findFirst({
    where: { email: normalized },
    select: { id: true },
  });
  if (dietista) {
    return { disponible: false, error: t("auth.emailYaRegistrado") };
  }

  const paciente = await prisma.paciente.findFirst({
    where: { email: normalized },
    select: { id: true },
  });
  if (paciente) {
    return { disponible: false, error: t("auth.emailRegistradoComoPaciente") };
  }

  const authUser = await prisma.$queryRawUnsafe<{ id: string; email_confirmed_at: Date | null }[]>(
    `SELECT id, email_confirmed_at FROM auth.users WHERE email = $1 LIMIT 1`,
    normalized,
  );

  if (authUser.length > 0) {
    if (!authUser[0].email_confirmed_at) {
      // Registro a medias (email nunca confirmado): limpiarlo para permitir re-registro.
      // Antes los DELETE ignoraban el error con .catch → si el borrado fallaba, se devolvía
      // "disponible" igual y el INSERT posterior chocaba con el UNIQUE de email, dejando al
      // usuario atascado en "correo en uso" sin salida. Ahora, si no se puede limpiar, se avisa.
      const oldAuthId = authUser[0].id;
      try {
        await prisma.$queryRawUnsafe(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, oldAuthId);
        await prisma.$queryRawUnsafe(`DELETE FROM auth.users WHERE id = $1::uuid`, oldAuthId);
      } catch (e) {
        console.error("[registro] No se pudo limpiar el registro a medias:", e);
        return { disponible: false, error: t("auth.errorRegistro") };
      }
      return { disponible: true };
    }
    return { disponible: false, error: t("auth.emailYaRegistrado") };
  }

  return { disponible: true };
}

export async function registrarCuenta(data: {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  especialidad?: string;
  fuente?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");

  const nombre = sanitizeString(data.nombre, 100);
  if (!nombre) return { ok: false, error: t("perfil.nombreObligatorio") };
  const apellidos = sanitizeString(data.apellidos, 100);
  if (!apellidos) return { ok: false, error: t("perfil.apellidosObligatorios") };
  const email = data.email.trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: false, error: t("admin.emailNoValido") };
  if (data.password.length < 6) return { ok: false, error: t("password.longitudMinima") };
  const especialidad = sanitizeStringOptional(data.especialidad, 200);

  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  const rl = checkRateLimit({ key: `reg:${ip}`, ...LIMITES.registro });
  if (!rl.ok) return { ok: false, error: t("auth.rateLimitRegistro") };

  const emailCheck = await verificarEmailDisponible(email);
  if (!emailCheck.disponible) return { ok: false, error: emailCheck.error };

  try {
    const authRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO auth.users (
         instance_id, id, aud, role, email, encrypted_password,
         email_confirmed_at, created_at, updated_at,
         raw_app_meta_data, raw_user_meta_data,
         is_sso_user, is_anonymous,
         confirmation_token, recovery_token,
         email_change_token_new, email_change, email_change_token_current,
         reauthentication_token, phone_change, phone_change_token
       ) VALUES (
         '00000000-0000-0000-0000-000000000000',
         gen_random_uuid(),
         'authenticated', 'authenticated',
         $1, crypt($2, gen_salt('bf')),
         NULL, NOW(), NOW(),
         '{"provider":"email","providers":["email"]}',
         jsonb_build_object('nombre', $3::text, 'apellidos', $4::text, 'especialidad', $5::text, 'fuenteContacto', $6::text, 'creadoPor', $6::text, 'email_verified', false, 'phone_verified', false),
         false, false,
         '', '', '', '', '', '', '', ''
       ) RETURNING id`,
      email, data.password, nombre, apellidos, especialidad || "", data.fuente || "",
    );

    const authId = authRows[0].id;

    await prisma.$queryRawUnsafe(
      `INSERT INTO auth.identities (
         id, user_id, provider_id, provider, identity_data,
         last_sign_in_at, created_at, updated_at
       ) VALUES (
         gen_random_uuid(), $1::uuid, $1::text, 'email',
         jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', false, 'provider', 'email'),
         NOW(), NOW(), NOW()
       )`,
      authId, email,
    );

    try {
      const proto = headerList.get("x-forwarded-proto") || "https";
      const host = headerList.get("host") || "localhost:3000";
      const appUrl = `${proto}://${host}`;
      let locale: "es" | "pt" = "es";
      try { const l = await getLocale(); if (l === "pt") locale = "pt"; } catch { /* default to es */ }
      const token = await generateVerifyToken(authId, email);
      await sendVerificationEmail(email, nombre, token, appUrl, locale);
    } catch (emailErr) {
      console.error("[registro] Error enviando email de verificación:", emailErr);
      await prisma.$queryRawUnsafe(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, authId).catch((e) => console.warn("[registro] Rollback auth.identities falló:", e));
      await prisma.$queryRawUnsafe(`DELETE FROM auth.users WHERE id = $1::uuid`, authId).catch((e) => console.warn("[registro] Rollback auth.users falló:", e));
      return { ok: false, error: t("auth.errorEnvioVerificacion") };
    }

    return { ok: true };
  } catch (e) {
    console.error("[registro] Error creando cuenta:", e);
    return { ok: false, error: t("auth.errorRegistro") };
  }
}

/**
 * Reenvía el email de verificación a una cuenta que aún no ha confirmado su email
 * (registro a medias). Pensado para el botón "Reenviar" del login cuando sale
 * "verifica tu email". No revela si el email existe: siempre devuelve ok salvo
 * fallo de envío (que sí se reporta, gracias al control de errores de Resend).
 */
export async function reenviarVerificacion(email: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return { ok: false, error: t("admin.emailNoValido") };

  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  const rl = checkRateLimit({ key: `reenvio:${ip}`, ...LIMITES.registro });
  if (!rl.ok) return { ok: false, error: t("auth.rateLimitRegistro") };

  const rows = await prisma.$queryRawUnsafe<{ id: string; nombre: string | null }[]>(
    `SELECT id, raw_user_meta_data->>'nombre' AS nombre FROM auth.users WHERE email = $1 AND email_confirmed_at IS NULL LIMIT 1`,
    normalized,
  );

  // Solo reenviamos si hay una cuenta sin verificar; si no, devolvemos ok igual
  // (no revelar si el email existe). Un fallo de envío SÍ se reporta.
  if (rows.length > 0) {
    try {
      const proto = headerList.get("x-forwarded-proto") || "https";
      const host = headerList.get("host") || "localhost:3000";
      const appUrl = `${proto}://${host}`;
      let locale: "es" | "pt" = "es";
      try { const l = await getLocale(); if (l === "pt") locale = "pt"; } catch { /* default es */ }
      const token = await generateVerifyToken(rows[0].id, normalized);
      await sendVerificationEmail(normalized, rows[0].nombre || "", token, appUrl, locale);
    } catch (e) {
      console.error("[reenviarVerificacion] Error reenviando email:", e);
      return { ok: false, error: t("auth.errorEnvioVerificacion") };
    }
  }

  return { ok: true };
}
