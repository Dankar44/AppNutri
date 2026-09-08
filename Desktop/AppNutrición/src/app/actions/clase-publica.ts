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
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { sanitizeString, sanitizeStringOptional, validateEmail } from "@/lib/validation";
import { checkRateLimit, LIMITES } from "@/lib/rate-limit";
import { getLocale } from "@/i18n/locale";
import { dominiosDeLicencia, licenciaVigente, cursoTerminado } from "@/lib/docencia";
import { plazasLibresDeLicencia, conPlazaDeLaBolsa } from "@/lib/docencia-bolsa";
import { getCurrentDietista } from "./auth";
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
      licenciaDocente: { select: { institucion: true, dominioEmail: true, activa: true, fechaFin: true } },
    },
  });
  // Sin licencia no hay bolsa que respetar, así que no se admiten altas: solo pasa si a alguien
  // le borran la licencia por SQL (la relación se queda en NULL), pero sin esto no habría tope.
  if (!clase || clase.archivada || !clase.invitacionAbierta || !clase.licenciaDocenteId) return null;
  if (clase.fechaFinCurso) {
    const fin = new Date(clase.fechaFinCurso);
    fin.setHours(23, 59, 59, 999);
    if (fin.getTime() < Date.now()) return null;
  }
  // `activa` no basta: una licencia del curso pasado sigue activa pero con la fecha pasada.
  if (!licenciaVigente(clase.licenciaDocente)) return null;

  return {
    nombre: clase.nombre,
    institucion: clase.licenciaDocente?.institucion ?? null,
    dominios: dominiosDeLicencia(clase.licenciaDocente?.dominioEmail),
    plazasLibres: clase.licenciaDocenteId ? await plazasLibresDeLicencia(clase.licenciaDocenteId) : 0,
  };
}

/**
 * Alta desde el enlace con la sesión que ya hay abierta en el navegador: un clic y dentro
 * (Guillermo, 4 sep 2026: "si ya estoy logueado, la gracia es que se me agregue automáticamente").
 * Las mismas condiciones que el alta normal: clase viva, enlace abierto, licencia vigente, plaza.
 */
