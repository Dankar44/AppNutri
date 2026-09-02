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
import { PLAN_COMPLETO, aDetalleVisual } from "@/lib/plan-para-ver";
import { expandirGruposDeDias } from "@/lib/grupos-dias";
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
    select: {
      id: true, nombre: true, pacienteNombre: true, consigna: true, archivado: true,
      asignaciones: {
        where: { retiradaAt: null },
        select: {
          id: true,
          // Los alumnos de la clase se cuentan aquí: son el total contra el que se mide lo
          // entregado. Traerse las entregas una a una para contarlas en JavaScript eran 30.000
          // filas con veinte casos y clases de 300 (auditoría 2 sep 2026).
          clase: { select: { _count: { select: { alumnos: { where: { activa: true } } } } } },
          _count: { select: { entregas: { where: { estado: { in: ["ENTREGADA", "CORREGIDA"] } } } } },
        },
      },
    },
  });

  return casos.map((c) => {
    const alumnos = c.asignaciones.reduce((n, a) => n + a.clase._count.alumnos, 0);
    const entregadas = c.asignaciones.reduce((n, a) => n + a._count.entregas, 0);
    return {
      id: c.id,
      nombre: c.nombre,
      pacienteNombre: c.pacienteNombre,
      consigna: c.consigna,
      archivado: c.archivado,
      clases: c.asignaciones.length,
      entregadas,
      // Pendiente es todo el que no ha entregado, haya abierto el caso o no. Contar solo a los
      // que lo habían abierto decía "0 pendientes" con la clase entera sin empezar.
      pendientes: Math.max(0, alumnos - entregadas),
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
        select: {
          id: true,
          clase: { select: { _count: { select: { alumnos: { where: { activa: true } } } } } },
          _count: { select: { entregas: { where: { estado: { in: ["ENTREGADA", "CORREGIDA"] } } } } },
        },
      },
    },
  });
  if (!c) return null;

  const alumnosTotales = c.asignaciones.reduce((n, a) => n + a.clase._count.alumnos, 0);
  const yaEntregadas = c.asignaciones.reduce((n, a) => n + a._count.entregas, 0);
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
    entregadas: yaEntregadas,
    pendientes: Math.max(0, alumnosTotales - yaEntregadas),
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
          comentario: true, visibleParaAlumno: true,
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
  estado: string;
  entregadaAt: Date | null;
  nota: number | null;
  comentario: string | null;
  visibleParaAlumno: boolean;
  /** El paciente que se creó del caso, tal y como lo ha dejado el alumno. */
  paciente: {
    id: string;
    nombre: string;
    apellidos: string;
    peso: number | null;
    altura: number | null;
    objetivo: string;
    notas: string | null;
    patologias: string[];
    alergias: string[];
  } | null;
  planes: { id: string; nombre: string; activo: boolean; dias: number }[];
  /** El plan que se está mirando, listo para pintar. */
  planVisto: PlanVisualDetalle | null;
}

/**
 * Lo que ha hecho el alumno con el caso, para que el profesor lo mire.
 *
 * Es de SOLO LECTURA: el profesor ve el paciente y los planes del alumno, pero no puede tocarlos.
 * Ni siquiera puede llegar a ellos por las pantallas normales, porque son de la cuenta del alumno.
 */
export async function getTrabajoDeEntrega(
  entregaId: string,
  planId?: string,
): Promise<TrabajoDeEntrega | null> {
  const profesor = await requireProfesor();

  const entrega = await prisma.entregaCaso.findFirst({
    where: { id: entregaId, asignacion: { caso: { profesorId: profesor.dietistaId } } },
    include: {
      alumno: { select: { nombre: true, apellidos: true } },
      asignacion: {
        select: { caso: { select: { nombre: true } }, clase: { select: { nombre: true } } },
      },
      paciente: {
        select: {
          id: true, nombre: true, apellidos: true, peso: true, altura: true,
          objetivo: true, notas: true, patologias: true, alergias: true,
          planes: {
            orderBy: { createdAt: "desc" },
            select: { id: true, nombre: true, activo: true, _count: { select: { dias: true } } },
          },
        },
      },
    },
  });
  if (!entrega) return null;

  const planes = entrega.paciente?.planes ?? [];
  const elegido = planId ? planes.find((p) => p.id === planId) : planes[0];

  let planVisto: PlanVisualDetalle | null = null;
  if (elegido) {
    const plan = await prisma.planAlimenticio.findUnique({
      where: { id: elegido.id },
      include: PLAN_COMPLETO,
    });
    if (plan) {
      // #75 — los días agrupados enseñan el menú de su día representante, como en el enlace público.
      const dias = await expandirGruposDeDias(plan.id, plan.dias);
      planVisto = aDetalleVisual(plan, dias);
    }
  }

  return {
    entregaId: entrega.id,
    alumnoNombre: `${entrega.alumno.nombre} ${entrega.alumno.apellidos}`.trim(),
    casoNombre: entrega.asignacion.caso.nombre,
    claseNombre: entrega.asignacion.clase.nombre,
    estado: entrega.estado,
    entregadaAt: entrega.entregadaAt,
    nota: entrega.nota,
    comentario: entrega.comentario,
    visibleParaAlumno: entrega.visibleParaAlumno,
    paciente: entrega.paciente
      ? {
          id: entrega.paciente.id,
          nombre: entrega.paciente.nombre,
          apellidos: entrega.paciente.apellidos,
          peso: entrega.paciente.peso,
          altura: entrega.paciente.altura,
          objetivo: entrega.paciente.objetivo,
          notas: entrega.paciente.notas,
          patologias: entrega.paciente.patologias,
          alergias: entrega.paciente.alergias,
        }
      : null,
    planes: planes.map((p) => ({ id: p.id, nombre: p.nombre, activo: p.activo, dias: p._count.dias })),
    planVisto,
  };
}
