"use server";

/**
 * #39 — Invitaciones del módulo docente.
 *
 * Nadie le pone la contraseña a nadie: se envía un correo con un enlace y la persona completa su
 * registro con su propia clave, como en cualquier alta normal. Es el mismo mecanismo que usarán
 * los alumnos en la fase 2, por eso todo va parametrizado por rol.
 */

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isNextNavigation, urlPublica } from "@/lib/utils";
import { sanitizeString, sanitizeStringOptional } from "@/lib/validation";
import { sendEmail } from "@/lib/mailer";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";

/** Un mes: tiempo de sobra para que un profesor abra un correo, y no eterno. */
const DIAS_DE_VALIDEZ = 30;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function correoInvitacion(institucion: string, enlace: string): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#2c3e37;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="https://annonia.com/icon-512.png" alt="Annonia" width="56" height="56" style="border-radius:12px;" />
    </div>
    <h1 style="font-size:20px;margin:0 0 12px;">Te han dado acceso de profesor en Annonia</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hola: se ha creado el acceso docente de <strong>${escapeHtml(institucion)}</strong> y estás invitado
      como profesor.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
      Para empezar, crea tu cuenta con la contraseña que tú elijas:
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${enlace}" style="background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;display:inline-block;">
        Crear mi cuenta
      </a>
    </div>
    <p style="font-size:13px;color:#6b7c74;line-height:1.6;margin:0;">
      El enlace caduca en ${DIAS_DE_VALIDEZ} días. Si no esperabas este correo, puedes ignorarlo.
    </p>
  </div>`;
}

function correoRolConcedido(institucion: string): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#2c3e37;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="https://annonia.com/icon-512.png" alt="Annonia" width="56" height="56" style="border-radius:12px;" />
    </div>
    <h1 style="font-size:20px;margin:0 0 12px;">Ya tienes acceso de profesor</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hola: tu cuenta de Annonia ya tiene acceso docente de <strong>${escapeHtml(institucion)}</strong>.
      Entra con tu correo y tu contraseña de siempre; tus pacientes y tus dietas siguen donde estaban.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${urlPublica()}/login" style="background:#16a34a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;display:inline-block;">
        Entrar en Annonia
      </a>
    </div>
  </div>`;
}

export interface ResultadoInvitacion {
  ok: boolean;
  error?: string;
  /** "invitada" = se le ha enviado el enlace de registro; "asignada" = ya tenía cuenta. */
  resultado?: "invitada" | "asignada";
  enlace?: string;
}

/**
 * Invita a un profesor por correo. Si ese correo YA tiene cuenta en Annonia no se crea otra: se le
 * añade el rol y se le avisa, que es lo que se espera de un nutricionista que ya es usuario.
 */
