"use server";

/**
 * #39 — El enlace de clase: lo que ve y hace quien todavía no tiene cuenta.
 *
 * Sin sesión a propósito. Lo que autoriza es el token; lo que lo protege es que el profesor pueda
 * cerrarlo y que el tope de la bolsa no se pueda pasar. Se descartó pedir aprobación del profesor
 * (27 ago 2026): le obligaría a hacer el trabajo dos veces, que es justo lo que se le quiere ahorrar.
 */

import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { isNextNavigation } from "@/lib/utils";
import { sanitizeString, sanitizeStringOptional } from "@/lib/validation";
import { dominiosDeLicencia } from "@/lib/docencia";
import { plazasLibresDeLicencia, alumnoYaOcupaPlaza } from "@/lib/docencia-bolsa";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";

export interface ClasePublica {
  nombre: string;
  institucion: string | null;
  dominios: string[];
  plazasLibres: number;
}

/** Devuelve null si el enlace no vale, sin decir por qué: no es asunto de quien lo abre. */
export async function getClasePorToken(token: string): Promise<ClasePublica | null> {
  if (!token) return null;
  const clase = await prisma.clase.findUnique({
    where: { tokenInvitacion: token },
    select: {
      id: true, nombre: true, archivada: true, invitacionAbierta: true,
      fechaFinCurso: true, licenciaDocenteId: true,
      licenciaDocente: { select: { institucion: true, dominioEmail: true, activa: true } },
    },
  });
  if (!clase || clase.archivada || !clase.invitacionAbierta) return null;
  if (clase.fechaFinCurso) {
    const fin = new Date(clase.fechaFinCurso);
    fin.setHours(23, 59, 59, 999);
    if (fin.getTime() < Date.now()) return null;
  }
  if (clase.licenciaDocente && !clase.licenciaDocente.activa) return null;

  return {
    nombre: clase.nombre,
    institucion: clase.licenciaDocente?.institucion ?? null,
    dominios: dominiosDeLicencia(clase.licenciaDocente?.dominioEmail),
    plazasLibres: clase.licenciaDocenteId ? await plazasLibresDeLicencia(clase.licenciaDocenteId) : 0,
  };
}

/**
 * Alta desde el enlace: crea la cuenta con la contraseña que elige el alumno y su matrícula.
 * Si ese correo ya tiene cuenta, no se crea otra: se le matricula y conserva todo lo suyo.
 */
export async function apuntarseAClase(data: {
  token: string;
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; error?: string; yaTeniaCuenta?: boolean }> {
  const t = await getTranslations("validation");

  const clase = await prisma.clase.findUnique({
    where: { tokenInvitacion: data.token },
    select: {
      id: true, archivada: true, invitacionAbierta: true, fechaFinCurso: true,
      licenciaDocenteId: true, profesorId: true,
      licenciaDocente: { select: { activa: true } },
    },
  });
  if (!clase || clase.archivada || !clase.invitacionAbierta) {
    return { ok: false, error: t("docencia.enlaceClaseNoValido") };
  }
  if (clase.licenciaDocente && !clase.licenciaDocente.activa) {
    return { ok: false, error: t("docencia.enlaceClaseNoValido") };
  }
  if (clase.fechaFinCurso) {
    const fin = new Date(clase.fechaFinCurso);
    fin.setHours(23, 59, 59, 999);
    if (fin.getTime() < Date.now()) return { ok: false, error: t("docencia.enlaceClaseNoValido") };
  }

  const email = sanitizeString(data.email, 200).toLowerCase().trim();
  if (!email || !email.includes("@")) return { ok: false, error: t("admin.emailNoValido") };
  const nombre = sanitizeString(data.nombre, 100);
  if (!nombre) return { ok: false, error: t("admin.nombreObligatorio") };
  const apellidos = sanitizeStringOptional(data.apellidos, 100) ?? "";

  const existente = await prisma.dietista.findUnique({ where: { email }, select: { id: true, rolDocente: true } });

  // La plaza se comprueba justo antes de ocuparla, no antes de pedir los datos: entre que se abre
  // la página y se envía el formulario pueden haberse apuntado otros.
  if (clase.licenciaDocenteId) {
    const yaDentro = existente
      ? await alumnoYaOcupaPlaza(clase.licenciaDocenteId, existente.id)
      : false;
    if (!yaDentro && (await plazasLibresDeLicencia(clase.licenciaDocenteId)) <= 0) {
      return { ok: false, error: t("docencia.sinPlazas") };
    }
  }

  try {
    if (existente) {
      await prisma.$transaction([
        prisma.alumnoClase.upsert({
          where: { claseId_alumnoId: { claseId: clase.id, alumnoId: existente.id } },
          create: { claseId: clase.id, alumnoId: existente.id },
          update: { activa: true, bajaAt: null },
        }),
        prisma.dietista.updateMany({
          where: { id: existente.id, rolDocente: null },
          data: { rolDocente: "ALUMNO", licenciaDocenteId: clase.licenciaDocenteId },
        }),
      ]);
      return { ok: true, yaTeniaCuenta: true };
    }

    if (!data.password || data.password.length < 6) {
      return { ok: false, error: t("admin.contrasenaMinima") };
    }
    const existingAuth = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`, email,
    );
    if (existingAuth.length > 0) return { ok: false, error: t("admin.yaExisteUsuarioEmail") };

    const authRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
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

    try {
      await prisma.$queryRawUnsafe(
        `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
         VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
           jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'),
           NOW(), NOW(), NOW())`,
        authId, email,
      );
      const alumno = await prisma.dietista.create({
        data: {
          authId, email, nombre, apellidos,
          verificado: true,
          fuenteContacto: "universidad",
          rolDocente: "ALUMNO",
          licenciaDocenteId: clase.licenciaDocenteId,
          cuentaDeClase: true,
        },
      });
      await prisma.alumnoClase.create({ data: { claseId: clase.id, alumnoId: alumno.id } });
      crearPacienteDemoSiNoExiste(prisma, alumno.id, "es").catch(() => {});
      return { ok: true };
    } catch (err) {
      // Sin esto, ese correo quedaría bloqueado para siempre con un usuario sin ficha.
      await prisma.$queryRawUnsafe(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, authId).catch(() => {});
      await prisma.$queryRawUnsafe(`DELETE FROM auth.users WHERE id = $1::uuid`, authId).catch(() => {});
      throw err;
    }
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error apuntando a la clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}
