/**
 * Lo común a las dos altas que se hacen desde un enlace público: la del profesor por el enlace de
 * profesorado y la del alumno por el de su clase.
 *
 * La cuenta nace SIN el correo confirmado y se manda el correo de verificación, igual que en el
 * registro de siempre. Antes se creaba ya confirmada y se entraba directo, y eso permitía apuntarse
 * con el correo de cualquiera —y gastarle una plaza a la universidad— sin tener acceso a ese buzón
 * (Guillermo, 9 sep 2026: "encima no tengo que hacer doble verificación, entro directamente").
 *
 * Quien ya tiene cuenta no pasa por aquí: esa ya está verificada y entra con su contraseña.
 */

import type { Prisma } from "@/generated/prisma/client";
import { headers } from "next/headers";
import { getLocale } from "@/i18n/locale";
import { generateVerifyToken, sendVerificationEmail } from "@/lib/verify-email";

/**
 * El usuario de autenticación y su identidad, con el correo por confirmar.
 *
 * Va dentro de la transacción del alta a propósito: usuario, identidad y ficha se crean juntos o no
 * se crea nada. Hacerlo por partes dejaba cuentas a medias que inutilizaban ese correo para siempre
 * (auditoría 1 sep 2026).
 */
export async function crearUsuarioSinVerificar(
  tx: Prisma.TransactionClient,
  datos: { email: string; password: string; nombre: string; apellidos: string },
): Promise<string> {
  const filas = await tx.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO auth.users (
       instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token
     ) VALUES (
       '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NULL, NOW(), NOW(),
       '{"provider":"email","providers":["email"]}',
       jsonb_build_object('nombre', $3::text, 'apellidos', $4::text, 'email_verified', false, 'phone_verified', false),
       false, false, '', '', '', '', '', '', '', ''
     ) RETURNING id`,
    datos.email, datos.password, datos.nombre, datos.apellidos,
  );
  const authId = filas[0].id;
  await tx.$queryRawUnsafe(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',false,'provider','email'),
       NOW(), NOW(), NOW())`,
    authId, datos.email,
  );
  return authId;
}

export interface EnvioDeVerificacion {
  enviado: boolean;
  /**
   * El enlace en crudo, SOLO fuera de producción.
   *
   * En local no hay servicio de correo configurado, así que sin esto no había forma de probar el
   * alta sin abrir un buzón de verdad por cada cuenta (Guillermo, 9 sep 2026). Este enlace ES la
   * credencial: quien lo tiene entra en la cuenta, por eso nunca sale en producción.
   */
  enlaceDePrueba?: string;
}

/**
 * El correo con el enlace de verificación.
 *
 * Se manda FUERA de la transacción: dentro tendría bloqueada la fila del enlace —y con ella la cola
 * de plazas de toda la universidad— durante lo que tarde el servidor de correo. Si el envío falla,
 * el alta ya está hecha y se le ofrece reenviarlo, que es mejor que tirar la cuenta.
 */
export async function mandarCorreoDeVerificacion(
  authId: string,
  email: string,
  nombre: string,
): Promise<EnvioDeVerificacion> {
  // Doble cierre a propósito: este enlace ES la credencial de la cuenta, así que además de no ser
  // una compilación de producción, la app tiene que estar servida desde una dirección local.
  const enDesarrollo =
    process.env.NODE_ENV !== "production" &&
    !/annonia\.com/i.test(process.env.NEXT_PUBLIC_APP_URL ?? "");
  let enlace = "";
  try {
    const cabeceras = await headers();
    const proto = cabeceras.get("x-forwarded-proto") || "https";
    const host = cabeceras.get("host") || "localhost:3000";
    let locale: "es" | "pt" = "es";
    try { if ((await getLocale()) === "pt") locale = "pt"; } catch { /* es por defecto */ }
    const token = await generateVerifyToken(authId, email);
    const appUrl = `${proto}://${host}`;
    enlace = `${appUrl}/auth/verify-email?token=${token}`;
    await sendVerificationEmail(email, nombre, token, appUrl, locale);
    // En local el correo no sale (lo corta el propio `mailer`), así que el enlace se enseña en la
    // pantalla: si no, no hay manera de probar el alta sin abrir un buzón de verdad por cada
    // cuenta. Se devuelve SIEMPRE que estemos fuera de producción, no solo si el envío falla, que
    // era lo que hacía antes y por eso no aparecía nunca (Guillermo, 9 sep 2026).
    if (enDesarrollo) console.log(`[docencia] Verificación de ${email}: ${enlace}`);
    return { enviado: true, enlaceDePrueba: enDesarrollo ? enlace : undefined };
  } catch (e) {
    console.error("[docencia] No se pudo mandar el correo de verificación:", e);
    return { enviado: false, enlaceDePrueba: enDesarrollo && enlace ? enlace : undefined };
  }
}
