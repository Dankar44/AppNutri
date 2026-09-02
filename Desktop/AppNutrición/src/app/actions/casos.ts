"use server";

/**
 * #40 (issue #32) — Los casos clínicos del profesor.
 *
 * Un caso es un paciente ficticio con su historia y lo que se le pide al alumno. Es una plantilla:
 * se asigna a varias clases y a varios cursos sin tocarse. Al asignarlo, cada alumno acaba
 * teniendo su propia copia como paciente de verdad de su cuenta (eso lo hace `aula.ts` la primera
 * vez que lo abre).
 *
 * Los casos NO se mezclan con los pacientes reales del profesor: viven aquí, en su espacio
 * docente, que era la condición de partida.
 */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isNextNavigation } from "@/lib/utils";
import { sanitizeString, sanitizeStringOptional, validateNumberOptional, LIMITS } from "@/lib/validation";
import { claseQueLleva, cursoTerminado } from "@/lib/docencia";
import { requireProfesor } from "./docencia";
import type { Sexo, ObjetivoPaciente } from "@/generated/prisma/client";

function revalidarCasos(casoId?: string) {
  revalidatePath("/profesor");
  revalidatePath("/profesor/casos");
  if (casoId) revalidatePath(`/profesor/casos/${casoId}`);
}

/** Trocea un textarea de "uno por línea" en lista, sin vacíos ni repetidos. */
function porLineas(valor: string | undefined, max = 30): string[] {
  if (!valor) return [];
  return [...new Set(
    valor.split(/[\n,;]+/).map((x) => sanitizeString(x, 120)).filter(Boolean),
  )].slice(0, max);
}

export interface CasoFormData {
  nombre: string;
  consigna?: string;
  pacienteNombre: string;
  pacienteApellidos?: string;
  sexo?: string;
  fechaNacimiento?: string;
  peso?: number | null;
  altura?: number | null;
  objetivo?: string;
  objetivoDetalle?: string;
  nivelActividad?: string;
  /** Los cinco campos de lista llegan como texto, uno por línea. */
  patologias?: string;
  alergias?: string;
  intolerancias?: string;
  medicamentos?: string;
  suplementos?: string;
  preferencias?: string;
  notas?: string;
}

const SEXOS = ["MASCULINO", "FEMENINO", "OTRO"];
const OBJETIVOS = ["PERDER_PESO", "GANAR_MASA", "MANTENIMIENTO", "PATOLOGIA", "DEPORTIVO", "OTRO"];

function datosDelCaso(data: CasoFormData) {
  return {
    nombre: sanitizeString(data.nombre, 150),
    consigna: sanitizeStringOptional(data.consigna, 4000) || null,
    pacienteNombre: sanitizeString(data.pacienteNombre, 100),
    pacienteApellidos: sanitizeStringOptional(data.pacienteApellidos, 100) ?? "",
    sexo: (data.sexo && SEXOS.includes(data.sexo) ? data.sexo : null) as Sexo | null,
    fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
    peso: validateNumberOptional(data.peso, 0, 500),
    altura: validateNumberOptional(data.altura, 0, 300),
    objetivo: (data.objetivo && OBJETIVOS.includes(data.objetivo)
      ? data.objetivo
      : "MANTENIMIENTO") as ObjetivoPaciente,
    objetivoDetalle: sanitizeStringOptional(data.objetivoDetalle, 500) || null,
    nivelActividad: sanitizeStringOptional(data.nivelActividad, 120) || null,
    patologias: porLineas(data.patologias),
    alergias: porLineas(data.alergias),
    intolerancias: porLineas(data.intolerancias),
    medicamentos: porLineas(data.medicamentos),
    suplementos: porLineas(data.suplementos),
    preferencias: porLineas(data.preferencias),
    notas: sanitizeStringOptional(data.notas, LIMITS.NOTAS ?? 5000) || null,
  };
}

export interface CasoResumen {
  id: string;
  nombre: string;
  pacienteNombre: string;
  consigna: string | null;
  archivado: boolean;
  /** A cuántas clases está puesto ahora mismo. */
  clases: number;
  /** Cuántos alumnos lo han entregado ya. */
  entregadas: number;
  /** Cuántos lo tienen pendiente. */
  pendientes: number;
}

