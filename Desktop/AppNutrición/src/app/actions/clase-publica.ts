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
import { plazasLibresDeLicencia, conPlazaDeLaBolsa, plazasLibresDeLaClase } from "@/lib/docencia-bolsa";
import { getCurrentDietista } from "./auth";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";
import { crearUsuarioSinVerificar, mandarCorreoDeVerificacion } from "@/lib/alta-por-enlace";

export interface ClasePublica {
  nombre: string;
  institucion: string | null;
  dominios: string[];
  plazasLibres: number;
  /** Si quien abre el enlace ya está matriculado en ESTA clase: no hay nada que apuntar. */
  yaMatriculado: boolean;
  /**
   * El tope que puso el profesor a SU clase ya está lleno, aunque a la facultad le sobren plazas.
   * Se dice al abrir el enlace, no al enviar el formulario: rellenarlo entero para que al final te
   * digan que no hay sitio es de las cosas que más molestan (Guillermo, 9 sep 2026).
   */
  claseLlena: boolean;
}

/** Devuelve null si el enlace no vale, sin decir por qué: no es asunto de quien lo abre. */
/** Igual que en el enlace de profesorado: el correo parte las URL largas y llegan con espacios. */
function limpiarToken(token: string) {
  return token.replace(/\s+/g, "");
}

