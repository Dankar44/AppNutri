"use server";

/**
 * #39 — El aula: lo que ve el alumno de sus clases.
 *
 * El alumno tiene los mismos dos espacios que el profesor (Guillermo, 1 sep 2026): su aula, con
 * las clases en las que está, y su cuenta profesional, con sus propios pacientes — porque durante
 * la carrera muchos ya empiezan a ver gente de verdad. Se pasa de uno a otro por el menú, con
 * enlaces normales, sin nada que recordar.
 *
 * Los casos y las entregas viven aquí cuando lleguen (fase 3).
 */

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isNextNavigation } from "@/lib/utils";
import { getCurrentDietista } from "./auth";
import { inicioDeHoy } from "@/lib/docencia";

export interface ClaseDelAlumno {
  id: string;
  nombre: string;
  curso: string | null;
  fechaFinCurso: Date | null;
  institucion: string | null;
  /** Todos los que la llevan, empezando por quien la creó. */
  profesores: { nombre: string; email: string }[];
  /** Le retiraron el acceso a esta clase, pero sigue en la lista de su historial. */
  activa: boolean;
}

/** Las clases del alumno: primero las que están en marcha. */
export async function getMisClasesComoAlumno(): Promise<ClaseDelAlumno[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const hoy = inicioDeHoy();
  const matriculas = await prisma.alumnoClase.findMany({
    where: { alumnoId: dietista.id },
    orderBy: [{ activa: "desc" }, { altaAt: "desc" }],
    select: {
      activa: true,
      clase: {
        select: {
          id: true, nombre: true, curso: true, fechaFinCurso: true, archivada: true,
          profesor: { select: { nombre: true, apellidos: true, email: true } },
          profesores: {
            orderBy: { createdAt: "asc" },
            select: { profesor: { select: { nombre: true, apellidos: true, email: true } } },
          },
          licenciaDocente: { select: { institucion: true } },
        },
      },
    },
  });

  return matriculas.map((m) => {
    const c = m.clase;
    // Si la lista de profesores está vacía (clases anteriores a que existiera), al menos el creador.
    const profesores = c.profesores.length > 0
      ? c.profesores.map((p) => p.profesor)
      : [c.profesor];
    const enMarcha =
      m.activa &&
      !c.archivada &&
      (c.fechaFinCurso === null || c.fechaFinCurso.getTime() >= hoy.getTime());
    return {
      id: c.id,
      nombre: c.nombre,
      curso: c.curso,
      fechaFinCurso: c.fechaFinCurso,
      institucion: c.licenciaDocente?.institucion ?? null,
      profesores: profesores.map((p) => ({
        nombre: `${p.nombre} ${p.apellidos}`.trim(),
        email: p.email,
      })),
      activa: enMarcha,
    };
  });
}

// ─── Los casos del alumno ───

export interface CasoDelAlumno {
  asignacionId: string;
  entregaId: string | null;
  casoNombre: string;
  consigna: string | null;
  pacienteDelCaso: string;
  claseId: string;
  claseNombre: string;
  fechaLimite: Date | null;
  estado: "SIN_EMPEZAR" | "EN_MARCHA" | "ENTREGADA" | "CORREGIDA";
  /** El paciente que se le creó al abrirlo, para entrar directo a su ficha. */
  pacienteId: string | null;
  entregadaAt: Date | null;
  /** Nota y comentario, solo si el profesor los ha hecho visibles. */
  nota: number | null;
  comentario: string | null;
}

/**
 * Los casos que tiene el alumno: los de sus clases vivas, con su estado.
 *
 * La entrega puede no existir todavía (nadie la crea al asignar el caso), así que aquí se
 * combinan las asignaciones con lo que el alumno tenga hecho.
 */
export async function getMisCasosDelAula(): Promise<CasoDelAlumno[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const hoy = inicioDeHoy();
  const asignaciones = await prisma.asignacionCaso.findMany({
    where: {
      retiradaAt: null,
      clase: {
        archivada: false,
        OR: [{ fechaFinCurso: null }, { fechaFinCurso: { gte: hoy } }],
        alumnos: { some: { alumnoId: dietista.id, activa: true } },
      },
    },
    orderBy: [{ fechaLimite: "asc" }, { createdAt: "desc" }],
    include: {
      caso: { select: { nombre: true, consigna: true, pacienteNombre: true, pacienteApellidos: true } },
      clase: { select: { id: true, nombre: true } },
      entregas: { where: { alumnoId: dietista.id } },
    },
  });

  return asignaciones.map((a) => {
    const entrega = a.entregas[0] ?? null;
    const visible = entrega?.visibleParaAlumno === true;
    return {
      asignacionId: a.id,
      entregaId: entrega?.id ?? null,
      casoNombre: a.caso.nombre,
      consigna: a.caso.consigna,
      pacienteDelCaso: `${a.caso.pacienteNombre} ${a.caso.pacienteApellidos}`.trim(),
      claseId: a.clase.id,
      claseNombre: a.clase.nombre,
      fechaLimite: a.fechaLimite,
      estado: (entrega?.estado ?? "SIN_EMPEZAR") as CasoDelAlumno["estado"],
      pacienteId: entrega?.pacienteId ?? null,
      entregadaAt: entrega?.entregadaAt ?? null,
      // La nota no se enseña hasta que el profesor lo decide.
      nota: visible ? entrega?.nota ?? null : null,
      comentario: visible ? entrega?.comentario ?? null : null,
    };
  });
}

