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
import { licenciaVigente, cursoActual, cursoDeAnio, cursoDeFechaFin } from "@/lib/docencia";
import { getCurrentDietista } from "./auth";
import { createClient } from "@supabase/supabase-js";
import type { Prisma } from "@/generated/prisma/client";
import { headers } from "next/headers";
import { getLocale } from "@/i18n/locale";
import { checkRateLimit, LIMITES } from "@/lib/rate-limit";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";
import { crearUsuarioSinVerificar, mandarCorreoDeVerificacion } from "@/lib/alta-por-enlace";
import { sanitizeString, sanitizeStringOptional, validateEmail } from "@/lib/validation";
import { sendEmail } from "@/lib/mailer";
import { isNextNavigation, urlPublica } from "@/lib/utils";
import { escapeHtml } from "@/lib/email-citas-template";

export interface EnlaceProfesoresResumen {
  id: string;
  url: string;
  /** «2026/27»: de qué curso es. Los enlaces no se reinician; para el siguiente se crea otro. */
  curso: string;
  plazas: number;
  usadas: number;
  agotado: boolean;
  enviadoA: string[];
  ultimoEnvioAt: Date | null;
  createdAt: Date;
  /** Quién ha entrado por este enlace. */
  altas: { nombre: string; apellidos: string; email: string }[];
}

/**
 * Un token sin espacios ni saltos.
 *
 * El enlace se reenvía por correo y algunos clientes lo parten por la mitad al ajustar el ancho,
 * así que llega con un espacio dentro y la página decía «este enlace no vale» aunque fuera bueno
 * (Guillermo, 9 sep 2026). Los tokens son hexadecimales, así que quitar espacios es seguro.
 */
function limpiarToken(token: string) {
  return token.replace(/\s+/g, "");
}

/**
 * Cuántos profesores más admite la universidad: el tope menos los que ya están, menos las
 * invitaciones sin usar y menos lo que ya prometen los enlaces vivos de este curso.
 *
 * Lo de los enlaces cuenta porque un enlace repartido es una promesa: si se ignorase, dos enlaces
 * de tres plazas cada uno meterían seis profesores en una universidad de cuatro.
 */
export async function plazasLibresDeProfesor(licenciaId: string, maxProfesores: number): Promise<number> {
  const [profesores, pendientes, enlaces] = await Promise.all([
    prisma.dietista.count({ where: { licenciaDocenteId: licenciaId, rolDocente: "PROFESOR" } }),
    prisma.invitacionDocente.count({
      where: { rol: "PROFESOR", licenciaDocenteId: licenciaId, aceptadaAt: null, expiraAt: { gte: new Date() } },
    }),
    prisma.enlaceProfesores.findMany({
      where: { licenciaDocenteId: licenciaId, cursoAnio: cursoActual().anio },
      select: { plazas: true, usadas: true },
    }),
  ]);
  // De cada enlace solo queda pendiente lo que no se ha usado; lo usado ya está contado en
  // `profesores`, y sumarlo otra vez descontaría dos veces la misma plaza.
  const prometidas = enlaces.reduce((n, e) => n + Math.max(0, e.plazas - e.usadas), 0);
  return Math.max(0, maxProfesores - profesores - pendientes - prometidas);
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
      id: true, token: true, plazas: true, usadas: true, enviadoA: true, cursoAnio: true,
      ultimoEnvioAt: true, createdAt: true,
      altas: { select: { nombre: true, apellidos: true, email: true }, orderBy: { createdAt: "asc" } },
    },
  });

  return enlaces.map((e) => ({
    id: e.id,
    url: urlDelEnlace(e.token),
    curso: cursoDeAnio(e.cursoAnio).etiqueta,
    plazas: e.plazas,
    usadas: e.usadas,
    agotado: e.usadas >= e.plazas,
    enviadoA: e.enviadoA,
    ultimoEnvioAt: e.ultimoEnvioAt,
    createdAt: e.createdAt,
    altas: e.altas,
  }));
}

/**
 * Un enlace nuevo con su cupo. Para ampliar no se toca el anterior: se crea otro.
 *
 * El enlace **reparte** plazas de la universidad, no las crea: su cupo no puede pasar de lo que
 * queda libre. Antes las sumaba al tope de la licencia, así que con 5 licencias vendidas y 4
 * ocupadas se podía crear un enlace de 4 y acababan entrando 8 (Guillermo, 9 sep 2026). Quien
 * decide cuántas hay es el campo «Licencias de profesor» de la ficha, y nada más.
 */
