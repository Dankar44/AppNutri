"use server";

/**
 * #39 (issue #31) — Alta de alumnos en una clase.
 *
 * Dos caminos, los dos pedidos por Guillermo: metiendo los correos a mano (la vía principal, la
 * que se vende) y con el enlace de la clase para que se apunten solos. En los dos casos **nadie
 * pone la contraseña de nadie**: se manda un correo y cada uno crea su cuenta.
 *
 * Si el correo ya tiene cuenta en Annonia no se crea otra: se le matricula y conserva lo suyo,
 * incluida su suscripción si la paga.
 */

import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isNextNavigation, urlPublica } from "@/lib/utils";
import { sanitizeString, validateEmail } from "@/lib/validation";
import { sendEmail } from "@/lib/mailer";
import { plazasLibresDeLicencia, conPlazaDeLaBolsa } from "@/lib/docencia-bolsa";
import { emailDelDominio, cursoTerminado, claseQueLleva } from "@/lib/docencia";
import { requireProfesor } from "./docencia";

const DIAS_DE_VALIDEZ = 30;

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function correoAlumno(clase: string, profesor: string, enlace: string): string {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#2c3e37;">
    <div style="text-align:center;margin-bottom:24px;">
      <img src="https://annonia.com/icon-512.png" alt="Annonia" width="56" height="56" style="border-radius:12px;" />
    </div>
    <h1 style="font-size:20px;margin:0 0 12px;">Te han dado acceso a Annonia para tus prácticas</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
      Hola: ${escapeHtml(profesor)} te ha dado de alta en la clase
      <strong>${escapeHtml(clase)}</strong>. Con Annonia harás las dietas de tus casos de prácticas.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
      Crea tu cuenta con la contraseña que tú elijas:
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

export interface ResultadoAltaAlumnos {
  ok: boolean;
  error?: string;
  /** Qué ha pasado con cada correo, para poder decírselo al profesor uno a uno. */
  detalle?: { email: string; resultado: "invitado" | "matriculado" | "yaEstaba" | "sinPlazas" | "invalido" }[];
}

/**
 * Da de alta a varios alumnos de golpe (un correo por línea, que es como los tiene el profesor).
 * Cada uno se resuelve por separado: que uno esté repetido no puede tirar el alta de los demás.
 */
export async function invitarAlumnos(data: {
  claseId: string;
  correos: string;
}): Promise<ResultadoAltaAlumnos> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  if (!profesor.puedeDarAltas) return { ok: false, error: t("docencia.licenciaCerrada") };

  const clase = await prisma.clase.findFirst({
    where: { id: data.claseId, archivada: false, ...claseQueLleva(profesor.dietistaId, profesor.licencia?.id ?? null) },
    select: { id: true, nombre: true, licenciaDocenteId: true, fechaFinCurso: true },
  });
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };
  if (!clase.licenciaDocenteId) return { ok: false, error: t("docencia.licenciaNoEncontrada") };
  // Con el curso pasado, dar de alta no serviría de nada: el alumno no podría ni entrar.
  if (cursoTerminado(clase.fechaFinCurso)) return { ok: false, error: t("docencia.cursoTerminado") };

  // NFC para que "josé@" escrito de dos formas distintas no acabe siendo dos alumnos.
  const correos = [...new Set(
    data.correos.split(/[\n,;]+/)
      .map((c) => sanitizeString(c, 200).normalize("NFC").toLowerCase().trim())
      .filter(Boolean),
  )];
  if (correos.length === 0) return { ok: false, error: t("docencia.sinCorreos") };

  const detalle: NonNullable<ResultadoAltaAlumnos["detalle"]> = [];
  const tokensParaEnviar: { email: string; token: string }[] = [];
  const nombreProfesor = `${profesor.nombre} ${profesor.apellidos}`.trim();

  try {
    for (const email of correos) {
      // `includes("@")` dejaba pasar cosas como «Nombre <x@y>»: se valida de verdad.
      if (!validateEmail(email)) {
        detalle.push({ email, resultado: "invalido" });
        continue;
      }

      const existente = await prisma.dietista.findUnique({ where: { email }, select: { id: true } });

      // Contar la bolsa y dar el alta van DENTRO de la misma transacción, con la fila de la
      // licencia bloqueada: si se cuenta fuera, dos profesores pegando sus listas a la vez se
      // quedan los dos con la última plaza. Y se mira alumno a alumno, no una vez al principio:
      // si quedan tres y se pegan diez correos, entran tres y de los otros siete se avisa.
      const resultado = await conPlazaDeLaBolsa(
        clase.licenciaDocenteId,
        { alumnoId: existente?.id ?? null, email },
        async (tx): Promise<"invitado" | "matriculado" | "yaEstaba"> => {
          if (existente) {
            const yaMatriculado = await tx.alumnoClase.findUnique({
              where: { claseId_alumnoId: { claseId: clase.id, alumnoId: existente.id } },
            });
            if (yaMatriculado) {
              // Si estaba con el acceso retirado, esto se lo devuelve: es la vía de "meter el
              // correo otra vez" que se acordó para el curso siguiente.
              if (!yaMatriculado.activa) {
                await tx.alumnoClase.update({
                  where: { id: yaMatriculado.id },
                  data: { activa: true, bajaAt: null },
                });
                return "matriculado";
              }
              return "yaEstaba";
            }

            // Cuenta que ya existe: se le matricula sin tocar nada de lo suyo. Si es un
            // nutricionista con su propia suscripción, la conserva; solo se le marca el rol si no
            // tenía ninguno, y `cuentaDeClase` se queda en false para que siga contando como
            // cliente en administración y no se le eche al acabar el curso.
            await tx.alumnoClase.create({ data: { claseId: clase.id, alumnoId: existente.id } });
            await tx.dietista.updateMany({
              where: { id: existente.id, rolDocente: null },
              data: { rolDocente: "ALUMNO", licenciaDocenteId: clase.licenciaDocenteId },
            });
            return "matriculado";
          }

          // Sin cuenta: invitación con su enlace.
          const token = randomBytes(24).toString("base64url");
          await tx.invitacionDocente.create({
            data: {
              token,
              email,
              rol: "ALUMNO",
              claseId: clase.id,
              licenciaDocenteId: clase.licenciaDocenteId,
              invitadoPor: profesor.dietistaId,
              expiraAt: new Date(Date.now() + DIAS_DE_VALIDEZ * 24 * 60 * 60 * 1000),
              ultimoEnvioAt: new Date(),
            },
          });
          // El correo se manda DESPUÉS, ya fuera de la transacción: no se puede dejar una
          // transacción abierta esperando a que conteste el servidor de correo.
          tokensParaEnviar.push({ email, token });
          return "invitado";
        },
      );

      detalle.push({ email, resultado: resultado.ok ? resultado.valor : "sinPlazas" });
    }

    for (const { email, token } of tokensParaEnviar) {
      sendEmail({
        to: email,
        subject: `${nombreProfesor} te ha dado acceso a Annonia — ${clase.nombre}`,
        html: correoAlumno(clase.nombre, nombreProfesor, `${urlPublica()}/invitacion/${token}`),
      }).catch((err) => console.error("[docencia] Error enviando invitación de alumno:", err));
    }

    revalidatePath(`/profesor/clases/${clase.id}`);
    revalidatePath("/profesor/clases");
    revalidatePath("/profesor");
    return { ok: true, detalle };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error invitando alumnos:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/** Retira o devuelve el acceso a un alumno. Nunca borra su cuenta ni su trabajo. */
export async function cambiarAccesoAlumno(
  claseId: string,
  alumnoId: string,
  activa: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const clase = await prisma.clase.findFirst({
    where: { id: claseId, ...claseQueLleva(profesor.dietistaId, profesor.licencia?.id ?? null) },
    select: { id: true, licenciaDocenteId: true, fechaFinCurso: true },
  });
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };
  if (activa && cursoTerminado(clase.fechaFinCurso)) {
    return { ok: false, error: t("docencia.cursoTerminado") };
  }

  try {
    // Devolver el acceso consume plaza otra vez, salvo que ya la ocupe por la clase de otro
    // profesor. Se comprueba y se escribe dentro de la misma transacción, como en el alta.
    if (activa && clase.licenciaDocenteId) {
      const hecho = await conPlazaDeLaBolsa(clase.licenciaDocenteId, { alumnoId }, (tx) =>
        tx.alumnoClase.update({
          where: { claseId_alumnoId: { claseId, alumnoId } },
          data: { activa: true, bajaAt: null },
        }),
      );
      if (!hecho.ok) return { ok: false, error: t("docencia.sinPlazas") };
    } else {
      await prisma.alumnoClase.update({
        where: { claseId_alumnoId: { claseId, alumnoId } },
        data: { activa, bajaAt: activa ? null : new Date() },
      });
    }
    revalidatePath(`/profesor/clases/${claseId}`);
    revalidatePath("/profesor");
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error cambiando el acceso del alumno:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/** Abre o cierra el enlace de invitación de la clase. Al abrirlo por primera vez se genera. */
export async function cambiarEnlaceClase(
  claseId: string,
  abierto: boolean,
  /** Cuánta gente admite el enlace de esta clase. 0 o nada = sin tope propio. */
  cupo?: number | null,
): Promise<{ ok: boolean; error?: string; token?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const clase = await prisma.clase.findFirst({
    where: { id: claseId, ...claseQueLleva(profesor.dietistaId, profesor.licencia?.id ?? null) },
    select: { id: true, tokenInvitacion: true },
  });
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };

  try {
    // Al ABRIRLO se genera uno nuevo siempre. Cerrar el enlace es lo que hace el profesor cuando
    // se le ha ido de las manos (se ha filtrado, lo ha reenviado un alumno...), así que reabrirlo
    // con el mismo token no serviría de nada: el viejo volvería a funcionar.
    const token = abierto
      ? randomBytes(18).toString("base64url")
      : (clase.tokenInvitacion ?? randomBytes(18).toString("base64url"));
    // El cupo se guarda al abrir: es cuando el profesor dice "en mi clase somos 60". Al cerrar no
    // se toca, para que al reabrir siga estando el suyo.
    const cupoLimpio = cupo == null || cupo <= 0 ? null : Math.min(Math.floor(cupo), 1000);
    await prisma.clase.update({
      where: { id: claseId },
      data: {
        invitacionAbierta: abierto,
        tokenInvitacion: token,
        ...(abierto ? { cupoEnlace: cupoLimpio } : {}),
      },
    });
    revalidatePath(`/profesor/clases/${claseId}`);
    return { ok: true, token };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error con el enlace de la clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/** Cuántas plazas quedan en la bolsa de la institución del profesor. */
export async function getPlazasLibres(): Promise<number | null> {
  const profesor = await requireProfesor();
  if (!profesor.licencia) return null;
  return plazasLibresDeLicencia(profesor.licencia.id);
}

/** ¿Ese correo es del dominio de la institución? Solo para avisar, nunca para bloquear. */
export async function correoEsDelDominio(email: string): Promise<boolean> {
  const profesor = await requireProfesor();
  return emailDelDominio(email, profesor.licencia?.dominioEmail ?? null);
}

/**
 * Quitar a un alumno de la lista de la clase.
 *
 * Solo se puede con el acceso ya retirado, y es lo que pidió Guillermo (1 sep 2026): un profesor
 * que da la misma asignatura cinco años tendría la ficha llena de gente de cursos pasados. Borra
 * la MATRÍCULA, no la cuenta: el alumno conserva todo su trabajo y, si vuelve, basta con volver a
 * meter su correo.
 */
export async function quitarDeLaClase(
  claseId: string,
  alumnoId: string,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const clase = await prisma.clase.findFirst({
    where: { id: claseId, ...claseQueLleva(profesor.dietistaId, profesor.licencia?.id ?? null) },
    select: { id: true },
  });
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };

  try {
    // Con el acceso puesto no se borra: primero se le retira, y así nadie desaparece de un clic.
    const { count } = await prisma.alumnoClase.deleteMany({
      where: { claseId, alumnoId, activa: false },
    });
    if (count === 0) return { ok: false, error: t("docencia.retiraAntesElAcceso") };

    revalidatePath(`/profesor/clases/${claseId}`);
    revalidatePath("/profesor/clases");
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error quitando al alumno de la clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}