export async function apuntarmeConMiCuenta(token: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.rolDocente === "PROFESOR") return { ok: false, error: t("docencia.profesorNoAlumno") };

  const clase = await prisma.clase.findUnique({
    where: { tokenInvitacion: token },
    select: {
      id: true, archivada: true, invitacionAbierta: true, fechaFinCurso: true, licenciaDocenteId: true,
      licenciaDocente: { select: { activa: true, fechaFin: true } },
    },
  });
  if (!clase || clase.archivada || !clase.invitacionAbierta || !clase.licenciaDocenteId) {
    return { ok: false, error: t("docencia.enlaceClaseNoValido") };
  }
  if (!licenciaVigente(clase.licenciaDocente) || cursoTerminado(clase.fechaFinCurso)) {
    return { ok: false, error: t("docencia.enlaceClaseNoValido") };
  }

  const hecho = await conPlazaDeLaBolsa(clase.licenciaDocenteId, { alumnoId: dietista.id, email: dietista.email }, async (tx) => {
    await tx.alumnoClase.upsert({
      where: { claseId_alumnoId: { claseId: clase.id, alumnoId: dietista.id } },
      create: { claseId: clase.id, alumnoId: dietista.id },
      update: { activa: true, bajaAt: null },
    });
    // Solo se le pone el rol si no tenía ninguno; su cuenta sigue siendo suya (cuentaDeClase false).
    await tx.dietista.updateMany({
      where: { id: dietista.id, rolDocente: null },
      data: { rolDocente: "ALUMNO", licenciaDocenteId: clase.licenciaDocenteId },
    });
  });
  if (!hecho.ok) return { ok: false, error: t("docencia.sinPlazas") };
  return { ok: true };
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
  const locale = await getLocale();

  const clase = await prisma.clase.findUnique({
    where: { tokenInvitacion: data.token },
    select: {
      id: true, archivada: true, invitacionAbierta: true, fechaFinCurso: true,
      licenciaDocenteId: true, profesorId: true,
      licenciaDocente: { select: { activa: true, fechaFin: true } },
    },
  });
  if (!clase || clase.archivada || !clase.invitacionAbierta || !clase.licenciaDocenteId) {
    return { ok: false, error: t("docencia.enlaceClaseNoValido") };
  }
  if (!licenciaVigente(clase.licenciaDocente)) {
    return { ok: false, error: t("docencia.enlaceClaseNoValido") };
  }
  if (clase.fechaFinCurso) {
    const fin = new Date(clase.fechaFinCurso);
    fin.setHours(23, 59, 59, 999);
    if (fin.getTime() < Date.now()) return { ok: false, error: t("docencia.enlaceClaseNoValido") };
  }

  const email = validateEmail(sanitizeString(data.email, 200).normalize("NFC"));
  if (!email) return { ok: false, error: t("admin.emailNoValido") };
  const nombre = sanitizeString(data.nombre, 100);
  if (!nombre) return { ok: false, error: t("admin.nombreObligatorio") };
  const apellidos = sanitizeStringOptional(data.apellidos, 100) ?? "";

  // Sin tope, un enlace filtrado deja crear cuentas hasta agotar la bolsa que paga la facultad.
  const cabeceras = await headers();
  const ip = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim()
    || cabeceras.get("x-real-ip") || "desconocida";
  if (!checkRateLimit({ key: `clase:${ip}`, ...LIMITES.apuntarseAClase }).ok) {
    return { ok: false, error: t("auth.rateLimitRegistro") };
  }

  const existente = await prisma.dietista.findUnique({
    where: { email },
    select: { id: true, authId: true, rolDocente: true },
  });

  try {
    if (existente) {
      // Que el correo tenga cuenta no demuestra que quien rellena el formulario sea su dueño: sin
      // esto, cualquiera con el enlace de la clase metía en el aula la cuenta de otro y le gastaba
      // una plaza a la facultad (auditoría 1 sep 2026). Se le pide su contraseña de siempre.
      const suApp = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const { error } = await suApp.auth.signInWithPassword({ email, password: data.password ?? "" });
      if (error) return { ok: false, error: t("docencia.contrasenaDeSuCuenta") };

      const hecho = await conPlazaDeLaBolsa(
        clase.licenciaDocenteId,
        { alumnoId: existente.id, email },
        async (tx) => {
          await tx.alumnoClase.upsert({
            where: { claseId_alumnoId: { claseId: clase.id, alumnoId: existente.id } },
            create: { claseId: clase.id, alumnoId: existente.id },
            update: { activa: true, bajaAt: null },
          });
          // Solo se le pone el rol si no tenía ninguno, y `cuentaDeClase` se queda en false: su
          // cuenta sigue siendo suya, no nace de esta clase.
          await tx.dietista.updateMany({
            where: { id: existente.id, rolDocente: null },
            data: { rolDocente: "ALUMNO", licenciaDocenteId: clase.licenciaDocenteId },
          });
        },
      );
      if (!hecho.ok) return { ok: false, error: t("docencia.sinPlazas") };
      return { ok: true, yaTeniaCuenta: true };
    }

    if (!data.password || data.password.length < 6) {
      return { ok: false, error: t("admin.contrasenaMinima") };
    }
    const existingAuth = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`, email,
    );
    if (existingAuth.length > 0) return { ok: false, error: t("admin.yaExisteUsuarioEmail") };

    // La plaza se coge dentro de la transacción, justo antes de crear la cuenta: entre que se
    // abre la página y se envía el formulario pueden haberse apuntado otros.
    const alta = await conPlazaDeLaBolsa(clase.licenciaDocenteId, { email }, async (tx) => {
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
      const alumno = await tx.dietista.create({
        data: {
          authId, email, nombre, apellidos,
          verificado: true,
          fuenteContacto: "universidad",
          rolDocente: "ALUMNO",
          licenciaDocenteId: clase.licenciaDocenteId,
          cuentaDeClase: true,
        },
      });
      await tx.alumnoClase.create({ data: { claseId: clase.id, alumnoId: alumno.id } });
      return alumno.id;
    });
    // Todo lo de arriba va en una sola transacción: si algo falla, no queda ni el usuario de
    // autenticación ni la ficha a medias. Antes se limpiaba a mano y la ficha se quedaba, con lo
    // que ese correo se volvía inservible para siempre (auditoría 1 sep 2026).
    if (!alta.ok) return { ok: false, error: t("docencia.sinPlazas") };

    // Si esto falla, la cuenta queda sin paciente de ejemplo y nadie se entera: al menos que se
    // vea en el log. No se espera a propósito: el alta ya está hecha y no debe caerse por esto.
    crearPacienteDemoSiNoExiste(prisma, alta.valor, locale).catch((e) =>
      console.error("[docencia] Sin paciente de ejemplo para el alumno del enlace:", e),
    );
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error apuntando a la clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}
