"use server";

/**
 * #40 (issue #32) — Los casos clínicos del profesor.
 *
 * Un caso es un PACIENTE de verdad del profesor, rellenado con la ficha de siempre (anamnesis,
 * mediciones, alergias, horario…) como si fuese suyo, más un nombre y una consigna. Es una
 * plantilla: se asigna a varias clases y a varios cursos sin tocarse, y cada alumno recibe una
 * copia entera del paciente la primera vez que lo abre (eso lo hace `aula.ts`).
 *
 * El paciente plantilla lleva `esCasoDocente` para que NO se mezcle con los pacientes reales del
 * profesor: no sale en su lista, ni en su agenda, ni cuenta en ninguna cifra.
 */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isNextNavigation } from "@/lib/utils";
import { sanitizeString, sanitizeStringOptional } from "@/lib/validation";
import { claseQueLleva, cursoTerminado } from "@/lib/docencia";
import { requireProfesor } from "./docencia";
import {
  leerCongelado, leerPacienteCongelable, leerPlanificaciones, leerPlanParaVer,
  type PacienteCongelado, type PlanificacionCongelada,
} from "@/lib/entrega-congelada";
import { copiarPaciente } from "@/lib/copiar-paciente";
import type { Prisma } from "@/generated/prisma/client";
import type { PlanVisualDetalle } from "@/components/paciente/plan-visual";

/**
 * Avisa a los alumnos de una clase. Se hace de golpe con `createMany`: en una clase de 300, uno
 * a uno serían 300 idas y venidas a la base de datos.
 */
async function avisarDelCaso(claseId: string, casoId: string, tipo: "CASO_ASIGNADO") {
  const [caso, matriculas, t] = await Promise.all([
    prisma.casoClinico.findUnique({ where: { id: casoId }, select: { nombre: true } }),
    prisma.alumnoClase.findMany({ where: { claseId, activa: true }, select: { alumnoId: true } }),
    getTranslations("validation"),
  ]);
  if (!caso || matriculas.length === 0) return;

  await prisma.notificacion.createMany({
    data: matriculas.map((m) => ({
      dietistaId: m.alumnoId,
      tipo,
      titulo: t("notificaciones.titulos.casoAsignado"),
      mensaje: caso.nombre,
      tituloKey: "notificaciones.titulos.casoAsignado",
      params: { caso: caso.nombre },
      enlace: "/aula",
    })),
  }).catch((e) => console.error("[docencia] No se pudo avisar del caso:", e));
}

function revalidarCasos(casoId?: string) {
  revalidatePath("/profesor");
  revalidatePath("/profesor/casos");
  if (casoId) revalidatePath(`/profesor/casos/${casoId}`);
}

export interface CasoFormData {
  nombre: string;
  consigna?: string;
  /** Solo al crear: el nombre con el que nace el paciente. Lo demás se rellena en su ficha. */
  pacienteNombre?: string;
  pacienteApellidos?: string;
}

export interface CasoResumen {
  id: string;
  nombre: string;
  /** El paciente plantilla, para enseñar su nombre y para entrar a su ficha. */
  pacienteId: string | null;
  pacienteNombre: string;
  consigna: string | null;
  archivado: boolean;
  /** Si la planificación y los planes de la plantilla se les copian a los alumnos (ver schema). */
  compartirPlanes: boolean;
  /** A cuántas clases está puesto ahora mismo. */
  clases: number;
  /** Cuántos alumnos lo han entregado ya. */
  entregadas: number;
  /** Cuántos lo tienen pendiente (hayan abierto el caso o no). */
  pendientes: number;
}

// Los alumnos de la clase se cuentan aquí: son el total contra el que se mide lo entregado.
// Traerse las entregas una a una para contarlas en JavaScript eran 30.000 filas con veinte casos y
// clases de 300 (auditoría 2 sep 2026).
const RESUMEN_ASIGNACIONES = {
  where: { retiradaAt: null },
  select: {
    id: true,
    clase: { select: { _count: { select: { alumnos: { where: { activa: true } } } } } },
    _count: { select: { entregas: { where: { estado: { in: ["ENTREGADA", "CORREGIDA"] } } } } },
  },
} satisfies Prisma.CasoClinico$asignacionesArgs;

