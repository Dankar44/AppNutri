"use server";

/**
 * #39 (issue #31) — Clases del profesor.
 *
 * Una clase es su grupo ("Dietoterapia 3º A", curso 2026/27). De ella cuelgan los alumnos y, más
 * adelante, los casos que les asigna. Archivar nunca borra nada: es lo que pasa al cerrar un curso
 * o al retirarle el rol a un profesor, y todo vuelve si hace falta.
 */

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isNextNavigation, urlPublica } from "@/lib/utils";
import { sanitizeString, sanitizeStringOptional } from "@/lib/validation";
import { cursoQueSeContrata, finDeCursoPorDefecto } from "@/lib/docencia";
import { requireProfesor } from "./docencia";

function revalidarClases(claseId?: string) {
  revalidatePath("/profesor");
  revalidatePath("/profesor/clases");
  if (claseId) revalidatePath(`/profesor/clases/${claseId}`);
}

export interface ClaseResumen {
  id: string;
  nombre: string;
  curso: string | null;
  archivada: boolean;
  fechaFinCurso: Date | null;
  invitacionAbierta: boolean;
  /** Alumnos con el acceso activo: los que están dentro de verdad. */
  alumnosActivos: number;
  /** Los que lo tuvieron y se les retiró; conservan todo su trabajo. */
  alumnosRetirados: number;
}

/**
 * Comprueba que la clase es de quien la pide. Un profesor no puede tocar la clase de otro **ni
 * aunque sean de la misma universidad**: cada uno responde de sus alumnos.
 */
async function claseDelProfesor(claseId: string, profesorId: string) {
  return prisma.clase.findFirst({ where: { id: claseId, profesorId } });
}

export async function getMisClases(incluirArchivadas = false): Promise<ClaseResumen[]> {
  const profesor = await requireProfesor();

  const clases = await prisma.clase.findMany({
    where: {
      profesorId: profesor.dietistaId,
      ...(incluirArchivadas ? {} : { archivada: false }),
    },
    orderBy: [{ archivada: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { alumnos: { where: { activa: true } } } },
      alumnos: { where: { activa: false }, select: { id: true } },
    },
  });

  return clases.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    curso: c.curso,
    archivada: c.archivada,
    fechaFinCurso: c.fechaFinCurso,
    invitacionAbierta: c.invitacionAbierta,
    alumnosActivos: c._count.alumnos,
    alumnosRetirados: c.alumnos.length,
  }));
}

export async function crearClase(data: {
  nombre: string;
  curso?: string;
}): Promise<{ ok: boolean; error?: string; claseId?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  // Con la licencia cerrada puede seguir entrando y viendo lo suyo, pero no abrir cursos nuevos.
  if (!profesor.puedeDarAltas) return { ok: false, error: t("docencia.licenciaCerrada") };

  const nombre = sanitizeString(data.nombre, 120);
  if (!nombre) return { ok: false, error: t("docencia.nombreClaseObligatorio") };

  try {
    const clase = await prisma.clase.create({
      data: {
        profesorId: profesor.dietistaId,
        licenciaDocenteId: profesor.licencia?.id ?? null,
        nombre,
        curso: sanitizeStringOptional(data.curso, 20) || cursoQueSeContrata(),
        // El curso acaba en agosto; a partir de ahí sus alumnos pierden el acceso.
        fechaFinCurso: new Date(finDeCursoPorDefecto()),
      },
    });
    revalidarClases();
    return { ok: true, claseId: clase.id };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error creando clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

export async function editarClase(
  claseId: string,
  data: { nombre: string; curso?: string; fechaFinCurso?: string },
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  if (!(await claseDelProfesor(claseId, profesor.dietistaId))) {
    return { ok: false, error: t("docencia.claseNoEncontrada") };
  }

  const nombre = sanitizeString(data.nombre, 120);
  if (!nombre) return { ok: false, error: t("docencia.nombreClaseObligatorio") };

  try {
    await prisma.clase.update({
      where: { id: claseId },
      data: {
        nombre,
        curso: sanitizeStringOptional(data.curso, 20) || null,
        fechaFinCurso: data.fechaFinCurso ? new Date(data.fechaFinCurso) : null,
      },
    });
    revalidarClases(claseId);
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error editando clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/**
 * Archivar y desarchivar. No se borra nada nunca: los alumnos conservan sus dietas y sus pacientes
 * de prácticas, y una clase archivada deja de consumir plazas de la bolsa.
 */
export async function archivarClase(
  claseId: string,
  archivar: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  if (!(await claseDelProfesor(claseId, profesor.dietistaId))) {
    return { ok: false, error: t("docencia.claseNoEncontrada") };
  }

  try {
    await prisma.clase.update({
      where: { id: claseId },
      data: { archivada: archivar, archivadaAt: archivar ? new Date() : null },
    });
    revalidarClases(claseId);
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error archivando clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

export interface ClaseDetalle extends ClaseResumen {
  /** El enlace completo, ya montado con el dominio que toca en cada entorno. */
  enlaceInvitacion: string | null;
  alumnos: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
    activa: boolean;
    altaAt: Date;
    bajaAt: Date | null;
    ultimoAcceso: Date | null;
  }[];
}

export async function getClase(claseId: string): Promise<ClaseDetalle | null> {
  const profesor = await requireProfesor();

  const clase = await prisma.clase.findFirst({
    where: { id: claseId, profesorId: profesor.dietistaId },
    include: {
      alumnos: {
        orderBy: [{ activa: "desc" }, { altaAt: "asc" }],
        include: {
          alumno: { select: { id: true, nombre: true, apellidos: true, email: true, lastAccessAt: true } },
        },
      },
    },
  });
  if (!clase) return null;

  return {
    id: clase.id,
    nombre: clase.nombre,
    curso: clase.curso,
    archivada: clase.archivada,
    fechaFinCurso: clase.fechaFinCurso,
    invitacionAbierta: clase.invitacionAbierta,
    enlaceInvitacion: clase.tokenInvitacion ? `${urlPublica()}/clase/${clase.tokenInvitacion}` : null,
    alumnosActivos: clase.alumnos.filter((a) => a.activa).length,
    alumnosRetirados: clase.alumnos.filter((a) => !a.activa).length,
    alumnos: clase.alumnos.map((m) => ({
      id: m.alumno.id,
      nombre: m.alumno.nombre,
      apellidos: m.alumno.apellidos,
      email: m.alumno.email,
      activa: m.activa,
      altaAt: m.altaAt,
      bajaAt: m.bajaAt,
      ultimoAcceso: m.alumno.lastAccessAt,
    })),
  };
}