export async function invitarProfesor(data: {
  licenciaId: string;
  email: string;
}): Promise<ResultadoInvitacion> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("validation");

  const email = sanitizeString(data.email, 200).toLowerCase().trim();
  if (!email || !email.includes("@")) return { ok: false, error: t("admin.emailNoValido") };

  const licencia = await prisma.licenciaDocente.findUnique({
    where: { id: data.licenciaId },
    select: { id: true, institucion: true, maxProfesores: true },
  });
  if (!licencia) return { ok: false, error: t("docencia.licenciaNoEncontrada") };

  // El cupo se cuenta con los profesores que ya hay MÁS las invitaciones sin usar: si no, se
  // podrían mandar diez invitaciones para tres plazas y el problema aparecería al aceptarlas.
  const [profesores, pendientes] = await Promise.all([
    prisma.dietista.count({ where: { licenciaDocenteId: licencia.id, rolDocente: "PROFESOR" } }),
    prisma.invitacionDocente.count({
      where: {
        licenciaDocenteId: licencia.id,
        rol: "PROFESOR",
        aceptadaAt: null,
        expiraAt: { gte: new Date() },
      },
    }),
  ]);
  if (profesores + pendientes >= licencia.maxProfesores) {
    return { ok: false, error: t("docencia.sinCupoProfesores", { max: licencia.maxProfesores }) };
  }

  try {
    // ¿Ya es usuario de Annonia? Entonces no hay registro que hacer.
    const existente = await prisma.dietista.findUnique({
      where: { email },
      select: { id: true, rolDocente: true },
    });

    if (existente) {
      if (existente.rolDocente) return { ok: false, error: t("docencia.yaTieneRolDocente") };
      await prisma.dietista.update({
        where: { id: existente.id },
        data: { rolDocente: "PROFESOR", licenciaDocenteId: licencia.id },
      });
      sendEmail({
        to: email,
        subject: "Ya tienes acceso de profesor en Annonia",
        html: correoRolConcedido(licencia.institucion),
      }).catch((err) => console.error("[docencia] Error enviando aviso de rol:", err));

      revalidatePath("/admin/universidades");
      revalidatePath(`/admin/universidades/${licencia.id}`);
      revalidatePath("/admin/dietistas");
      return { ok: true, resultado: "asignada" };
    }

    // Invitación nueva: se anulan las anteriores del mismo correo y licencia para que solo haya
    // un enlace vivo (si se reenvía, el viejo deja de servir).
    await prisma.invitacionDocente.deleteMany({
      where: { email, licenciaDocenteId: licencia.id, aceptadaAt: null },
    });

    const token = randomBytes(24).toString("base64url");
    const expiraAt = new Date(Date.now() + DIAS_DE_VALIDEZ * 24 * 60 * 60 * 1000);
    await prisma.invitacionDocente.create({
      data: {
        token,
        email,
        rol: "PROFESOR",
        licenciaDocenteId: licencia.id,
        invitadoPor: admin.email,
        expiraAt,
      },
    });

    const enlace = `${urlPublica()}/invitacion/${token}`;
    sendEmail({
      to: email,
      subject: `Te han invitado como profesor en Annonia — ${licencia.institucion}`,
      html: correoInvitacion(licencia.institucion, enlace),
    }).catch((err) => console.error("[docencia] Error enviando invitación:", err));

    revalidatePath(`/admin/universidades/${licencia.id}`);
    return { ok: true, resultado: "invitada", enlace };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error invitando profesor:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/** Anula una invitación que aún no se ha usado. */
export async function cancelarInvitacionDocente(id: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("validation");
  try {
    const inv = await prisma.invitacionDocente.findUnique({
      where: { id },
      select: { licenciaDocenteId: true, aceptadaAt: true },
    });
    if (!inv) return { ok: false, error: t("docencia.invitacionNoValida") };
    if (inv.aceptadaAt) return { ok: false, error: t("docencia.invitacionYaUsada") };

    await prisma.invitacionDocente.delete({ where: { id } });
    if (inv.licenciaDocenteId) revalidatePath(`/admin/universidades/${inv.licenciaDocenteId}`);
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error cancelando invitación:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

export interface InvitacionPublica {
  email: string;
  institucion: string | null;
  rol: "PROFESOR" | "ALUMNO";
}

/**
 * Datos que se le enseñan a quien abre el enlace, sin exigir sesión. Devuelve null si el enlace no
 * vale (no existe, ya se usó o caducó) para no dar pistas sobre qué invitaciones existen.
 */
export async function getInvitacionPorToken(token: string): Promise<InvitacionPublica | null> {
  if (!token) return null;
  const inv = await prisma.invitacionDocente.findUnique({
    where: { token },
    select: {
      email: true,
      rol: true,
      aceptadaAt: true,
      expiraAt: true,
      licenciaDocente: { select: { institucion: true } },
    },
  });
  if (!inv || inv.aceptadaAt || inv.expiraAt.getTime() < Date.now()) return null;
  return {
    email: inv.email,
    institucion: inv.licenciaDocente?.institucion ?? null,
    rol: inv.rol,
  };
}

/**
 * Completa el registro desde el enlace del correo: crea la cuenta con la contraseña que ha elegido
 * la persona y le deja puesto el rol y la licencia. No hace falta sesión (es un alta), pero el
 * token es lo único que autoriza.
 */
export async function aceptarInvitacionDocente(data: {
  token: string;
  nombre: string;
  apellidos: string;
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");

  const inv = await prisma.invitacionDocente.findUnique({
    where: { token: data.token },
    select: {
      id: true, email: true, rol: true, licenciaDocenteId: true, invitadoPor: true,
      aceptadaAt: true, expiraAt: true,
      licenciaDocente: { select: { institucion: true } },
    },
  });
  if (!inv || inv.aceptadaAt || inv.expiraAt.getTime() < Date.now()) {
    return { ok: false, error: t("docencia.invitacionNoValida") };
  }

  const nombre = sanitizeString(data.nombre, 100);
  if (!nombre) return { ok: false, error: t("admin.nombreObligatorio") };
  const apellidos = sanitizeStringOptional(data.apellidos, 100) ?? "";
  if (!data.password || data.password.length < 6) {
    return { ok: false, error: t("admin.contrasenaMinima") };
  }

  const email = inv.email;

  // Si mientras tanto se ha registrado por su cuenta, no se crea otra: se le da el rol.
  const yaExiste = await prisma.dietista.findUnique({ where: { email }, select: { id: true, rolDocente: true } });
  if (yaExiste) {
    if (!yaExiste.rolDocente) {
      await prisma.dietista.update({
        where: { id: yaExiste.id },
        data: { rolDocente: inv.rol, licenciaDocenteId: inv.licenciaDocenteId },
      });
    }
    await prisma.invitacionDocente.update({
      where: { id: inv.id },
      data: { aceptadaAt: new Date(), aceptadaPorId: yaExiste.id },
    });
    return { ok: true };
  }

  const existingAuth = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`,
    email,
  );
  if (existingAuth.length > 0) return { ok: false, error: t("admin.yaExisteUsuarioEmail") };

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
       NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}',
       jsonb_build_object('nombre', $3::text, 'apellidos', $4::text, 'email_verified', true, 'phone_verified', false),
       false, false,
       '', '', '', '', '', '', '', ''
     ) RETURNING id`,
    email, data.password, nombre, apellidos,
  );
  const authId = authRows[0].id;

  try {
    await prisma.$queryRawUnsafe(
      `INSERT INTO auth.identities (
         id, user_id, provider_id, provider, identity_data,
         last_sign_in_at, created_at, updated_at
       ) VALUES (
         gen_random_uuid(), $1::uuid, $1::text, 'email',
         jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true, 'provider', 'email'),
         NOW(), NOW(), NOW()
       )`,
      authId, email,
    );

    const dietista = await prisma.dietista.create({
      data: {
        authId,
        email,
        nombre,
        apellidos,
        verificado: true,
        fuenteContacto: "universidad",
        creadoPor: inv.invitadoPor ?? undefined,
        rolDocente: inv.rol,
        licenciaDocenteId: inv.licenciaDocenteId,
      },
    });

    await prisma.$queryRawUnsafe(
      `INSERT INTO suscripciones (id, "dietistaId", plan, estado, "fechaInicio", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'PROFESIONAL', 'ACTIVA', NOW(), NOW(), NOW())`,
      dietista.id,
    );

    crearPacienteDemoSiNoExiste(prisma, dietista.id, "es").catch(() => {});

    await prisma.invitacionDocente.update({
      where: { id: inv.id },
      data: { aceptadaAt: new Date(), aceptadaPorId: dietista.id },
    });

    revalidatePath("/admin/universidades");
    if (inv.licenciaDocenteId) revalidatePath(`/admin/universidades/${inv.licenciaDocenteId}`);
    revalidatePath("/admin/dietistas");
    return { ok: true };
  } catch (err) {
    // Si algo falla después de crear el usuario de autenticación, se deshace: si no, ese correo
    // quedaría bloqueado para siempre sin ficha (los "zombis" de auth.users).
    await prisma.$queryRawUnsafe(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, authId)
      .catch((e) => console.warn("[docencia] Rollback identities falló:", e));
    await prisma.$queryRawUnsafe(`DELETE FROM auth.users WHERE id = $1::uuid`, authId)
      .catch((e) => console.warn("[docencia] Rollback users falló:", e));
    if (isNextNavigation(err)) throw err;
    console.error("[docencia] Error aceptando invitación:", err);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}