function resumir(c: {
  id: string; nombre: string; consigna: string | null; archivado: boolean; pacienteId: string | null;
  compartirPlanes: boolean;
  paciente: { nombre: string; apellidos: string } | null;
  asignaciones: { clase: { _count: { alumnos: number } }; _count: { entregas: number } }[];
}): CasoResumen {
  const alumnos = c.asignaciones.reduce((n, a) => n + a.clase._count.alumnos, 0);
  const entregadas = c.asignaciones.reduce((n, a) => n + a._count.entregas, 0);
  return {
    id: c.id,
    nombre: c.nombre,
    pacienteId: c.pacienteId,
    pacienteNombre: c.paciente ? `${c.paciente.nombre} ${c.paciente.apellidos}`.trim() : "",
    consigna: c.consigna,
    archivado: c.archivado,
    compartirPlanes: c.compartirPlanes,
    clases: c.asignaciones.length,
    entregadas,
    // Pendiente es todo el que no ha entregado, haya abierto el caso o no.
    pendientes: Math.max(0, alumnos - entregadas),
  };
}

export async function getMisCasos(incluirArchivados = false): Promise<CasoResumen[]> {
  const profesor = await requireProfesor();
  const casos = await prisma.casoClinico.findMany({
    where: {
      profesorId: profesor.dietistaId,
      ...(incluirArchivados ? {} : { archivado: false }),
    },
    orderBy: [{ archivado: "asc" }, { createdAt: "desc" }],
    select: {
      id: true, nombre: true, consigna: true, archivado: true, pacienteId: true, compartirPlanes: true,
      paciente: { select: { nombre: true, apellidos: true } },
      asignaciones: RESUMEN_ASIGNACIONES,
    },
  });
  return casos.map(resumir);
}

export async function getCaso(casoId: string): Promise<CasoResumen | null> {
  const profesor = await requireProfesor();
  const c = await prisma.casoClinico.findFirst({
    where: { id: casoId, profesorId: profesor.dietistaId },
    select: {
      id: true, nombre: true, consigna: true, archivado: true, pacienteId: true, compartirPlanes: true,
      paciente: { select: { nombre: true, apellidos: true } },
      asignaciones: RESUMEN_ASIGNACIONES,
    },
  });
  return c ? resumir(c) : null;
}

/** El caso al que pertenece un paciente plantilla, para pintar el aviso encima de su ficha. */
export async function getCasoDePacientePlantilla(
  pacienteId: string,
): Promise<{ id: string; nombre: string; consigna: string | null; compartirPlanes: boolean } | null> {
  const profesor = await requireProfesor();
  return prisma.casoClinico.findFirst({
    where: { pacienteId, profesorId: profesor.dietistaId },
    select: { id: true, nombre: true, consigna: true, compartirPlanes: true },
  });
}

/**
 * Si la planificación y los planes del paciente plantilla se les dan hechos a los alumnos.
 * Solo afecta a quien empiece el caso a partir de ahora: la copia se hace al abrirlo.
 */
export async function cambiarCompartirPlanes(
  casoId: string,
  compartir: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");
  const { count } = await prisma.casoClinico.updateMany({
    where: { id: casoId, profesorId: profesor.dietistaId },
    data: { compartirPlanes: compartir },
  });
  if (count === 0) return { ok: false, error: t("docencia.casoNoEncontrado") };
  revalidarCasos();
  revalidatePath(`/profesor/casos/${casoId}`);
  return { ok: true };
}

/**
 * Crear un caso: el nombre, la consigna y un paciente NUEVO del profesor, marcado como plantilla.
 * Lo demás —anamnesis, mediciones, alergias, horario— se rellena en la ficha de ese paciente, que
 * es la de siempre: eso es lo que hace realista el caso.
 */