export async function getClasePorToken(token: string): Promise<ClasePublica | null> {
  if (!token) return null;
  const clase = await prisma.clase.findUnique({
    where: { tokenInvitacion: limpiarToken(token) },
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

  // Ofrecerle apuntarse a quien ya está dentro es enseñarle un botón que no hace nada: se mira
  // aquí, con la sesión que haya (9 sep 2026, repasando los casos de «ya estoy logueado»).
  const dentro = await getCurrentDietista();
  const yaMatriculado = dentro
    ? (await prisma.alumnoClase.count({ where: { claseId: clase.id, alumnoId: dentro.id, activa: true } })) > 0
    : false;

  return {
    nombre: clase.nombre,
    institucion: clase.licenciaDocente?.institucion ?? null,
    dominios: dominiosDeLicencia(clase.licenciaDocente?.dominioEmail),
    plazasLibres: clase.licenciaDocenteId ? await plazasLibresDeLicencia(clase.licenciaDocenteId) : 0,
    yaMatriculado,
    claseLlena: (await plazasLibresDeLaClase(clase.id)) === 0,
  };
}

/**
 * Alta desde el enlace con la sesión que ya hay abierta en el navegador: un clic y dentro
 * (Guillermo, 4 sep 2026: "si ya estoy logueado, la gracia es que se me agregue automáticamente").
 * Las mismas condiciones que el alta normal: clase viva, enlace abierto, licencia vigente, plaza.
 */
/** Se lanza cuando el enlace de la clase ya ha dado su cupo. No es un fallo: es un tope. */
class ClaseLlena extends Error {
  constructor() { super("CLASE_LLENA"); this.name = "ClaseLlena"; }
}

export async function apuntarmeConMiCuenta(token: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.rolDocente === "PROFESOR") return { ok: false, error: t("docencia.profesorNoAlumno") };

  const clase = await prisma.clase.findUnique({
    where: { tokenInvitacion: limpiarToken(token) },
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

  // Este camino no tiene try/catch alrededor, así que el tope de la clase se comprueba y se
  // contesta aquí en vez de lanzar.
  const hecho = await conPlazaDeLaBolsa(clase.licenciaDocenteId, { alumnoId: dietista.id, email: dietista.email }, async (tx) => {
    if ((await plazasLibresDeLaClase(clase.id, tx)) === 0) return "claseLlena" as const;
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
    return "hecho" as const;
  });
  if (!hecho.ok) return { ok: false, error: t("docencia.sinPlazas") };
  if (hecho.valor === "claseLlena") return { ok: false, error: t("docencia.claseLlena") };
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
  /** Qué está intentando: crear su cuenta o entrar con la que ya tiene. Sirve para dar el error
   *  exacto en vez de uno que valga para los dos (Guillermo, 9 sep 2026). */
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
  const locale = await getLocale();

  const clase = await prisma.clase.findUnique({
    where: { tokenInvitacion: limpiarToken(data.token) },
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
  // El cupo que puso el profesor para SU clase, si lo puso. Se vuelve a mirar dentro de la
  // transacción, justo antes de crear la cuenta: entre abrir la página y enviar entran otros.
  if ((await plazasLibresDeLaClase(clase.id)) === 0) {
    return { ok: false, error: t("docencia.claseLlena") };
  }

  const email = validateEmail(sanitizeString(data.email, 200).normalize("NFC"));
  if (!email) return { ok: false, error: t("admin.emailNoValido") };
  const entrando = data.modo === "entrar";
  // Quien entra con su cuenta no escribe su nombre: ya lo tiene puesto.
  const nombre = entrando ? "—" : sanitizeString(data.nombre, 100);
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
      // Venía a crear una cuenta y ese correo ya tiene una: se le manda a la otra pestaña.
      if (!entrando) return { ok: false, error: t("docencia.correoYaTieneCuentaUsaEntrar") };
      // Un profesor no puede ser alumno de una clase. Con la sesión abierta ya no se le ofrece
      // siquiera, pero por el formulario —de incógnito, escribiendo su correo— entraba y le gastaba
      // una plaza de alumno a su propia facultad (9 sep 2026).
      if (existente.rolDocente === "PROFESOR") return { ok: false, error: t("docencia.profesorNoAlumno") };
      // Que el correo tenga cuenta no demuestra que quien rellena el formulario sea su dueño: sin
      // esto, cualquiera con el enlace de la clase metía en el aula la cuenta de otro y le gastaba
      // una plaza a la facultad (auditoría 1 sep 2026). Se le pide su contraseña de siempre.
      const suApp = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const { error } = await suApp.auth.signInWithPassword({ email, password: data.password ?? "" });
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
    // Igual que en el enlace de profesorado: lo más normal es que se diera de alta y no llegara a
    // abrir el correo, y ahí «ya existe esa cuenta» no le dice qué tiene que hacer.
    const existingAuth = await prisma.$queryRawUnsafe<{ id: string; email_confirmed_at: Date | null }[]>(
      `SELECT id, email_confirmed_at FROM auth.users WHERE email = $1 LIMIT 1`, email,
    );
    if (existingAuth.length > 0) {
      return {
        ok: false,
        error: t(existingAuth[0].email_confirmed_at
          ? "admin.yaExisteUsuarioEmail"
          : "docencia.verificaTuCorreoPrimero"),
      };
    }

    // Venía a entrar con su cuenta y no hay ninguna con ese correo.
    if (entrando) return { ok: false, error: t("docencia.noHayCuentaConEseCorreo") };

    // La plaza se coge dentro de la transacción, justo antes de crear la cuenta: entre que se
    // abre la página y se envía el formulario pueden haberse apuntado otros.
    const alta = await conPlazaDeLaBolsa(clase.licenciaDocenteId, { email }, async (tx) => {
      if ((await plazasLibresDeLaClase(clase.id, tx)) === 0) throw new ClaseLlena();
      const authId = await crearUsuarioSinVerificar(tx, {
        email, password: data.password, nombre, apellidos,
      });
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
      return { id: alumno.id, authId };
    });
    // Todo lo de arriba va en una sola transacción: si algo falla, no queda ni el usuario de
    // autenticación ni la ficha a medias. Antes se limpiaba a mano y la ficha se quedaba, con lo
    // que ese correo se volvía inservible para siempre (auditoría 1 sep 2026).
    if (!alta.ok) return { ok: false, error: t("docencia.sinPlazas") };

    // Si esto falla, la cuenta queda sin paciente de ejemplo y nadie se entera: al menos que se
    // vea en el log. No se espera a propósito: el alta ya está hecha y no debe caerse por esto.
    crearPacienteDemoSiNoExiste(prisma, alta.valor.id, locale).catch((e) =>
      console.error("[docencia] Sin paciente de ejemplo para el alumno del enlace:", e),
    );

    // La plaza se gasta aunque todavía no haya verificado: es la misma norma que con el profesor,
    // y si no, con correos inventados se vacía la bolsa de la universidad.
    const envio = await mandarCorreoDeVerificacion(alta.valor.authId, email, nombre);
    return {
      ok: true,
      verificaTuCorreo: true,
      correoEnviado: envio.enviado,
      enlaceDePrueba: envio.enlaceDePrueba,
    };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    // El cupo de la clase no es un fallo: se dice y ya, sin ensuciar el log.
    if (e instanceof ClaseLlena) return { ok: false, error: t("docencia.claseLlena") };
    console.error("[docencia] Error apuntando a la clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}