/**
 * Abre el caso: la primera vez le crea SU paciente a partir de los datos que escribió el profesor.
 *
 * A partir de ahí es un paciente de su cuenta como cualquier otro — su ficha, su anamnesis, su
 * plan, su PDF — pero marcado como de clase para que no se confunda con la gente real que ya
 * empiece a ver, ni cuente en ningún sitio como paciente de verdad.
 */
export async function abrirCaso(
  asignacionId: string,
): Promise<{ ok: boolean; error?: string; pacienteId?: string }> {
  const dietista = await getCurrentDietista();
  const t = await getTranslations("validation");
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };

  const hoy = inicioDeHoy();
  const asignacion = await prisma.asignacionCaso.findFirst({
    where: {
      id: asignacionId,
      retiradaAt: null,
      clase: {
        archivada: false,
        OR: [{ fechaFinCurso: null }, { fechaFinCurso: { gte: hoy } }],
        alumnos: { some: { alumnoId: dietista.id, activa: true } },
      },
    },
    include: { caso: true },
  });
  if (!asignacion) return { ok: false, error: t("docencia.casoNoEncontrado") };

  try {
    const existente = await prisma.entregaCaso.findUnique({
      where: { asignacionId_alumnoId: { asignacionId, alumnoId: dietista.id } },
      select: { id: true, pacienteId: true, estado: true },
    });
    if (existente?.pacienteId) return { ok: true, pacienteId: existente.pacienteId };

    const c = asignacion.caso;
    // Todo en una transacción: un paciente creado sin su entrega sería un paciente huérfano en la
    // lista del alumno, y una entrega sin paciente le dejaría el caso sin poder abrirse.
    const pacienteId = await prisma.$transaction(async (tx) => {
      const paciente = await tx.paciente.create({
        data: {
          dietistaId: dietista.id,
          nombre: c.pacienteNombre,
          apellidos: c.pacienteApellidos,
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
          ...(c.fichaInformacion === null ? {} : { fichaInformacion: c.fichaInformacion }),
          esDeClase: true,
        },
      });
      await tx.entregaCaso.upsert({
        where: { asignacionId_alumnoId: { asignacionId, alumnoId: dietista.id } },
        create: {
          asignacionId,
          alumnoId: dietista.id,
          pacienteId: paciente.id,
          estado: "EN_MARCHA",
          abiertaAt: new Date(),
        },
        update: { pacienteId: paciente.id, estado: "EN_MARCHA", abiertaAt: new Date() },
      });
      return paciente.id;
    });

    revalidatePath("/aula");
    revalidatePath("/pacientes");
    return { ok: true, pacienteId };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error abriendo el caso:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/** Entregar el caso. Se puede entregar tarde: se guarda cuándo y el profesor lo ve. */
export async function entregarCaso(
  asignacionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const dietista = await getCurrentDietista();
  const t = await getTranslations("validation");
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };

  const entrega = await prisma.entregaCaso.findUnique({
    where: { asignacionId_alumnoId: { asignacionId, alumnoId: dietista.id } },
    select: { id: true, estado: true, pacienteId: true },
  });
  if (!entrega) return { ok: false, error: t("docencia.abreloAntes") };
  if (entrega.estado === "CORREGIDA") return { ok: false, error: t("docencia.yaCorregida") };

  await prisma.entregaCaso.update({
    where: { id: entrega.id },
    data: { estado: "ENTREGADA", entregadaAt: new Date() },
  });
  revalidatePath("/aula");
  return { ok: true };
}

/** Deshacer la entrega para seguir tocándolo, mientras el profesor no la haya corregido. */
export async function deshacerEntrega(
  asignacionId: string,
): Promise<{ ok: boolean; error?: string }> {
  const dietista = await getCurrentDietista();
  const t = await getTranslations("validation");
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };

  const entrega = await prisma.entregaCaso.findUnique({
    where: { asignacionId_alumnoId: { asignacionId, alumnoId: dietista.id } },
    select: { id: true, estado: true },
  });
  if (!entrega) return { ok: false, error: t("docencia.casoNoEncontrado") };
  if (entrega.estado === "CORREGIDA") return { ok: false, error: t("docencia.yaCorregida") };

  await prisma.entregaCaso.update({
    where: { id: entrega.id },
    data: { estado: "EN_MARCHA", entregadaAt: null },
  });
  revalidatePath("/aula");
  return { ok: true };
}
