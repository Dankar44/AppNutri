"use server";

/**
 * #39 (issue #31) — Clases del profesor.
 *
 * Una clase es su grupo ("Dietoterapia 3º A", del 4/9/2026 al 31/8/2027). De ella cuelgan los alumnos y, más
 * adelante, los casos que les asigna. Archivar nunca borra nada: es lo que pasa al cerrar un curso
 * o al retirarle el rol a un profesor, y todo vuelve si hace falta.
 */

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isNextNavigation, urlPublica } from "@/lib/utils";
import { sanitizeString } from "@/lib/validation";
import { finDeCursoPorDefecto, inicioDeCursoPorDefecto, claseQueLleva } from "@/lib/docencia";
import { plazasLibresDeLicencia } from "@/lib/docencia-bolsa";
import { requireProfesor } from "./docencia";

function revalidarClases(claseId?: string) {
  revalidatePath("/profesor");
  revalidatePath("/profesor/clases");
  if (claseId) revalidatePath(`/profesor/clases/${claseId}`);
}

export interface ClaseResumen {
  id: string;
  nombre: string;
  fechaInicioCurso: Date | null;
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
async function claseDelProfesor(claseId: string, profesorId: string, licenciaId: string | null) {
  return prisma.clase.findFirst({ where: { id: claseId, ...claseQueLleva(profesorId, licenciaId) } });
}

export async function getMisClases(incluirArchivadas = false): Promise<ClaseResumen[]> {
  const profesor = await requireProfesor();

  const clases = await prisma.clase.findMany({
    where: {
      ...claseQueLleva(profesor.dietistaId, profesor.licencia?.id ?? null),
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
    fechaInicioCurso: c.fechaInicioCurso,
    archivada: c.archivada,
    fechaFinCurso: c.fechaFinCurso,
    invitacionAbierta: c.invitacionAbierta,
    alumnosActivos: c._count.alumnos,
    alumnosRetirados: c.alumnos.length,
  }));
}

/**
 * Un curso no puede acabar antes de empezar.
 *
 * Se colaba tal cual: «Del 15/09/2027 al 31/08/2027» (Guillermo, 8 sep 2026). Y no es cosmético:
 * de la fecha de fin depende cuándo pierden el acceso los alumnos, así que una clase al revés
 * nace con el curso ya terminado y nadie entra. Se comprueba aquí porque el selector de fechas es
 * compartido con media aplicación y no distingue de qué par de fechas se trata.
 */
function cursoAlReves(inicio: string, fin: string): boolean {
  const i = new Date(inicio).getTime();
  const f = new Date(fin).getTime();
  if (Number.isNaN(i) || Number.isNaN(f)) return false;
  return f <= i;
}

/** Una fecha que el navegador no manda bien: mejor decirlo que guardar un `Invalid Date`. */
function fechaImposible(valor: string | undefined): boolean {
  return !!valor && Number.isNaN(new Date(valor).getTime());
}

export async function crearClase(data: {
  nombre: string;
  /** YYYY-MM-DD. Sin ellas: empieza hoy y acaba el próximo 31 de agosto. */
  fechaInicioCurso?: string;
  fechaFinCurso?: string;
}): Promise<{ ok: boolean; error?: string; claseId?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  // Con la licencia cerrada puede seguir entrando y viendo lo suyo, pero no abrir cursos nuevos.
  if (!profesor.puedeDarAltas) return { ok: false, error: t("docencia.licenciaCerrada") };

  const nombre = sanitizeString(data.nombre, 120);
  if (!nombre) return { ok: false, error: t("docencia.nombreClaseObligatorio") };

  const inicio = data.fechaInicioCurso || inicioDeCursoPorDefecto();
  const fin = data.fechaFinCurso || finDeCursoPorDefecto();
  if (fechaImposible(data.fechaInicioCurso) || fechaImposible(data.fechaFinCurso)) {
    return { ok: false, error: t("docencia.fechaNoValida") };
  }
  if (cursoAlReves(inicio, fin)) return { ok: false, error: t("docencia.cursoAlReves") };

  try {
    const clase = await prisma.clase.create({
      data: {
        profesorId: profesor.dietistaId,
        licenciaDocenteId: profesor.licencia?.id ?? null,
        nombre,
        // El curso va de la fecha de inicio a la de fin (por defecto de hoy al próximo 31 de
        // agosto); a partir de ahí sus alumnos pierden la clase.
        fechaInicioCurso: new Date(inicio),
        fechaFinCurso: new Date(fin),
        // El que la crea es el primero de la lista de quienes la llevan: así el permiso se
        // comprueba en un solo sitio, mire quien mire.
        profesores: { create: { profesorId: profesor.dietistaId } },
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
  data: { nombre: string; fechaInicioCurso?: string; fechaFinCurso?: string },
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  if (!(await claseDelProfesor(claseId, profesor.dietistaId, profesor.licencia?.id ?? null))) {
    return { ok: false, error: t("docencia.claseNoEncontrada") };
  }

  const nombre = sanitizeString(data.nombre, 120);
  if (!nombre) return { ok: false, error: t("docencia.nombreClaseObligatorio") };

  if (fechaImposible(data.fechaInicioCurso) || fechaImposible(data.fechaFinCurso)) {
    return { ok: false, error: t("docencia.fechaNoValida") };
  }
  if (data.fechaInicioCurso && data.fechaFinCurso && cursoAlReves(data.fechaInicioCurso, data.fechaFinCurso)) {
    return { ok: false, error: t("docencia.cursoAlReves") };
  }

  try {
    await prisma.clase.update({
      where: { id: claseId },
      data: {
        nombre,
        fechaInicioCurso: data.fechaInicioCurso ? new Date(data.fechaInicioCurso) : null,
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

  const clase = await claseDelProfesor(claseId, profesor.dietistaId, profesor.licencia?.id ?? null);
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };

  try {
    // Desarchivar devuelve el acceso a todos los alumnos de esa clase de golpe, y eso vuelve a
    // consumir plazas. Sin esta comprobación se podía duplicar la bolsa vendida: llenar una clase,
    // archivarla (el contador cae a cero), llenar otra y desarchivar la primera. 600 alumnos con
    // acceso sobre 300 vendidos (auditoría 1 sep 2026).
    if (!archivar && clase.licenciaDocenteId) {
      const vuelven = await prisma.alumnoClase.count({
        where: {
          claseId,
          activa: true,
          // Los que ya ocupan plaza por la clase de otro profesor no cuentan otra vez.
          alumno: {
            matriculas: {
              none: {
                activa: true,
                clase: { licenciaDocenteId: clase.licenciaDocenteId, archivada: false, id: { not: claseId } },
              },
            },
          },
        },
      });
      const libres = await plazasLibresDeLicencia(clase.licenciaDocenteId);
      if (vuelven > libres) {
        return { ok: false, error: t("docencia.noCabenAlDesarchivar", { vuelven, libres }) };
      }
    }

    await prisma.clase.update({
      where: { id: claseId },
      data: { archivada: archivar, archivadaAt: archivar ? new Date() : null },
    });
    // Al desarchivar, sus alumnos la vuelven a tener. Si alguno había pasado ya a cuenta normal
    // (se le acabó el año escolar con la clase archivada), vuelve a ser alumno.
    if (!archivar) {
      await prisma.dietista.updateMany({
        where: { rolDocente: null, matriculas: { some: { claseId, activa: true } } },
        data: { rolDocente: "ALUMNO", ...(clase.licenciaDocenteId ? { licenciaDocenteId: clase.licenciaDocenteId } : {}) },
      });
    }
    revalidarClases(claseId);
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error archivando clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

export interface ClaseDetalle extends ClaseResumen {
  /** Quién la creó: es el único que puede eliminarla o sacar a otro profesor. */
  profesorId: string;
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
    where: { id: claseId, ...claseQueLleva(profesor.dietistaId, profesor.licencia?.id ?? null) },
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
    profesorId: clase.profesorId,
    fechaInicioCurso: clase.fechaInicioCurso,
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

/**
 * Eliminar la clase del todo: se van sus matrículas, sus casos asignados con las entregas y sus
 * invitaciones; las plazas vuelven a la bolsa. No se puede deshacer (Guillermo, 4 sep 2026:
 * "eliminar elimina todo… sin poder recuperarla"). Los alumnos conservan su cuenta y sus
 * pacientes; el paciente de cada caso es suyo y no se toca.
 */
export async function eliminarClase(claseId: string): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");
  const clase = await claseDelProfesor(claseId, profesor.dietistaId, profesor.licencia?.id ?? null);
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };
  // Borrar es irreversible y se lleva matrículas, casos asignados y entregas: solo puede hacerlo
  // quien creó la clase (Guillermo, 6 sep 2026: entre compañeros nadie se pisa lo del otro). A los
  // demás les queda archivar, que no borra nada.
  if (clase.profesorId !== profesor.dietistaId) {
    return { ok: false, error: t("docencia.soloElCreadorElimina") };
  }
  try {
    await prisma.clase.delete({ where: { id: claseId } });
    revalidarClases();
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error eliminando clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/**
 * Cerrar el curso: retira de golpe el acceso a todos los alumnos de la clase.
 *
 * Es lo que hace el profesor en junio. No borra nada — el trabajo de los alumnos sigue ahí, y
 * ellos verán una pantalla que se lo explica — y devuelve todas esas plazas a la bolsa para el
 * curso siguiente. Se puede deshacer alumno a alumno devolviéndoles el acceso.
 */
export async function cerrarCursoDeClase(
  claseId: string,
): Promise<{ ok: boolean; error?: string; alumnos?: number }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  if (!(await claseDelProfesor(claseId, profesor.dietistaId, profesor.licencia?.id ?? null))) {
    return { ok: false, error: t("docencia.claseNoEncontrada") };
  }

  try {
    const { count } = await prisma.alumnoClase.updateMany({
      where: { claseId, activa: true },
      data: { activa: false, bajaAt: new Date() },
    });
    revalidarClases(claseId);
    return { ok: true, alumnos: count };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error cerrando el curso:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

export interface ProfesorDeClase {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  /** La creó él. No se le puede quitar: es a quien el alumno ve como su profesor. */
  esElCreador: boolean;
}

/** Quiénes llevan esta clase. */
export async function getProfesoresDeClase(claseId: string): Promise<ProfesorDeClase[]> {
  const profesor = await requireProfesor();
  const clase = await claseDelProfesor(claseId, profesor.dietistaId, profesor.licencia?.id ?? null);
  if (!clase) return [];

  const filas = await prisma.profesorClase.findMany({
    where: { claseId },
    orderBy: { createdAt: "asc" },
    select: { profesor: { select: { id: true, nombre: true, apellidos: true, email: true } } },
  });
  return filas.map((f) => ({
    id: f.profesor.id,
    nombre: f.profesor.nombre,
    apellidos: f.profesor.apellidos,
    email: f.profesor.email,
    esElCreador: f.profesor.id === clase.profesorId,
  }));
}

/** Los compañeros de su facultad a los que puede meter en la clase (los que aún no están). */
export async function getProfesoresQuePuedeAnadir(claseId: string): Promise<ProfesorDeClase[]> {
  const profesor = await requireProfesor();
  if (!profesor.licencia) return [];
  if (!(await claseDelProfesor(claseId, profesor.dietistaId, profesor.licencia?.id ?? null))) return [];

  const candidatos = await prisma.dietista.findMany({
    where: {
      rolDocente: "PROFESOR",
      licenciaDocenteId: profesor.licencia.id,
      clasesQueLleva: { none: { claseId } },
    },
    orderBy: [{ apellidos: "asc" }, { nombre: "asc" }],
    select: { id: true, nombre: true, apellidos: true, email: true },
  });
  return candidatos.map((c) => ({ ...c, esElCreador: false }));
}

/**
 * Añade a otro profesor de la misma facultad a la clase. Pasa a verlo todo: los alumnos, el
 * material y, más adelante, los casos y las entregas.
 */
export async function anadirProfesorAClase(
  claseId: string,
  profesorId: string,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const clase = await claseDelProfesor(claseId, profesor.dietistaId, profesor.licencia?.id ?? null);
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };

  // Solo profesores de SU misma licencia: si no, se podría meter a cualquiera con su id.
  const candidato = await prisma.dietista.findFirst({
    where: {
      id: profesorId,
      rolDocente: "PROFESOR",
      licenciaDocenteId: profesor.licencia?.id ?? "sin-licencia",
    },
    select: { id: true },
  });
  if (!candidato) return { ok: false, error: t("docencia.profesorNoEsDeTuFacultad") };

  try {
    await prisma.profesorClase.upsert({
      where: { claseId_profesorId: { claseId, profesorId } },
      create: { claseId, profesorId },
      update: {},
    });
    revalidarClases(claseId);
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error añadiendo profesor a la clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/**
 * Salir de una clase por decisión propia (Guillermo, 6 sep 2026). Nadie echa a nadie: cada uno se
 * quita a sí mismo cuando deja de dar esa asignatura, y sigue siendo profesor de su facultad.
 *
 * Si el que se va es quien la creó y quedan otros, la clase pasa al primero de ellos. Si no queda
 * NADIE, la clase se elimina entera —con sus matrículas, casos asignados y entregas— porque una
 * clase sin profesor no la puede recuperar ni mirar nadie, y sus PDFs seguirían ocupando sitio
 * para siempre (Guillermo, 6 sep 2026: «se sale… y se borran todos los archivos enviados»). Como
 * eso no tiene vuelta atrás, hace falta pedirlo dos veces: la primera devuelve `hayQueConfirmar`
 * para que la pantalla avise, y solo con `borrarLaClase` se ejecuta.
 */
export async function salirDeClase(
  claseId: string,
  borrarLaClase = false,
): Promise<{ ok: boolean; error?: string; hayQueConfirmar?: boolean; borrada?: boolean }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const clase = await claseDelProfesor(claseId, profesor.dietistaId, profesor.licencia?.id ?? null);
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };

  const otros = await prisma.profesorClase.findMany({
    where: { claseId, profesorId: { not: profesor.dietistaId } },
    orderBy: { createdAt: "asc" },
    select: { profesorId: true },
  });

  // Nadie más la lleva: salir es borrarla. Se avisa antes.
  if (otros.length === 0) {
    if (!borrarLaClase) return { ok: false, hayQueConfirmar: true, error: t("docencia.salirBorraLaClase") };
    try {
      await prisma.clase.delete({ where: { id: claseId } });
      revalidarClases();
      return { ok: true, borrada: true };
    } catch (e) {
      if (isNextNavigation(e)) throw e;
      console.error("[docencia] Error borrando la clase al salir de ella:", e);
      return { ok: false, error: t("general.errorDesconocido") };
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (clase.profesorId === profesor.dietistaId) {
        await tx.clase.update({ where: { id: claseId }, data: { profesorId: otros[0].profesorId } });
      }
      await tx.profesorClase.deleteMany({ where: { claseId, profesorId: profesor.dietistaId } });
    });
    revalidarClases(claseId);
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error saliendo de la clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/**
 * Saca a OTRO profesor de la clase. Solo puede hacerlo quien la creó: entre compañeros nadie echa
 * a nadie (Guillermo, 6 sep 2026), cada uno se sale con «Salir de esta clase». Al creador tampoco
 * se le saca: la clase se quedaría sin dueño.
 */
export async function quitarProfesorDeClase(
  claseId: string,
  profesorId: string,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const clase = await claseDelProfesor(claseId, profesor.dietistaId, profesor.licencia?.id ?? null);
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };
  if (clase.profesorId === profesorId) {
    return { ok: false, error: t("docencia.alCreadorNoSeLeQuita") };
  }
  if (clase.profesorId !== profesor.dietistaId) {
    return { ok: false, error: t("docencia.soloElCreadorQuita") };
  }

  try {
    await prisma.profesorClase.deleteMany({ where: { claseId, profesorId } });
    revalidarClases(claseId);
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error quitando profesor de la clase:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}
