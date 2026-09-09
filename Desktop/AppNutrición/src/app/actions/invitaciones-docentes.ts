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
import { getLocale } from "@/i18n/locale";
import { cursoTerminado, licenciaVigente } from "@/lib/docencia";
import { plazasLibresDeLicencia, plazasLibresDeLaClase } from "@/lib/docencia-bolsa";

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
      select: { id: true, rolDocente: true, licenciaDocenteId: true },
    });

    if (existente) {
      // Se admite al que YA es profesor pero no está en ninguna universidad: es justo el caso de
      // quien salió de una facultad y entra en otra, y por el enlace y por el buscador ya se podía.
      // Aquí no, así que invitar por correo a un profesor recién sacado decía «ya tiene un rol
      // docente» y no había manera de readmitirle por esta vía (Guillermo, 9 sep 2026).
      const esAlumno = existente.rolDocente === "ALUMNO";
      const yaEnOtra = existente.rolDocente === "PROFESOR" && !!existente.licenciaDocenteId;
      if (esAlumno) return { ok: false, error: t("docencia.alumnoNoProfesor") };
      if (yaEnOtra) return { ok: false, error: t("docencia.yaEstaEnOtraUniversidad") };
      await prisma.dietista.update({
        where: { id: existente.id },
        // Vuelve a estar en una facultad: el plazo de «sin universidad» ya no aplica.
        data: { rolDocente: "PROFESOR", licenciaDocenteId: licencia.id, docenciaHasta: null },
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
        ultimoEnvioAt: new Date(),
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

/**
 * Vuelve a mandar el correo de una invitación, con el MISMO enlace: si se generase otro, el que
 * la persona ya tiene dejaría de funcionar sin que nadie se entere. Lleva la cuenta de los envíos
 * para poder ver que a alguien se le ha insistido varias veces sin resultado.
 */
export async function reenviarInvitacionDocente(id: string): Promise<{ ok: boolean; error?: string; envios?: number }> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("validation");
  try {
    const inv = await prisma.invitacionDocente.findUnique({
      where: { id },
      select: {
        token: true, email: true, aceptadaAt: true, expiraAt: true, envios: true,
        licenciaDocenteId: true,
        licenciaDocente: { select: { institucion: true } },
      },
    });
    if (!inv) return { ok: false, error: t("docencia.invitacionNoValida") };
    if (inv.aceptadaAt) return { ok: false, error: t("docencia.invitacionYaUsada") };

    // Se le da cuerda otra vez: si caducó mientras tanto, reenviar sin más no serviría de nada.
    const expiraAt = new Date(Date.now() + DIAS_DE_VALIDEZ * 24 * 60 * 60 * 1000);
    const actualizada = await prisma.invitacionDocente.update({
      where: { id },
      data: { envios: { increment: 1 }, ultimoEnvioAt: new Date(), expiraAt },
      select: { envios: true },
    });

    sendEmail({
      to: inv.email,
      subject: `Te han invitado como profesor en Annonia — ${inv.licenciaDocente?.institucion ?? ""}`,
      html: correoInvitacion(inv.licenciaDocente?.institucion ?? "", `${urlPublica()}/invitacion/${inv.token}`),
    }).catch((err) => console.error("[docencia] Error reenviando invitación:", err));

    if (inv.licenciaDocenteId) revalidatePath(`/admin/universidades/${inv.licenciaDocenteId}`);
    return { ok: true, envios: actualizada.envios };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error reenviando invitación:", e);
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
  clase: string | null;
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
      clase: { select: { nombre: true, archivada: true } },
    },
  });
  if (!inv || inv.aceptadaAt || inv.expiraAt.getTime() < Date.now()) return null;
  // Una invitación a una clase archivada no vale: el curso ya no está en marcha.
  if (inv.clase?.archivada) return null;
  return {
    email: inv.email,
    institucion: inv.licenciaDocente?.institucion ?? null,
    clase: inv.clase?.nombre ?? null,
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
      claseId: true, aceptadaAt: true, expiraAt: true,
      licenciaDocente: { select: { institucion: true, activa: true, fechaFin: true } },
      clase: { select: { archivada: true, fechaFinCurso: true } },
    },
  });
  if (!inv || inv.aceptadaAt || inv.expiraAt.getTime() < Date.now()) {
    return { ok: false, error: t("docencia.invitacionNoValida") };
  }
  // Una invitación vive 30 días, y en ese tiempo la clase se archiva, el curso se acaba o la
  // licencia caduca. La página ya lo comprobaba; la acción no, y una acción se puede llamar
  // directamente (auditoría 1 sep 2026). Sin esto se colaban alumnos por encima del cupo, porque
  // las clases archivadas no cuentan en la bolsa.
  if (inv.clase?.archivada || cursoTerminado(inv.clase?.fechaFinCurso)) {
    return { ok: false, error: t("docencia.invitacionNoValida") };
  }
  if (inv.licenciaDocente && !licenciaVigente(inv.licenciaDocente)) {
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
    // Si la invitación era para una clase, la matrícula es lo que le da el acceso.
    if (inv.claseId) {
      await prisma.alumnoClase.upsert({
        where: { claseId_alumnoId: { claseId: inv.claseId, alumnoId: yaExiste.id } },
        create: { claseId: inv.claseId, alumnoId: yaExiste.id },
        update: { activa: true, bajaAt: null },
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

  const esAlumno = inv.rol === "ALUMNO";
  const locale = await getLocale();

  try {
    // TODO el alta va en una sola transacción, incluida la creación del usuario de autenticación.
    // Antes se hacía por pasos y se deshacía a mano en el catch: si el rollback fallaba —o si el
    // fallo llegaba después de crear la ficha, que no se deshacía— ese correo quedaba inservible
    // para siempre, ni podía entrar ni podía registrarse (auditoría 1 sep 2026).
    const resultado = await prisma.$transaction(async (tx) => {
      if (inv.licenciaDocenteId) {
        // Con la fila de la licencia bloqueada, dos alumnos aceptando a la vez hacen cola aquí.
        await tx.$queryRawUnsafe(`SELECT id FROM licencias_docentes WHERE id = $1 FOR UPDATE`, inv.licenciaDocenteId);
      }

      // Marcarla usada lo primero: libera la plaza que su propia invitación tenía reservada, y
      // corta en seco que el mismo enlace se acepte dos veces a la vez.
      const marcada = await tx.invitacionDocente.updateMany({
        where: { id: inv.id, aceptadaAt: null },
        data: { aceptadaAt: new Date() },
      });
      if (marcada.count === 0) return { error: "docencia.invitacionNoValida" as const, dietistaId: null };

      if (esAlumno && inv.licenciaDocenteId) {
        if ((await plazasLibresDeLicencia(inv.licenciaDocenteId, tx)) <= 0) {
          return { error: "docencia.sinPlazas" as const, dietistaId: null };
        }
        // Y el tope de la clase, que es otro número distinto: el profesor dijo «somos 60» y esos 60
        // valen para todas las vías, también para el correo (Guillermo, 9 sep 2026).
        if (inv.claseId && (await plazasLibresDeLaClase(inv.claseId, tx)) === 0) {
          return { error: "docencia.claseLlena" as const, dietistaId: null };
        }
      }
      // El profesor también tiene su tope. Su invitación ya reservaba plaza, pero entre que se
      // manda y se acepta pueden haber entrado otros por el enlace y agotarla.
      if (!esAlumno && inv.licenciaDocenteId) {
        const [licencia, dentro] = await Promise.all([
          tx.licenciaDocente.findUnique({ where: { id: inv.licenciaDocenteId }, select: { maxProfesores: true } }),
          tx.dietista.count({ where: { licenciaDocenteId: inv.licenciaDocenteId, rolDocente: "PROFESOR" } }),
        ]);
        if (dentro >= (licencia?.maxProfesores ?? 0)) {
          return { error: "docencia.sinCupoProfesoresYa" as const, dietistaId: null };
        }
      }

      const authRows = await tx.$queryRawUnsafe<{ id: string }[]>(
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

      await tx.$queryRawUnsafe(
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

      const dietista = await tx.dietista.create({
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
          // La cuenta de un alumno nace marcada: al retirarle el acceso no se convierte en una
          // cuenta normal registrándose otra vez con ese correo.
          cuentaDeClase: esAlumno,
        },
      });

      // Un alumno NO lleva suscripción: su acceso viene de la matrícula, y una suscripción suya
      // aparecería en el panel de administración como si fuese una venta.
      if (!esAlumno) {
        await tx.$queryRawUnsafe(
          `INSERT INTO suscripciones (id, "dietistaId", plan, estado, "fechaInicio", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, 'PROFESIONAL', 'ACTIVA', NOW(), NOW(), NOW())`,
          dietista.id,
        );
      }

      if (inv.claseId) {
        await tx.alumnoClase.create({ data: { claseId: inv.claseId, alumnoId: dietista.id } });
      }

      await tx.invitacionDocente.update({
        where: { id: inv.id },
        data: { aceptadaPorId: dietista.id },
      });

      return { error: null, dietistaId: dietista.id };
    }, { timeout: 20_000, maxWait: 15_000 });

    if (resultado.error || !resultado.dietistaId) {
      return { ok: false, error: t(resultado.error ?? "general.errorDesconocido") };
    }

    // Igual que en el alta por enlace: si falla, que quede en el log y no en el olvido.
    crearPacienteDemoSiNoExiste(prisma, resultado.dietistaId, locale).catch((e) =>
      console.error("[docencia] Sin paciente de ejemplo para la invitación aceptada:", e),
    );

    revalidatePath("/admin/universidades");
    if (inv.licenciaDocenteId) revalidatePath(`/admin/universidades/${inv.licenciaDocenteId}`);
    revalidatePath("/admin/dietistas");
    return { ok: true };
  } catch (err) {
    if (isNextNavigation(err)) throw err;
    console.error("[docencia] Error aceptando invitación:", err);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}
