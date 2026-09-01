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
import { sanitizeString } from "@/lib/validation";
import { sendEmail } from "@/lib/mailer";
import { plazasLibresDeLicencia, alumnoYaOcupaPlaza } from "@/lib/docencia-bolsa";
import { emailDelDominio } from "@/lib/docencia";
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
    where: { id: data.claseId, profesorId: profesor.dietistaId, archivada: false },
    select: { id: true, nombre: true, licenciaDocenteId: true },
  });
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };
  if (!clase.licenciaDocenteId) return { ok: false, error: t("docencia.licenciaNoEncontrada") };

  const correos = [...new Set(
    data.correos.split(/[\n,;]+/).map((c) => sanitizeString(c, 200).toLowerCase().trim()).filter(Boolean),
  )];
  if (correos.length === 0) return { ok: false, error: t("docencia.sinCorreos") };

  const detalle: NonNullable<ResultadoAltaAlumnos["detalle"]> = [];
  const nombreProfesor = `${profesor.nombre} ${profesor.apellidos}`.trim();

  try {
    for (const email of correos) {
      if (!email.includes("@")) {
        detalle.push({ email, resultado: "invalido" });
        continue;
      }

      const existente = await prisma.dietista.findUnique({ where: { email }, select: { id: true } });

      // Las plazas se miran DENTRO del bucle: si quedan tres y se pegan diez correos, entran tres
      // y los demás se avisan, en vez de pasarse de la bolsa vendida. Quien ya ocupa plaza en la
      // institución no vuelve a consumir, así que a ese no se le puede rechazar por bolsa llena.
      const yaOcupa = existente
        ? await alumnoYaOcupaPlaza(clase.licenciaDocenteId, existente.id)
        : false;
      if (!yaOcupa && (await plazasLibresDeLicencia(clase.licenciaDocenteId)) <= 0) {
        detalle.push({ email, resultado: "sinPlazas" });
        continue;
      }

      if (existente) {
        const yaMatriculado = await prisma.alumnoClase.findUnique({
          where: { claseId_alumnoId: { claseId: clase.id, alumnoId: existente.id } },
        });
        if (yaMatriculado) {
          // Si estaba con el acceso retirado, esto se lo devuelve: es la vía de "meter el correo
          // otra vez" que se acordó para el curso siguiente.
          if (!yaMatriculado.activa) {
            await prisma.alumnoClase.update({
              where: { id: yaMatriculado.id },
              data: { activa: true, bajaAt: null },
            });
            detalle.push({ email, resultado: "matriculado" });
          } else {
            detalle.push({ email, resultado: "yaEstaba" });
          }
          continue;
        }

        // Cuenta que ya existe: se le matricula sin tocar nada de lo suyo. Si es un nutricionista
        // con su propia suscripción, la conserva; solo se le marca el rol si no tenía ninguno.
        await prisma.$transaction([
          prisma.alumnoClase.create({ data: { claseId: clase.id, alumnoId: existente.id } }),
          prisma.dietista.updateMany({
            where: { id: existente.id, rolDocente: null },
            data: { rolDocente: "ALUMNO", licenciaDocenteId: clase.licenciaDocenteId },
          }),
        ]);
        detalle.push({ email, resultado: "matriculado" });
        continue;
      }

      // Sin cuenta: invitación con su enlace. Se anula la anterior para que solo haya uno vivo.
      await prisma.invitacionDocente.deleteMany({ where: { email, claseId: clase.id, aceptadaAt: null } });
      const token = randomBytes(24).toString("base64url");
      await prisma.invitacionDocente.create({
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
      sendEmail({
        to: email,
        subject: `${nombreProfesor} te ha dado acceso a Annonia — ${clase.nombre}`,
        html: correoAlumno(clase.nombre, nombreProfesor, `${urlPublica()}/invitacion/${token}`),
      }).catch((err) => console.error("[docencia] Error enviando invitación de alumno:", err));
      detalle.push({ email, resultado: "invitado" });
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
    where: { id: claseId, profesorId: profesor.dietistaId },
    select: { id: true, licenciaDocenteId: true },
  });
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };

  try {
    // Devolver el acceso consume plaza otra vez, salvo que ya la ocupe por la clase de otro profesor.
    if (activa && clase.licenciaDocenteId) {
      const yaOcupa = await alumnoYaOcupaPlaza(clase.licenciaDocenteId, alumnoId);
      if (!yaOcupa && (await plazasLibresDeLicencia(clase.licenciaDocenteId)) <= 0) {
        return { ok: false, error: t("docencia.sinPlazas") };
      }
    }
    await prisma.alumnoClase.update({
      where: { claseId_alumnoId: { claseId, alumnoId } },
      data: { activa, bajaAt: activa ? null : new Date() },
    });
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
): Promise<{ ok: boolean; error?: string; token?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const clase = await prisma.clase.findFirst({
    where: { id: claseId, profesorId: profesor.dietistaId },
    select: { id: true, tokenInvitacion: true },
  });
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };

  try {
    const token = clase.tokenInvitacion ?? randomBytes(18).toString("base64url");
    await prisma.clase.update({
      where: { id: claseId },
      data: { invitacionAbierta: abierto, tokenInvitacion: token },
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