export async function crearCaso(
  data: CasoFormData,
): Promise<{ ok: boolean; error?: string; casoId?: string; pacienteId?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const nombre = sanitizeString(data.nombre, 150);
  if (!nombre) return { ok: false, error: t("docencia.nombreCasoObligatorio") };
  const pacienteNombre = sanitizeString(data.pacienteNombre ?? "", 100);
  if (!pacienteNombre) return { ok: false, error: t("docencia.nombrePacienteObligatorio") };

  try {
    const { caso, paciente } = await prisma.$transaction(async (tx) => {
      const paciente = await tx.paciente.create({
        data: {
          dietistaId: profesor.dietistaId,
          nombre: pacienteNombre,
          apellidos: sanitizeStringOptional(data.pacienteApellidos, 100) ?? "",
          esCasoDocente: true,
        },
      });
      const caso = await tx.casoClinico.create({
        data: {
          profesorId: profesor.dietistaId,
          licenciaDocenteId: profesor.licencia?.id ?? null,
          nombre,
          consigna: sanitizeStringOptional(data.consigna, 4000) || null,
          pacienteId: paciente.id,
        },
      });
      return { caso, paciente };
    });
    revalidarCasos();
    return { ok: true, casoId: caso.id, pacienteId: paciente.id };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error creando caso:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/** Editar el nombre del caso y la consigna. El paciente se edita en su ficha. */
export async function editarCaso(
  casoId: string,
  data: CasoFormData,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const nombre = sanitizeString(data.nombre, 150);
  if (!nombre) return { ok: false, error: t("docencia.nombreCasoObligatorio") };

  const { count } = await prisma.casoClinico.updateMany({
    where: { id: casoId, profesorId: profesor.dietistaId },
    data: { nombre, consigna: sanitizeStringOptional(data.consigna, 4000) || null },
  });
  if (count === 0) return { ok: false, error: t("docencia.casoNoEncontrado") };
  revalidarCasos(casoId);
  if (data.pacienteNombre !== undefined) revalidatePath("/pacientes");
  return { ok: true };
}

/** Archivar y desarchivar. No borra nada: las entregas de cursos pasados siguen ahí. */
export async function archivarCaso(
  casoId: string,
  archivar: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const { count } = await prisma.casoClinico.updateMany({
    where: { id: casoId, profesorId: profesor.dietistaId },
    data: { archivado: archivar },
  });
  if (count === 0) return { ok: false, error: t("docencia.casoNoEncontrado") };
  revalidarCasos(casoId);
  return { ok: true };
}

/** Duplicar: el mismo caso para el curso siguiente, con una copia entera de su paciente. */
export async function duplicarCaso(
  casoId: string,
): Promise<{ ok: boolean; error?: string; casoId?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const original = await prisma.casoClinico.findFirst({
    where: { id: casoId, profesorId: profesor.dietistaId },
    select: { nombre: true, consigna: true, pacienteId: true, licenciaDocenteId: true, compartirPlanes: true },
  });
  if (!original) return { ok: false, error: t("docencia.casoNoEncontrado") };

  try {
    const copia = await prisma.$transaction(async (tx) => {
      const pacienteId = original.pacienteId
        // Es una copia para él mismo: viaja todo, su solución incluida.
        ? await copiarPaciente(tx, original.pacienteId, { dietistaId: profesor.dietistaId, esDeClase: false, conPlanes: true })
        : null;
      if (pacienteId) {
        await tx.paciente.update({ where: { id: pacienteId }, data: { esCasoDocente: true } });
      }
      return tx.casoClinico.create({
        data: {
          profesorId: profesor.dietistaId,
          licenciaDocenteId: original.licenciaDocenteId,
          nombre: sanitizeString(`${original.nombre} (copia)`, 150),
          consigna: original.consigna,
          pacienteId,
          compartirPlanes: original.compartirPlanes,
          archivado: false,
        },
      });
    });
    revalidarCasos();
    return { ok: true, casoId: copia.id };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error duplicando caso:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

// ─── Asignar el caso a una clase ───

export interface AsignacionResumen {
  id: string;
  claseId: string;
  claseNombre: string;
  fechaLimite: Date | null;
  alumnos: number;
  entregadas: number;
  corregidas: number;
}

/** Las clases a las que está puesto un caso, con cómo va cada una. */
export async function getAsignacionesDeCaso(casoId: string): Promise<AsignacionResumen[]> {
  const profesor = await requireProfesor();
  const caso = await prisma.casoClinico.findFirst({
    where: { id: casoId, profesorId: profesor.dietistaId },
    select: { id: true },
  });
  if (!caso) return [];

  const asignaciones = await prisma.asignacionCaso.findMany({
    where: { casoId, retiradaAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      clase: {
        select: {
          id: true, nombre: true,
          _count: { select: { alumnos: { where: { activa: true } } } },
        },
      },
    },
  });

  // Los estados se cuentan en una sola consulta agrupada, no trayéndose las entregas.
  const conteos = await prisma.entregaCaso.groupBy({
    by: ["asignacionId", "estado"],
    where: { asignacionId: { in: asignaciones.map((a) => a.id) } },
    _count: { _all: true },
  });

  return asignaciones.map((a) => {
    const suyos = conteos.filter((c) => c.asignacionId === a.id);
    const cuantos = (estado: string) =>
      suyos.find((c) => c.estado === estado)?._count._all ?? 0;
    return {
      id: a.id,
      claseId: a.clase.id,
      claseNombre: a.clase.nombre,
      fechaLimite: a.fechaLimite,
      alumnos: a.clase._count.alumnos,
      entregadas: cuantos("ENTREGADA"),
      corregidas: cuantos("CORREGIDA"),
    };
  });
}

/** Las clases del profesor a las que todavía no está puesto este caso. */
export async function getClasesParaAsignar(
  casoId: string,
): Promise<{ id: string; nombre: string; curso: string | null }[]> {
  const profesor = await requireProfesor();
  return prisma.clase.findMany({
    where: {
      ...claseQueLleva(profesor.dietistaId),
      archivada: false,
      casosAsignados: { none: { casoId, retiradaAt: null } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, nombre: true, curso: true },
  });
}

/**
 * Pone el caso a una clase con su fecha límite. No crea nada del alumno todavía: su paciente
 * nace la primera vez que abre el caso.
 */
export async function asignarCasoAClase(
  casoId: string,
  claseId: string,
  fechaLimite?: string,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  // Si la asignación ya existía (retirada), se puede revivir aunque el caso esté archivado: si no,
  // archivar + retirar dejaba las entregas invisibles para siempre (auditoría 2 sep 2026).
  const yaExistia = await prisma.asignacionCaso.findUnique({
    where: { casoId_claseId: { casoId, claseId } },
    select: { id: true, fechaLimite: true },
  });
  const caso = await prisma.casoClinico.findFirst({
    where: { id: casoId, profesorId: profesor.dietistaId, ...(yaExistia ? {} : { archivado: false }) },
    select: { id: true },
  });
  if (!caso) return { ok: false, error: t("docencia.casoNoEncontrado") };

  const clase = await prisma.clase.findFirst({
    where: { id: claseId, archivada: false, ...claseQueLleva(profesor.dietistaId) },
    select: { id: true, fechaFinCurso: true },
  });
  if (!clase) return { ok: false, error: t("docencia.claseNoEncontrada") };
  // Con el curso pasado no se asigna: sus alumnos ya no entran a la clase.
  if (cursoTerminado(clase.fechaFinCurso)) return { ok: false, error: t("docencia.cursoTerminado") };

  const limite = fechaLimite ? new Date(fechaLimite) : null;
  if (limite && Number.isNaN(limite.getTime())) {
    return { ok: false, error: t("docencia.fechaLimiteNoValida") };
  }

  try {
    await prisma.asignacionCaso.upsert({
      where: { casoId_claseId: { casoId, claseId } },
      create: { casoId, claseId, fechaLimite: limite, asignadoPor: profesor.dietistaId },
      // Si estaba retirada, volver a asignarla la revive con sus entregas. Sin fecha nueva se
      // conserva la que tenía: pisarla con null borraba el plazo sin querer.
      update: {
        ...(fechaLimite === undefined ? {} : { fechaLimite: limite }),
        retiradaAt: null,
        asignadoPor: profesor.dietistaId,
      },
    });

    // Aviso a los alumnos: sin esto, un caso puesto a mitad de semana no se entera nadie hasta
    // que entra al aula por su cuenta.
    await avisarDelCaso(claseId, casoId, "CASO_ASIGNADO");

    revalidarCasos(casoId);
    revalidatePath("/aula");
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error asignando caso:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/** Cambia la fecha límite de una asignación que ya está puesta. */
export async function cambiarFechaLimite(
  asignacionId: string,
  fechaLimite?: string,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const asignacion = await prisma.asignacionCaso.findFirst({
    where: { id: asignacionId, caso: { profesorId: profesor.dietistaId } },
    select: { id: true, casoId: true },
  });
  if (!asignacion) return { ok: false, error: t("docencia.casoNoEncontrado") };

  const limite = fechaLimite ? new Date(fechaLimite) : null;
  if (limite && Number.isNaN(limite.getTime())) {
    return { ok: false, error: t("docencia.fechaLimiteNoValida") };
  }

  await prisma.asignacionCaso.update({ where: { id: asignacionId }, data: { fechaLimite: limite } });
  revalidarCasos(asignacion.casoId);
  revalidatePath("/aula");
  return { ok: true };
}

/**
 * Retira el caso de una clase. **No borra lo entregado**: las entregas y los pacientes que los
 * alumnos ya crearon siguen ahí; lo que pasa es que deja de salirles como pendiente.
 */
export async function retirarAsignacion(
  asignacionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const asignacion = await prisma.asignacionCaso.findFirst({
    where: { id: asignacionId, caso: { profesorId: profesor.dietistaId } },
    select: { id: true, casoId: true },
  });
  if (!asignacion) return { ok: false, error: t("docencia.casoNoEncontrado") };

  await prisma.asignacionCaso.update({
    where: { id: asignacionId },
    data: { retiradaAt: new Date() },
  });
  revalidarCasos(asignacion.casoId);
  revalidatePath("/aula");
  return { ok: true };
}

// ─── Corregir lo que entrega el alumno ───

export interface EntregaResumen {
  id: string;
  alumnoId: string;
  alumnoNombre: string;
  alumnoEmail: string;
  estado: "SIN_EMPEZAR" | "EN_MARCHA" | "ENTREGADA" | "CORREGIDA";
  entregadaAt: Date | null;
  /** La entregó después de la fecha límite. */
  tarde: boolean;
  nota: number | null;
  comentario: string | null;
  visibleParaAlumno: boolean;
  /** Cuántos planes le ha hecho al paciente del caso: es lo que se corrige. */
  planes: number;
  /** Entregó con el PDF del entregable. */
  conPdf: boolean;
  /** Ya no está en la clase, pero entregó: su trabajo se sigue viendo y corrigiendo. */
  fuera: boolean;
}

/** Cómo va una asignación: todos los alumnos de la clase, hayan empezado o no. */
export async function getEntregasDeAsignacion(asignacionId: string): Promise<EntregaResumen[]> {
  const profesor = await requireProfesor();

  const asignacion = await prisma.asignacionCaso.findFirst({
    where: { id: asignacionId, caso: { profesorId: profesor.dietistaId } },
    select: {
      id: true, fechaLimite: true,
      clase: {
        select: {
          alumnos: {
            where: { activa: true },
            orderBy: { altaAt: "asc" },
            select: { alumno: { select: { id: true, nombre: true, apellidos: true, email: true } } },
          },
        },
      },
      entregas: {
        select: {
          id: true, alumnoId: true, estado: true, entregadaAt: true, nota: true,
          comentario: true, visibleParaAlumno: true, entregableNombre: true,
          alumno: { select: { id: true, nombre: true, apellidos: true, email: true } },
          paciente: { select: { _count: { select: { planes: true } } } },
        },
      },
    },
  });
  if (!asignacion) return [];

  const porAlumno = new Map(asignacion.entregas.map((e) => [e.alumnoId, e]));

  // Se listan TODOS los alumnos de la clase, no solo los que han empezado: al profesor lo que le
  // interesa ver de un vistazo es quién no ha tocado el caso todavía. Y también los que YA NO
  // están en la clase pero tienen algo entregado: si no, retirarle el acceso a un alumno escondía
  // su trabajo —y su nota— de los dos lados (auditoría 2 sep 2026).
  const enLaClase = new Set(asignacion.clase.alumnos.map((a) => a.alumno.id));
  const exalumnos = asignacion.entregas
    .filter((e) => !enLaClase.has(e.alumnoId))
    .map((e) => ({ alumno: e.alumno, fuera: true }));
  const todos = [
    ...asignacion.clase.alumnos.map((a) => ({ alumno: a.alumno, fuera: false })),
    ...exalumnos,
  ];

  return todos.map(({ alumno, fuera }) => {
    const e = porAlumno.get(alumno.id);
    return {
      fuera,
      id: e?.id ?? "",
      alumnoId: alumno.id,
      alumnoNombre: `${alumno.nombre} ${alumno.apellidos}`.trim(),
      alumnoEmail: alumno.email,
      estado: (e?.estado ?? "SIN_EMPEZAR") as EntregaResumen["estado"],
      entregadaAt: e?.entregadaAt ?? null,
      // "Tarde" es DESPUÉS del último día, no durante. La fecha se elige en un selector de día y
      // se guarda a medianoche UTC: quien entrega el mismo día del límite ha llegado a tiempo.
      tarde: e?.entregadaAt != null && cursoTerminado(asignacion.fechaLimite, e.entregadaAt),
      nota: e?.nota ?? null,
      comentario: e?.comentario ?? null,
      visibleParaAlumno: e?.visibleParaAlumno ?? false,
      planes: e?.paciente?._count.planes ?? 0,
      conPdf: !!e?.entregableNombre,
    };
  });
}

/**
 * Pone la nota. El interruptor decide si el alumno la ve ya o si el profesor prefiere publicarlas
 * todas a la vez cuando termine de corregir (se acordó el 27 ago 2026).
 */
export async function corregirEntrega(
  entregaId: string,
  data: { nota?: number | null; comentario?: string; visibleParaAlumno: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const entrega = await prisma.entregaCaso.findFirst({
    where: { id: entregaId, asignacion: { caso: { profesorId: profesor.dietistaId } } },
    select: {
      id: true, alumnoId: true, estado: true,
      asignacion: { select: { casoId: true, caso: { select: { nombre: true } } } },
    },
  });
  if (!entrega) return { ok: false, error: t("docencia.entregaNoEncontrada") };
  // No se corrige lo que todavía no han entregado: dejaría al alumno encerrado (no puede entregar
  // ni deshacer nada una vez corregido) y con una nota sobre un trabajo a medias.
  if (entrega.estado !== "ENTREGADA" && entrega.estado !== "CORREGIDA") {
    return { ok: false, error: t("docencia.todaviaNoHaEntregado") };
  }

  const nota = data.nota === null || data.nota === undefined ? null : Number(data.nota);
  if (nota !== null && (!Number.isFinite(nota) || nota < 0 || nota > 10)) {
    return { ok: false, error: t("docencia.notaFueraDeRango") };
  }
  const comentario = sanitizeStringOptional(data.comentario, 4000) || null;
  // Corregir sin poner ni nota ni comentario no es corregir: dejaría "Corregida" y nada más.
  if (nota === null && !comentario) return { ok: false, error: t("docencia.notaOComentario") };

  try {
    await prisma.entregaCaso.update({
      where: { id: entregaId },
      data: {
        nota,
        comentario,
        visibleParaAlumno: data.visibleParaAlumno,
        estado: "CORREGIDA",
        corregidaAt: new Date(),
        corregidaPor: profesor.dietistaId,
      },
    select: { id: true },
    });
    // Solo se le avisa si va a poder verla: si el profesor corrige sin publicar, el aviso le
    // mandaría a mirar algo que todavía no está.
    if (data.visibleParaAlumno) {
      const t = await getTranslations("validation");
      await prisma.notificacion.create({
        data: {
          dietistaId: entrega.alumnoId,
          tipo: "CASO_CORREGIDO",
          titulo: t("notificaciones.titulos.casoCorregido"),
          mensaje: entrega.asignacion.caso.nombre,
          tituloKey: "notificaciones.titulos.casoCorregido",
          params: { caso: entrega.asignacion.caso.nombre },
          enlace: "/aula",
        },
      }).catch((e) => console.error("[docencia] No se pudo avisar de la corrección:", e));
    }

    revalidarCasos(entrega.asignacion.casoId);
    revalidatePath("/aula");
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error corrigiendo la entrega:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/** Deshacer la corrección: vuelve a estar entregada, sin nota. */
export async function deshacerCorreccion(
  entregaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const entrega = await prisma.entregaCaso.findFirst({
    where: { id: entregaId, asignacion: { caso: { profesorId: profesor.dietistaId } } },
    select: { id: true, entregadaAt: true, asignacion: { select: { casoId: true } } },
  });
  if (!entrega) return { ok: false, error: t("docencia.entregaNoEncontrada") };

  await prisma.entregaCaso.update({
    where: { id: entregaId },
    data: {
      estado: entrega.entregadaAt ? "ENTREGADA" : "EN_MARCHA",
      nota: null, comentario: null, visibleParaAlumno: false,
      corregidaAt: null, corregidaPor: null,
    },
    select: { id: true },
  });
  revalidarCasos(entrega.asignacion.casoId);
  revalidatePath("/aula");
  return { ok: true };
}

export interface TrabajoDeEntrega {
  entregaId: string;
  alumnoNombre: string;
  casoNombre: string;
  claseNombre: string;
  /** El paciente plantilla del profesor, para comparar su plan con el del alumno. */
  casoPacienteId: string | null;
  estado: string;
  entregadaAt: Date | null;
  /**
   * Si lo que se ve es la FOTO de la entrega (lo normal) o el trabajo en vivo (todavía no ha
   * entregado). La foto no cambia por mucho que el alumno siga tocando su paciente.
   */
  congelado: boolean;
  /** Lo que el alumno escribió al entregar. */
  notaAlumno: string | null;
  nota: number | null;
  comentario: string | null;
  visibleParaAlumno: boolean;
  /** El PDF que entregó, si lo hizo: nombre del archivo, plan del que salió y tamaño. */
  entregable: { nombre: string; planNombre: string | null; bytes: number | null } | null;
  /** El paciente del caso, tal y como lo dejó el alumno (en la foto, o en vivo). */
  paciente: PacienteCongelado | null;
  /** Sus planificaciones: objetivos, peso, fórmulas, reparto. */
  planificaciones: PlanificacionCongelada[];
  planes: { id: string; nombre: string; activo: boolean; dias: number }[];
  /** El plan que se está mirando, listo para pintar. */
  planVisto: PlanVisualDetalle | null;
}

/**
 * Lo que ha entregado el alumno, para que el profesor lo corrija.
 *
 * Es de SOLO LECTURA y, una vez entregado, es la FOTO del momento de la entrega (Guillermo,
 * 2 sep 2026: "lo que se envíe se envíe"): el alumno puede seguir tocando su paciente, que es
 * suyo, y aquí no cambia nada salvo que vuelva a entregar. Mientras no ha entregado se ve el
 * trabajo en vivo, avisando de ello.
 */
export async function getTrabajoDeEntrega(
  entregaId: string,
  planId?: string,
): Promise<TrabajoDeEntrega | null> {
  const profesor = await requireProfesor();

  const entrega = await prisma.entregaCaso.findFirst({
    where: { id: entregaId, asignacion: { caso: { profesorId: profesor.dietistaId } } },
    select: {
      id: true, estado: true, entregadaAt: true, notaAlumno: true, nota: true, comentario: true,
      visibleParaAlumno: true, pacienteId: true, entregaSnapshot: true, entregablePlanId: true,
      entregableNombre: true, entregableBytes: true,
      alumno: { select: { nombre: true, apellidos: true } },
      asignacion: {
        select: { caso: { select: { nombre: true, pacienteId: true } }, clase: { select: { nombre: true } } },
      },
    },
  });
  if (!entrega) return null;

  const foto = leerCongelado(entrega.entregaSnapshot);
  const congelado = foto !== null && (entrega.estado === "ENTREGADA" || entrega.estado === "CORREGIDA");

  let paciente: PacienteCongelado | null;
  let planificaciones: PlanificacionCongelada[];
  let planes: PlanVisualDetalle[];
  if (congelado && foto) {
    paciente = foto.paciente;
    planificaciones = foto.planificaciones;
    planes = foto.planes;
  } else if (entrega.pacienteId) {
    // En vivo: todavía no ha entregado. Se lee igual que se congelará, para que no haya dos vistas.
    paciente = await leerPacienteCongelable(entrega.pacienteId);
    planificaciones = await leerPlanificaciones(entrega.pacienteId);
    const ids = await prisma.planAlimenticio.findMany({
      where: { pacienteId: entrega.pacienteId },
      orderBy: [{ activo: "desc" }, { createdAt: "desc" }],
      select: { id: true },
    });
    planes = [];
    for (const { id } of ids) {
      const plan = await leerPlanParaVer(id);
      if (plan) planes.push(plan);
    }
  } else {
    paciente = null;
    planificaciones = [];
    planes = [];
  }

  const planVisto = (planId ? planes.find((p) => p.id === planId) : planes[0]) ?? null;

  return {
    entregaId: entrega.id,
    alumnoNombre: `${entrega.alumno.nombre} ${entrega.alumno.apellidos}`.trim(),
    casoNombre: entrega.asignacion.caso.nombre,
    claseNombre: entrega.asignacion.clase.nombre,
    casoPacienteId: entrega.asignacion.caso.pacienteId,
    estado: entrega.estado,
    entregadaAt: entrega.entregadaAt,
    congelado,
    notaAlumno: entrega.notaAlumno,
    nota: entrega.nota,
    comentario: entrega.comentario,
    visibleParaAlumno: entrega.visibleParaAlumno,
    entregable: entrega.entregableNombre
      ? {
          nombre: entrega.entregableNombre,
          planNombre: planes.find((p) => p.id === entrega.entregablePlanId)?.nombre ?? null,
          bytes: entrega.entregableBytes,
        }
      : null,
    paciente,
    planificaciones,
    planes: planes.map((p) => ({ id: p.id, nombre: p.nombre, activo: p.activo, dias: p.dias.length })),
    planVisto,
  };
}

/** Los casos puestos a una clase, para verlos desde la ficha de la clase (la otra puerta). */
export async function getCasosDeClase(claseId: string): Promise<
  {
    asignacionId: string;
    casoId: string;
    nombre: string;
    /** El paciente plantilla: desde la clase se abre directamente su ficha. */
    pacienteId: string | null;
    pacienteNombre: string | null;
    fechaLimite: Date | null;
    entregadas: number;
    alumnos: number;
  }[]
> {
  const profesor = await requireProfesor();
  const clase = await prisma.clase.findFirst({
    where: { id: claseId, ...claseQueLleva(profesor.dietistaId) },
    select: { _count: { select: { alumnos: { where: { activa: true } } } } },
  });
  if (!clase) return [];

  const asignaciones = await prisma.asignacionCaso.findMany({
    where: { claseId, retiradaAt: null, caso: { archivado: false } },
    orderBy: [{ fechaLimite: "asc" }, { createdAt: "desc" }],
    select: {
      id: true, fechaLimite: true,
      caso: { select: { id: true, nombre: true, paciente: { select: { id: true, nombre: true, apellidos: true } } } },
      _count: { select: { entregas: { where: { estado: { in: ["ENTREGADA", "CORREGIDA"] } } } } },
    },
  });
  return asignaciones.map((a) => ({
    asignacionId: a.id,
    casoId: a.caso.id,
    nombre: a.caso.nombre,
    pacienteId: a.caso.paciente?.id ?? null,
    pacienteNombre: a.caso.paciente ? `${a.caso.paciente.nombre} ${a.caso.paciente.apellidos}`.trim() : null,
    fechaLimite: a.fechaLimite,
    entregadas: a._count.entregas,
    alumnos: clase._count.alumnos,
  }));
}