export async function getMisCasos(incluirArchivados = false): Promise<CasoResumen[]> {
  const profesor = await requireProfesor();

  const casos = await prisma.casoClinico.findMany({
    where: {
      profesorId: profesor.dietistaId,
      ...(incluirArchivados ? {} : { archivado: false }),
    },
    orderBy: [{ archivado: "asc" }, { createdAt: "desc" }],
    include: {
      asignaciones: {
        where: { retiradaAt: null },
        select: { id: true, entregas: { select: { estado: true } } },
      },
    },
  });

  return casos.map((c) => {
    const entregas = c.asignaciones.flatMap((a) => a.entregas);
    return {
      id: c.id,
      nombre: c.nombre,
      pacienteNombre: c.pacienteNombre,
      consigna: c.consigna,
      archivado: c.archivado,
      clases: c.asignaciones.length,
      entregadas: entregas.filter((e) => e.estado === "ENTREGADA" || e.estado === "CORREGIDA").length,
      pendientes: entregas.filter((e) => e.estado === "SIN_EMPEZAR" || e.estado === "EN_MARCHA").length,
    };
  });
}

export async function crearCaso(
  data: CasoFormData,
): Promise<{ ok: boolean; error?: string; casoId?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const campos = datosDelCaso(data);
  if (!campos.nombre) return { ok: false, error: t("docencia.nombreCasoObligatorio") };
  if (!campos.pacienteNombre) return { ok: false, error: t("docencia.nombrePacienteObligatorio") };

  try {
    const caso = await prisma.casoClinico.create({
      data: {
        ...campos,
        profesorId: profesor.dietistaId,
        licenciaDocenteId: profesor.licencia?.id ?? null,
      },
    });
    revalidarCasos();
    return { ok: true, casoId: caso.id };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error creando caso:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

export async function editarCaso(
  casoId: string,
  data: CasoFormData,
): Promise<{ ok: boolean; error?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const suyo = await prisma.casoClinico.findFirst({
    where: { id: casoId, profesorId: profesor.dietistaId },
    select: { id: true },
  });
  if (!suyo) return { ok: false, error: t("docencia.casoNoEncontrado") };

  const campos = datosDelCaso(data);
  if (!campos.nombre) return { ok: false, error: t("docencia.nombreCasoObligatorio") };
  if (!campos.pacienteNombre) return { ok: false, error: t("docencia.nombrePacienteObligatorio") };

  try {
    // Editar el caso NO toca los pacientes que ya se crearon de él: el alumno que lo tiene a
    // medias no puede ver cómo le cambian los datos por debajo mientras trabaja.
    await prisma.casoClinico.update({ where: { id: casoId }, data: campos });
    revalidarCasos(casoId);
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error editando caso:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
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

/** Duplicar: el mismo caso para el curso siguiente, o una variante. */
export async function duplicarCaso(
  casoId: string,
): Promise<{ ok: boolean; error?: string; casoId?: string }> {
  const profesor = await requireProfesor();
  const t = await getTranslations("validation");

  const original = await prisma.casoClinico.findFirst({
    where: { id: casoId, profesorId: profesor.dietistaId },
  });
  if (!original) return { ok: false, error: t("docencia.casoNoEncontrado") };

  try {
    const { id: _id, createdAt: _c, updatedAt: _u, fichaInformacion, ...campos } = original;
    void _id; void _c; void _u;
    const copia = await prisma.casoClinico.create({
      data: {
        ...campos,
        // El JSON opcional necesita `undefined` en vez de `null` para que Prisma lo deje vacío.
        ...(fichaInformacion === null ? {} : { fichaInformacion }),
        nombre: sanitizeString(`${original.nombre} (copia)`, 150),
        archivado: false,
      },
    });
    revalidarCasos();
    return { ok: true, casoId: copia.id };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error duplicando caso:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

export interface CasoDetalle extends CasoResumen {
  pacienteApellidos: string;
  sexo: string | null;
  fechaNacimiento: Date | null;
  peso: number | null;
  altura: number | null;
  objetivo: string;
  objetivoDetalle: string | null;
  nivelActividad: string | null;
  patologias: string[];
  alergias: string[];
  intolerancias: string[];
  medicamentos: string[];
  suplementos: string[];
  preferencias: string[];
  notas: string | null;
}

export async function getCaso(casoId: string): Promise<CasoDetalle | null> {
  const profesor = await requireProfesor();
  const c = await prisma.casoClinico.findFirst({
    where: { id: casoId, profesorId: profesor.dietistaId },
    include: {
      asignaciones: {
        where: { retiradaAt: null },
        select: { id: true, entregas: { select: { estado: true } } },
      },
    },
  });
  if (!c) return null;

  const entregas = c.asignaciones.flatMap((a) => a.entregas);
  return {
    id: c.id,
    nombre: c.nombre,
    consigna: c.consigna,
    archivado: c.archivado,
    pacienteNombre: c.pacienteNombre,
    pacienteApellidos: c.pacienteApellidos,
    sexo: c.sexo,
    fechaNacimiento: c.fechaNacimiento,
    peso: c.peso,
    altura: c.altura,
    objetivo: c.objetivo,
    objetivoDetalle: c.objetivoDetalle,
    nivelActividad: c.nivelActividad,
    patologias: c.patologias,
    alergias: c.alergias,
    intolerancias: c.intolerancias,
    medicamentos: c.medicamentos,
    suplementos: c.suplementos,
    preferencias: c.preferencias,
    notas: c.notas,
    clases: c.asignaciones.length,
    entregadas: entregas.filter((e) => e.estado === "ENTREGADA" || e.estado === "CORREGIDA").length,
    pendientes: entregas.filter((e) => e.estado === "SIN_EMPEZAR" || e.estado === "EN_MARCHA").length,
  };
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
      entregas: { select: { estado: true } },
    },
  });

  return asignaciones.map((a) => ({
    id: a.id,
    claseId: a.clase.id,
    claseNombre: a.clase.nombre,
    fechaLimite: a.fechaLimite,
    alumnos: a.clase._count.alumnos,
    entregadas: a.entregas.filter((e) => e.estado === "ENTREGADA").length,
    corregidas: a.entregas.filter((e) => e.estado === "CORREGIDA").length,
  }));
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

  const caso = await prisma.casoClinico.findFirst({
    where: { id: casoId, profesorId: profesor.dietistaId, archivado: false },
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
      // Si estaba retirada, volver a asignarla la revive con la fecha nueva y sus entregas.
      update: { fechaLimite: limite, retiradaAt: null, asignadoPor: profesor.dietistaId },
    });
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
          comentario: true, visibleParaAlumno: true,
          paciente: { select: { _count: { select: { planes: true } } } },
        },
      },
    },
  });
  if (!asignacion) return [];

  const porAlumno = new Map(asignacion.entregas.map((e) => [e.alumnoId, e]));
  // Se listan TODOS los alumnos de la clase, no solo los que han empezado: al profesor lo que le
  // interesa ver de un vistazo es quién no ha tocado el caso todavía.
  return asignacion.clase.alumnos.map(({ alumno }) => {
    const e = porAlumno.get(alumno.id);
    return {
      id: e?.id ?? "",
      alumnoId: alumno.id,
      alumnoNombre: `${alumno.nombre} ${alumno.apellidos}`.trim(),
      alumnoEmail: alumno.email,
      estado: (e?.estado ?? "SIN_EMPEZAR") as EntregaResumen["estado"],
      entregadaAt: e?.entregadaAt ?? null,
      tarde:
        e?.entregadaAt != null &&
        asignacion.fechaLimite != null &&
        e.entregadaAt.getTime() > asignacion.fechaLimite.getTime(),
      nota: e?.nota ?? null,
      comentario: e?.comentario ?? null,
      visibleParaAlumno: e?.visibleParaAlumno ?? false,
      planes: e?.paciente?._count.planes ?? 0,
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
    select: { id: true, asignacion: { select: { casoId: true } } },
  });
  if (!entrega) return { ok: false, error: t("docencia.entregaNoEncontrada") };

  const nota = data.nota === null || data.nota === undefined ? null : Number(data.nota);
  if (nota !== null && (!Number.isFinite(nota) || nota < 0 || nota > 10)) {
    return { ok: false, error: t("docencia.notaFueraDeRango") };
  }

  try {
    await prisma.entregaCaso.update({
      where: { id: entregaId },
      data: {
        nota,
        comentario: sanitizeStringOptional(data.comentario, 4000) || null,
        visibleParaAlumno: data.visibleParaAlumno,
        estado: "CORREGIDA",
        corregidaAt: new Date(),
        corregidaPor: profesor.dietistaId,
      },
    });
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
  });
  revalidarCasos(entrega.asignacion.casoId);
  revalidatePath("/aula");
  return { ok: true };
}