export async function crearEnlaceProfesores(
  licenciaId: string,
  plazas: number,
  /** Año en que empieza el curso para el que vale. Por defecto, el de ahora. */
  cursoAnio?: number,
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
    select: { id: true, maxProfesores: true, fechaFin: true },
  });
  if (!licencia) return { ok: false, error: t("docencia.licenciaNoEncontrada") };

  const delCurso = cursoAnio ?? cursoActual().anio;
  // Solo se comprueba contra el tope si el enlace es del curso que la licencia tiene contratado:
  // el de un curso futuro se vende por adelantado y su tope se pondrá al renovar.
  if (delCurso === cursoDeFechaFin(licencia.fechaFin)?.anio) {
    const libres = await plazasLibresDeProfesor(licenciaId, licencia.maxProfesores);
    if (cupo > libres) {
      return { ok: false, error: t("docencia.enlacePasaDelCupo", { libres }) };
    }
  }

  try {
    const enlace = await prisma.$transaction(async (tx) => {
      const creado = await tx.enlaceProfesores.create({
        data: {
          licenciaDocenteId: licenciaId,
          token: randomUUID().replace(/-/g, ""),
          cursoAnio: delCurso,
          plazas: cupo,
          creadoPor: admin.email,
        },
        select: { token: true },
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
  /** De qué universidad es el enlace: sirve para saber si quien lo abre ya está en ESA o en otra. */
  licenciaId: string;
  institucion: string;
  quedan: number;
  agotado: boolean;
  /** «2026/27»: para que quien lo abre sepa de qué curso es. */
  curso: string;
}

/** Lo que se enseña a quien abre el enlace. No se dice el cupo total, solo si queda sitio. */
export async function getEnlaceProfesoresPorToken(token: string): Promise<EnlacePublico | null> {
  const enlace = await prisma.enlaceProfesores.findUnique({
    where: { token: limpiarToken(token) },
    select: {
      plazas: true, usadas: true, cursoAnio: true, licenciaDocenteId: true,
      licenciaDocente: { select: { institucion: true, activa: true, fechaFin: true, maxProfesores: true } },
    },
  });
  // Vigente de verdad, y del curso en el que estamos o de uno futuro: los de cursos pasados no
  // reviven al renovar.
  if (!enlace || !licenciaVigente(enlace.licenciaDocente)) return null;
  if (enlace.cursoAnio < cursoActual().anio) return null;

  // Lo que queda de verdad es lo menor de las dos cosas: lo que admite este enlace y lo que le
  // queda a la universidad. Enseñar solo lo del enlace prometía plazas que no existen.
  const [profesores, pendientes] = await Promise.all([
    prisma.dietista.count({ where: { licenciaDocenteId: enlace.licenciaDocenteId, rolDocente: "PROFESOR" } }),
    prisma.invitacionDocente.count({
      where: { rol: "PROFESOR", licenciaDocenteId: enlace.licenciaDocenteId, aceptadaAt: null, expiraAt: { gte: new Date() } },
    }),
  ]);
  const enLaUniversidad = Math.max(0, enlace.licenciaDocente.maxProfesores - profesores - pendientes);
  const quedan = Math.min(Math.max(0, enlace.plazas - enlace.usadas), enLaUniversidad);
  return {
    licenciaId: enlace.licenciaDocenteId,
    institucion: enlace.licenciaDocente.institucion,
    quedan,
    agotado: quedan === 0,
    curso: cursoDeAnio(enlace.cursoAnio).etiqueta,
  };
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
    const filas = await tx.$queryRawUnsafe<{ id: string; plazas: number; usadas: number; cursoAnio: number; licenciaDocenteId: string }[]>(
      `SELECT id, plazas, usadas, "cursoAnio", "licenciaDocenteId" FROM enlaces_profesores WHERE token = $1 FOR UPDATE`,
      limpiarToken(token),
    );
    const enlace = filas[0];
    if (!enlace) return { ok: false as const, motivo: "noValido" as const };
    if (enlace.usadas >= enlace.plazas) return { ok: false as const, motivo: "agotado" as const };

    // Un enlace de un curso YA PASADO no revive al renovar: para el curso nuevo se crea otro. Los de
    // cursos futuros sí admiten desde ya, que es lo que se vende cuando pagan en enero para el año
    // siguiente (Guillermo, 8 sep 2026: "que admita desde ya").
    if (enlace.cursoAnio < cursoActual().anio) return { ok: false as const, motivo: "noValido" as const };

    // La licencia se comprueba AQUÍ y no solo al pintar la página: entre que se abre el enlace y se
    // envía el formulario puede haber caducado, y la vista no es lo que autoriza.
    const licencia = await tx.licenciaDocente.findUnique({
      where: { id: enlace.licenciaDocenteId },
      select: { activa: true, fechaFin: true, maxProfesores: true },
    });
    if (!licenciaVigente(licencia)) return { ok: false as const, motivo: "noValido" as const };

    // Y el tope de verdad son los PROFESORES QUE YA HAY en la universidad, no los usos del enlace:
    // las tres vías —darle el rol a quien ya usa Annonia, invitar por correo y este enlace— comen
    // de la misma bolsa, así que un enlace de seis no puede meter al séptimo profesor (Guillermo,
    // 9 sep 2026). Las invitaciones sin usar también reservan, como en las otras vías.
    const [profesores, pendientes] = await Promise.all([
      tx.dietista.count({ where: { licenciaDocenteId: enlace.licenciaDocenteId, rolDocente: "PROFESOR" } }),
      tx.invitacionDocente.count({
        where: {
          rol: "PROFESOR",
          licenciaDocenteId: enlace.licenciaDocenteId,
          aceptadaAt: null,
          expiraAt: { gte: new Date() },
        },
      }),
    ]);
    if (profesores + pendientes >= (licencia?.maxProfesores ?? 0)) {
      return { ok: false as const, motivo: "agotado" as const };
    }

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
  if (dietista.rolDocente === "ALUMNO") return { ok: false, error: t("docencia.alumnoNoProfesor") };
  // Ser profesor no basta para rechazarle: quien salió de una facultad conserva el rol y se queda
  // SIN universidad, y este enlace es justo por donde entra en la siguiente. Lo que no se puede es
  // estar en dos a la vez (Guillermo, 9 sep 2026: el enlace no hacía nada y acababa en un espacio
  // docente vacío).
  if (dietista.rolDocente === "PROFESOR" && dietista.licenciaDocenteId) {
    return { ok: false, error: t("docencia.yaEstaEnOtraUniversidad") };
  }

  try {
    const hecho = await conPlazaDelEnlace(token, async (tx, enlace) => {
      await tx.dietista.update({
        where: { id: dietista.id },
        data: {
          rolDocente: "PROFESOR",
          licenciaDocenteId: enlace.licenciaDocenteId,
          altaPorEnlaceId: enlace.id,
          // Vuelve a estar en una facultad: el plazo de «sin universidad» ya no aplica.
          docenciaHasta: null,
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
  /**
   * Qué está intentando: crear su cuenta o entrar con la que ya tiene. Lo dice el formulario, que
   * ahora tiene las dos cosas separadas, y sirve para dar el error exacto —«ese correo ya tiene
   * cuenta, usa la otra pestaña» o «no hay ninguna cuenta con ese correo»— en vez de uno que sirva
   * para los dos y no ayude a nadie (Guillermo, 9 sep 2026).
   */
  modo?: "crear" | "entrar";
}): Promise<{
  ok: boolean;
  error?: string;
  yaTeniaCuenta?: boolean;
  /** Cuenta nueva: está creada pero no entra hasta que abra el correo que le acabamos de mandar. */
  verificaTuCorreo?: boolean;
  /** Si el correo no salió, para poder decírselo y ofrecerle el reenvío. */
  correoEnviado?: boolean;
  /** Solo fuera de producción: el enlace de verificación, para poder probar sin buzón. */
  enlaceDePrueba?: string;
}> {
  const t = await getTranslations("validation");

  const email = validateEmail(sanitizeString(data.email, 200).normalize("NFC"));
  if (!email) return { ok: false, error: t("admin.emailNoValido") };
  const entrando = data.modo === "entrar";
  // Quien entra con su cuenta no escribe su nombre: ya lo tiene puesto.
  const nombre = entrando ? "—" : sanitizeString(data.nombre, 100);
  if (!nombre) return { ok: false, error: t("admin.nombreObligatorio") };
  const apellidos = sanitizeStringOptional(data.apellidos, 100) ?? "";
  // El mismo mínimo que el registro de siempre: dos reglas distintas para lo mismo solo sirven
  // para que la gente se quede fuera sin entender por qué (Guillermo, 9 sep 2026).
  if (!data.password || data.password.length < 6) return { ok: false, error: t("admin.contrasenaMinima") };

  // Un enlace repartido por una facultad entera es público de hecho: sin freno, cualquiera podría
  // probar altas en cadena hasta agotar las plazas de la universidad.
  const cabeceras = await headers();
  const ip = cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? cabeceras.get("x-real-ip")?.trim() ?? "desconocida";
  if (!checkRateLimit({ key: `profesorado:${ip}`, ...LIMITES.apuntarseAClase }).ok) {
    return { ok: false, error: t("auth.rateLimitRegistro") };
  }

  const existente = await prisma.dietista.findUnique({
    where: { email },
    select: { id: true, rolDocente: true, licenciaDocenteId: true },
  });

  try {
    // Quien YA usa Annonia entra por el mismo formulario, con su correo y su contraseña de siempre:
    // mandarle al login y que volviera era un rodeo, y encima acababa en su panel en vez de aquí
    // (Guillermo, 9 sep 2026). Se le pide la contraseña porque tener el correo de alguien no
    // demuestra ser esa persona: si no, con el enlace se metía la cuenta de otro y se le gastaba
    // una plaza a la universidad.
    if (existente) {
      // Venía a crear una cuenta y ese correo ya tiene una: se le manda a la otra pestaña en vez
      // de pedirle una contraseña que él cree que está inventando.
      if (!entrando) return { ok: false, error: t("docencia.correoYaTieneCuentaUsaEntrar") };
      if (existente.rolDocente === "ALUMNO") return { ok: false, error: t("docencia.alumnoNoProfesor") };
      // Igual que arriba: el profesor sin universidad entra por aquí; el que ya está en otra, no.
      if (existente.rolDocente === "PROFESOR" && existente.licenciaDocenteId) {
        return { ok: false, error: t("docencia.yaEstaEnOtraUniversidad") };
      }

      const suApp = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const { error } = await suApp.auth.signInWithPassword({ email, password: data.password });
      // Distinguir el correo sin confirmar de la contraseña mal: si no, a quien se dio de alta hace
      // un rato y aún no ha abierto el correo se le decía que su contraseña no valía, y volvía a
      // intentarlo una y otra vez (9 sep 2026).
      if (error) {
        return {
          ok: false,
          error: t(/not confirmed/i.test(error.message)
            ? "docencia.verificaTuCorreoPrimero"
            : "docencia.contrasenaDeSuCuenta"),
        };
      }

      const unido = await conPlazaDelEnlace(data.token, async (tx, enlace) => {
        await tx.dietista.update({
          where: { id: existente.id },
          data: {
            rolDocente: "PROFESOR",
            licenciaDocenteId: enlace.licenciaDocenteId,
            altaPorEnlaceId: enlace.id,
            docenciaHasta: null,
          },
        });
      });
      if (!unido.ok) {
        return { ok: false, error: t(unido.motivo === "agotado" ? "docencia.enlaceAgotado" : "docencia.enlaceProfesorNoValido") };
      }
      return { ok: true, yaTeniaCuenta: true };
    }

    // Un usuario de autenticación sin ficha de dietista es una cuenta a medias de un alta que se
    // quedó por el camino: no se puede reutilizar el correo sin más. Pero hay que distinguir por
    // qué se quedó a medias: lo más normal es que se diera de alta y no llegara a abrir el correo,
    // y ahí decirle "entra con tu cuenta" es mandarle a un sitio donde tampoco va a poder entrar
    // (Guillermo, 9 sep 2026).
    const existingAuth = await prisma.$queryRawUnsafe<{ id: string; email_confirmed_at: Date | null }[]>(
      `SELECT id, email_confirmed_at FROM auth.users WHERE email = $1 LIMIT 1`, email,
    );
    if (existingAuth.length > 0) {
      return {
        ok: false,
        error: t(existingAuth[0].email_confirmed_at
          ? "docencia.yaExisteEntraConTuCuenta"
          : "docencia.verificaTuCorreoPrimero"),
      };
    }

    // Venía a entrar con su cuenta y no hay ninguna con ese correo: se le dice, en vez de crearle
    // una sin que se entere.
    if (entrando) return { ok: false, error: t("docencia.noHayCuentaConEseCorreo") };

    const alta = await conPlazaDelEnlace(data.token, async (tx, enlace) => {
      const authId = await crearUsuarioSinVerificar(tx, {
        email, password: data.password, nombre, apellidos,
      });
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
      return { id: profesor.id, authId };
    });
    if (!alta.ok) {
      return { ok: false, error: t(alta.motivo === "agotado" ? "docencia.enlaceAgotado" : "docencia.enlaceProfesorNoValido") };
    }

    // Su paciente de ejemplo, igual que en cualquier otra alta. Si falla, que quede en el log.
    crearPacienteDemoSiNoExiste(prisma, alta.valor.id, await getLocale()).catch((e) =>
      console.error("[docencia] Sin paciente de ejemplo para el profesor del enlace:", e),
    );

    // La plaza se gasta aunque todavía no haya verificado: si se guardara para después, con un
    // correo inventado se podrían reservar todas las de la universidad sin que nadie las use.
    const envio = await mandarCorreoDeVerificacion(alta.valor.authId, email, nombre);
    return {
      ok: true,
      verificaTuCorreo: true,
      correoEnviado: envio.enviado,
      enlaceDePrueba: envio.enlaceDePrueba,
    };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error dando de alta al profesor por el enlace:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}
