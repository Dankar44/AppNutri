"use server";

/**
 * El enlace con el que una universidad da de alta a su profesorado sin pasarnos los correos.
 *
 * Se le manda al representante, él lo reparte por su facultad y cada profesor se crea la cuenta
 * solo. Quien ya use Annonia entra con la suya y se le añade el rol, sin perder nada.
 *
 * Las plazas se cuentan por USOS y no vuelven: un enlace de 10 admite 10 altas y se agota. Si
 * después un profesor deja la universidad, ese hueco no lo puede coger nadie por ahí; para vender
 * tres más se crea otro enlace de tres (Guillermo, 8 sep 2026). Así el contador solo sube y nadie
 * ve números que cambian solos.
 */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/admin";
import { licenciaVigente } from "@/lib/docencia";
import { getCurrentDietista } from "./auth";
import type { Prisma } from "@/generated/prisma/client";
import { headers } from "next/headers";
import { getLocale } from "@/i18n/locale";
import { checkRateLimit, LIMITES } from "@/lib/rate-limit";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";
import { sanitizeString, sanitizeStringOptional, validateEmail } from "@/lib/validation";
import { sendEmail } from "@/lib/mailer";
import { isNextNavigation, urlPublica } from "@/lib/utils";
import { escapeHtml } from "@/lib/email-citas-template";

export interface EnlaceProfesoresResumen {
  id: string;
  url: string;
  plazas: number;
  usadas: number;
  agotado: boolean;
  enviadoA: string[];
  ultimoEnvioAt: Date | null;
  createdAt: Date;
  /** Quién ha entrado por este enlace. */
  altas: { nombre: string; apellidos: string; email: string }[];
}

function urlDelEnlace(token: string) {
  return `${urlPublica()}/profesorado/${token}`;
}

export async function getEnlacesProfesores(licenciaId: string): Promise<EnlaceProfesoresResumen[]> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  const enlaces = await prisma.enlaceProfesores.findMany({
    where: { licenciaDocenteId: licenciaId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, token: true, plazas: true, usadas: true, enviadoA: true,
      ultimoEnvioAt: true, createdAt: true,
      altas: { select: { nombre: true, apellidos: true, email: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return enlaces.map((e) => ({
    id: e.id,
    url: urlDelEnlace(e.token),
    plazas: e.plazas,
    usadas: e.usadas,
    agotado: e.usadas >= e.plazas,
    enviadoA: e.enviadoA,
    ultimoEnvioAt: e.ultimoEnvioAt,
    createdAt: e.createdAt,
    altas: e.altas,
  }));
}

/** Un enlace nuevo con su cupo. Para ampliar no se toca el anterior: se crea otro. */
export async function crearEnlaceProfesores(
  licenciaId: string,
  plazas: number,
): Promise<{ ok: boolean; error?: string; url?: string }> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");
  const t = await getTranslations("validation");

  const cupo = Math.floor(Number(plazas));
  if (!Number.isFinite(cupo) || cupo < 1 || cupo > 500) {
    return { ok: false, error: t("docencia.plazasNoValidas") };
  }

  const licencia = await prisma.licenciaDocente.findUnique({
    where: { id: licenciaId },
    select: { id: true, maxProfesores: true },
  });
  if (!licencia) return { ok: false, error: t("docencia.licenciaNoEncontrada") };

  try {
    // Las plazas del enlace se suman a las de la universidad: es lo que se acaba de vender.
    const enlace = await prisma.$transaction(async (tx) => {
      const creado = await tx.enlaceProfesores.create({
        data: {
          licenciaDocenteId: licenciaId,
          token: randomUUID().replace(/-/g, ""),
          plazas: cupo,
          creadoPor: admin.email,
        },
        select: { token: true },
      });
      await tx.licenciaDocente.update({
        where: { id: licenciaId },
        data: { maxProfesores: { increment: cupo } },
      });
      return creado;
    });

    revalidatePath(`/admin/universidades/${licenciaId}`);
    return { ok: true, url: urlDelEnlace(enlace.token) };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error creando el enlace de profesores:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/** Manda el enlace por correo a uno o varios representantes. Es el mismo enlace para todos. */
export async function enviarEnlaceProfesores(
  enlaceId: string,
  correos: string,
): Promise<{ ok: boolean; error?: string; enviados?: number }> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");
  const t = await getTranslations("validation");

  const destinatarios = correos
    .split(/[\s,;]+/)
    .map((c) => c.trim().toLowerCase())
    .filter((c) => c.includes("@") && c.length < 200);
  if (destinatarios.length === 0) return { ok: false, error: t("admin.emailNoValido") };

  const enlace = await prisma.enlaceProfesores.findUnique({
    where: { id: enlaceId },
    select: {
      token: true, plazas: true, usadas: true, licenciaDocenteId: true,
      licenciaDocente: { select: { institucion: true } },
    },
  });
  if (!enlace) return { ok: false, error: t("docencia.licenciaNoEncontrada") };

  const url = urlDelEnlace(enlace.token);
  const quedan = Math.max(0, enlace.plazas - enlace.usadas);
  const html = correoDelEnlace(enlace.licenciaDocente.institucion, url, enlace.plazas, quedan);

  let enviados = 0;
  for (const to of destinatarios) {
    const ok = await sendEmail({
      to,
      subject: `Alta de profesorado en Annonia · ${enlace.licenciaDocente.institucion}`,
      html,
    }).then(() => true).catch((err) => {
      console.error("[docencia] Error enviando el enlace de profesores:", err);
      return false;
    });
    if (ok) enviados++;
  }
  if (enviados === 0) return { ok: false, error: t("general.errorDesconocido") };

  await prisma.enlaceProfesores.update({
    where: { id: enlaceId },
    data: { enviadoA: destinatarios, ultimoEnvioAt: new Date() },
  });
  revalidatePath(`/admin/universidades/${enlace.licenciaDocenteId}`);
  return { ok: true, enviados };
}

/**
 * El correo al representante.
 *
 * Lleva el enlace en texto además del botón a propósito: es el único sitio donde lo va a tener, y
 * lo va a reenviar a su profesorado desde su propio correo (Guillermo: "que no lo pierda").
 */
function correoDelEnlace(institucion: string, url: string, plazas: number, quedan: number): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#2c3e37;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="https://annonia.com/icon-512.png" alt="Annonia" width="56" height="56" style="border-radius:12px;" />
    </div>
    <h1 style="font-size:20px;margin:0 0 12px;">Alta del profesorado de ${escapeHtml(institucion)}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hola: ya está listo el acceso docente de <strong>${escapeHtml(institucion)}</strong>, con
      <strong>${plazas} plaza${plazas === 1 ? "" : "s"} de profesor</strong>${quedan !== plazas ? ` (quedan ${quedan})` : ""}.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">
      <strong>Comparte este enlace con el profesorado.</strong> Cada uno se crea su cuenta con la
      contraseña que elija; quien ya use Annonia entrará con la suya de siempre.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${url}" style="background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;display:inline-block;">
        Abrir el enlace
      </a>
    </div>
    <p style="font-size:13px;color:#6b7c74;line-height:1.6;margin:0 0 8px;">
      O cópialo y pégalo donde lo vayas a repartir:
    </p>
    <p style="font-size:13px;line-height:1.6;margin:0 0 20px;word-break:break-all;background:#f3f6f4;padding:12px;border-radius:8px;">
      ${escapeHtml(url)}
    </p>
    <p style="font-size:13px;color:#6b7c74;line-height:1.6;margin:0;">
      <strong>Guarda este correo:</strong> es el único sitio donde tienes el enlace. Deja de admitir
      altas en cuanto se ocupen las ${plazas} plaza${plazas === 1 ? "" : "s"}.
    </p>
  </div>`;
}

/* ─── Lo público: lo que ve y hace quien abre el enlace ─── */

export interface EnlacePublico {
  institucion: string;
  quedan: number;
  agotado: boolean;
}

/** Lo que se enseña a quien abre el enlace. No se dice el cupo total, solo si queda sitio. */
export async function getEnlaceProfesoresPorToken(token: string): Promise<EnlacePublico | null> {
  const enlace = await prisma.enlaceProfesores.findUnique({
    where: { token },
    select: {
      plazas: true, usadas: true,
      licenciaDocente: { select: { institucion: true, activa: true, fechaFin: true } },
    },
  });
  // Vigente de verdad: una licencia caducada no puede seguir dando altas por el enlace.
  if (!enlace || !licenciaVigente(enlace.licenciaDocente)) return null;
  const quedan = Math.max(0, enlace.plazas - enlace.usadas);
  return { institucion: enlace.licenciaDocente.institucion, quedan, agotado: quedan === 0 };
}

/**
 * Coge una plaza del enlace y hace el alta dentro de la misma transacción.
 *
 * La fila del enlace se bloquea (`FOR UPDATE`) mientras se cuenta y se escribe: sin eso, un
 * claustro entero pulsando a la vez entraría entero en la última plaza. Es el mismo cuidado que
 * con la bolsa de alumnos, y viene de un fallo real (auditoría 1 sep 2026).
 */
async function conPlazaDelEnlace<T>(
  token: string,
  trabajo: (tx: Prisma.TransactionClient, enlace: { id: string; licenciaDocenteId: string }) => Promise<T>,
): Promise<{ ok: true; valor: T } | { ok: false; motivo: "noValido" | "agotado" }> {
  return prisma.$transaction(async (tx) => {
    const filas = await tx.$queryRawUnsafe<{ id: string; plazas: number; usadas: number; licenciaDocenteId: string }[]>(
      `SELECT id, plazas, usadas, "licenciaDocenteId" FROM enlaces_profesores WHERE token = $1 FOR UPDATE`,
      token,
    );
    const enlace = filas[0];
    if (!enlace) return { ok: false as const, motivo: "noValido" as const };
    if (enlace.usadas >= enlace.plazas) return { ok: false as const, motivo: "agotado" as const };

    // La licencia se comprueba AQUÍ y no solo al pintar la página: entre que se abre el enlace y se
    // envía el formulario puede haber caducado, y la vista no es lo que autoriza.
    const licencia = await tx.licenciaDocente.findUnique({
      where: { id: enlace.licenciaDocenteId },
      select: { activa: true, fechaFin: true },
    });
    if (!licenciaVigente(licencia)) return { ok: false as const, motivo: "noValido" as const };

    const valor = await trabajo(tx, enlace);
    // El uso se marca aquí, con el alta ya hecha: si algo falla arriba, la plaza no se gasta.
    await tx.enlaceProfesores.update({ where: { id: enlace.id }, data: { usadas: { increment: 1 } } });
    return { ok: true as const, valor };
  }, { timeout: 20_000, maxWait: 15_000 });
}

/** El profesor que YA usa Annonia: se le añade el rol a su cuenta, sin tocar nada de lo suyo. */
export async function unirmeComoProfesor(token: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.rolDocente === "PROFESOR") return { ok: false, error: t("docencia.yaTieneRolDocente") };
  if (dietista.rolDocente === "ALUMNO") return { ok: false, error: t("docencia.alumnoNoProfesor") };

  try {
    const hecho = await conPlazaDelEnlace(token, async (tx, enlace) => {
      await tx.dietista.update({
        where: { id: dietista.id },
        data: {
          rolDocente: "PROFESOR",
          licenciaDocenteId: enlace.licenciaDocenteId,
          altaPorEnlaceId: enlace.id,
        },
      });
    });
    if (!hecho.ok) {
      return { ok: false, error: t(hecho.motivo === "agotado" ? "docencia.enlaceAgotado" : "docencia.enlaceProfesorNoValido") };
    }
    revalidatePath("/profesor");
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error uniendo al profesor con su cuenta:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/**
 * El profesor que NO tiene cuenta: se le crea entera desde el enlace.
 *
 * Todo va en una sola transacción —usuario de autenticación, identidad y ficha— porque si se hace
 * por partes y falla una, queda un usuario a medias y ese correo se vuelve inservible para siempre
 * (auditoría 1 sep 2026, con el enlace de alumnos).
 */
export async function apuntarmeComoProfesor(data: {
  token: string;
  nombre: string;
  apellidos?: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");

  const email = validateEmail(sanitizeString(data.email, 200).normalize("NFC"));
  if (!email) return { ok: false, error: t("admin.emailNoValido") };
  const nombre = sanitizeString(data.nombre, 100);
  if (!nombre) return { ok: false, error: t("admin.nombreObligatorio") };
  const apellidos = sanitizeStringOptional(data.apellidos, 100) ?? "";
  if (!data.password || data.password.length < 8) return { ok: false, error: t("admin.contrasenaMinima") };

  // Un enlace repartido por una facultad entera es público de hecho: sin freno, cualquiera podría
  // probar altas en cadena hasta agotar las plazas de la universidad.
  const cabeceras = await headers();
  const ip = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? cabeceras.get("x-real-ip")?.trim() ?? "desconocida";
  if (!checkRateLimit({ key: `profesorado:${ip}`, ...LIMITES.apuntarseAClase }).ok) {
    return { ok: false, error: t("auth.rateLimitRegistro") };
  }

  const existente = await prisma.dietista.findUnique({ where: { email }, select: { id: true } });
  if (existente) return { ok: false, error: t("docencia.yaExisteEntraConTuCuenta") };
  const existingAuth = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`, email,
  );
  if (existingAuth.length > 0) return { ok: false, error: t("docencia.yaExisteEntraConTuCuenta") };

  try {
    const alta = await conPlazaDelEnlace(data.token, async (tx, enlace) => {
      const authRows = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO auth.users (
           instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
           created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
           confirmation_token, recovery_token, email_change_token_new, email_change,
           email_change_token_current, reauthentication_token, phone_change, phone_change_token
         ) VALUES (
           '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
           $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
           '{"provider":"email","providers":["email"]}',
           jsonb_build_object('nombre', $3::text, 'apellidos', $4::text, 'email_verified', true, 'phone_verified', false),
           false, false, '', '', '', '', '', '', '', ''
         ) RETURNING id`,
        email, data.password, nombre, apellidos,
      );
      const authId = authRows[0].id;
      await tx.$queryRawUnsafe(
        `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
         VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
           jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'),
           NOW(), NOW(), NOW())`,
        authId, email,
      );
      const profesor = await tx.dietista.create({
        data: {
          authId, email, nombre, apellidos,
          verificado: true,
          fuenteContacto: "universidad",
          rolDocente: "PROFESOR",
          licenciaDocenteId: enlace.licenciaDocenteId,
          altaPorEnlaceId: enlace.id,
        },
        select: { id: true },
      });
      return profesor.id;
    });
    if (!alta.ok) {
      return { ok: false, error: t(alta.motivo === "agotado" ? "docencia.enlaceAgotado" : "docencia.enlaceProfesorNoValido") };
    }

    // Su paciente de ejemplo, igual que en cualquier otra alta. Si falla, que quede en el log.
    crearPacienteDemoSiNoExiste(prisma, alta.valor, await getLocale()).catch((e) =>
      console.error("[docencia] Sin paciente de ejemplo para el profesor del enlace:", e),
    );
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error dando de alta al profesor por el enlace:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}
