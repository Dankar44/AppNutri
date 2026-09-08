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
import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isNextNavigation } from "@/lib/utils";
import { sanitizeStringOptional } from "@/lib/validation";
import { getCurrentDietista } from "./auth";
import { inicioDeHoy } from "@/lib/docencia";
import { copiarPaciente } from "@/lib/copiar-paciente";
import { congelarTrabajo } from "@/lib/entrega-congelada";
import { generarPdfDelPlan } from "@/lib/pdf-del-plan";
import type { PDFSectionOptions, DisplayOverrides } from "@/lib/pdf/generate-plan-pdf";

export interface ClaseDelAlumno {
  id: string;
  nombre: string;
  fechaInicioCurso: Date | null;
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
          id: true, nombre: true, fechaInicioCurso: true, fechaFinCurso: true, archivada: true,
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
      fechaInicioCurso: c.fechaInicioCurso,
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
  /** Los planes de su paciente, para elegir cuál va como entregable en PDF. */
  planes: { id: string; nombre: string; activo: boolean }[];
  /** El PDF que entregó, si lo hizo. */
  entregableNombre: string | null;
  /** Hay entregable que descargar. El PDF no se guarda: se genera al pedirlo. */
  entregableGuardado: boolean;
  entregablePlanNombre: string | null;
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
      // Un caso archivado deja de estar en circulación: ni se ve ni se abre.
      caso: { archivado: false },
      clase: {
        archivada: false,
        OR: [{ fechaFinCurso: null }, { fechaFinCurso: { gte: hoy } }],
        alumnos: { some: { alumnoId: dietista.id, activa: true } },
      },
    },
    orderBy: [{ fechaLimite: "asc" }, { createdAt: "desc" }],
    include: {
      caso: { select: { nombre: true, consigna: true, paciente: { select: { nombre: true, apellidos: true } } } },
      clase: { select: { id: true, nombre: true } },
      // Con `select`: la fila lleva el PDF entregado (bytea) y no hay que traérselo para listar.
      entregas: {
        where: { alumnoId: dietista.id },
        select: {
          id: true, estado: true, pacienteId: true, entregadaAt: true, nota: true, comentario: true,
          visibleParaAlumno: true, entregableNombre: true, entregablePlanId: true,
          paciente: { select: { planes: { orderBy: [{ activo: "desc" }, { createdAt: "desc" }], select: { id: true, nombre: true, activo: true } } } },
        },
      },
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
      pacienteDelCaso: a.caso.paciente ? `${a.caso.paciente.nombre} ${a.caso.paciente.apellidos}`.trim() : "",
      claseId: a.clase.id,
      claseNombre: a.clase.nombre,
      fechaLimite: a.fechaLimite,
      estado: (entrega?.estado ?? "SIN_EMPEZAR") as CasoDelAlumno["estado"],
      pacienteId: entrega?.pacienteId ?? null,
      entregadaAt: entrega?.entregadaAt ?? null,
      // La nota no se enseña hasta que el profesor lo decide.
      nota: visible ? entrega?.nota ?? null : null,
      comentario: visible ? entrega?.comentario ?? null : null,
      planes: entrega?.paciente?.planes ?? [],
      entregableNombre: entrega?.entregableNombre ?? null,
      entregableGuardado: entrega?.entregablePlanId != null,
      entregablePlanNombre: entrega?.paciente?.planes.find((p) => p.id === entrega.entregablePlanId)?.nombre ?? null,
    };
  });
}

/**
 * ¿Ese caso sigue siendo suyo? Clase viva, matrícula activa, asignación puesta y caso sin
 * archivar. Lo comparten abrir, entregar y deshacer: las tres tienen que exigir lo mismo.
 */
async function asignacionVigenteDelAlumno(asignacionId: string, alumnoId: string): Promise<boolean> {
  const hoy = inicioDeHoy();
  const asignacion = await prisma.asignacionCaso.findFirst({
    where: {
      id: asignacionId,
      retiradaAt: null,
      caso: { archivado: false },
      clase: {
        archivada: false,
        OR: [{ fechaFinCurso: null }, { fechaFinCurso: { gte: hoy } }],
        alumnos: { some: { alumnoId, activa: true } },
      },
    },
    select: { id: true },
  });
  return asignacion !== null;
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
      caso: { archivado: false },
      clase: {
        archivada: false,
        OR: [{ fechaFinCurso: null }, { fechaFinCurso: { gte: hoy } }],
        alumnos: { some: { alumnoId: dietista.id, activa: true } },
      },
    },
    include: { caso: { select: { pacienteId: true, compartirPlanes: true } } },
  });
  if (!asignacion) return { ok: false, error: t("docencia.casoNoEncontrado") };
  if (!asignacion.caso.pacienteId) return { ok: false, error: t("docencia.casoSinPaciente") };

  try {
    const existente = await prisma.entregaCaso.findUnique({
      where: { asignacionId_alumnoId: { asignacionId, alumnoId: dietista.id } },
      select: { id: true, pacienteId: true, estado: true },
    });
    if (existente?.pacienteId) return { ok: true, pacienteId: existente.pacienteId };

    const plantillaId = asignacion.caso.pacienteId;
    // Todo en una transacción, y **la entrega primero**: es la que tiene la clave única
    // (asignación + alumno), así que si el alumno pulsa dos veces o abre dos pestañas, la segunda
    // choca ahí y no llega a crear un segundo paciente. Al revés — paciente primero — se creaban
    // dos y solo uno quedaba enganchado al caso (auditoría 2 sep 2026).
    const pacienteId = await prisma.$transaction(async (tx) => {
      const entrega = await tx.entregaCaso.upsert({
        where: { asignacionId_alumnoId: { asignacionId, alumnoId: dietista.id } },
        create: {
          asignacionId,
          alumnoId: dietista.id,
          estado: "EN_MARCHA",
          abiertaAt: new Date(),
        },
        // NO se toca el estado: una entrega ya corregida no puede volver a "en marcha" por
        // abrirla, que era la forma de deshacer una corrección por la puerta de atrás.
        update: {},
        select: { id: true, pacienteId: true },
      });
      if (entrega.pacienteId) return entrega.pacienteId;

      // La copia entera del paciente que rellenó el profesor: datos, anamnesis, mediciones,
      // consultas, horario y recomendaciones. La planificación y el plan, solo si el profesor ha
      // decidido dárselos hechos; si no, son su solución y se quedan con él.
      const nuevoId = await copiarPaciente(tx, plantillaId, {
        dietistaId: dietista.id, esDeClase: true, conPlanes: asignacion.caso.compartirPlanes,
      });

      await tx.entregaCaso.update({
        where: { id: entrega.id },
        data: {
          pacienteId: nuevoId,
          // Solo se pone "en marcha" a quien todavía no había entregado.
          ...(existente && existente.estado !== "SIN_EMPEZAR" ? {} : { estado: "EN_MARCHA" }),
          abiertaAt: new Date(),
        },
      });
      return nuevoId;
    }, { timeout: 20_000, maxWait: 10_000 });

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
export interface OpcionesEntrega {
  /** Lo que le quiere contar al profesor: su razonamiento, en corto. Opcional. */
  notaAlumno?: string;
  /**
   * El entregable en PDF: qué plan y con qué secciones (las de la pestaña Entregables, o las de
   * siempre). Sin esto, la entrega va sin PDF — para casos que no piden dieta.
   */
  entregable?: { planId: string; sections?: PDFSectionOptions; displayOverrides?: DisplayOverrides } | null;
}

/**
 * Entregar el caso: una FOTO FIJA del trabajo más el PDF del entregable (Guillermo, 2 sep 2026).
 * Se puede volver a entregar mientras el profesor no lo haya corregido: sustituye la foto.
 */
export async function entregarCaso(
  asignacionId: string,
  opciones: OpcionesEntrega = {},
): Promise<{ ok: boolean; error?: string }> {
  const dietista = await getCurrentDietista();
  const t = await getTranslations("validation");
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };

  // Las mismas comprobaciones que al abrirlo: sin esto, un alumno al que le retiraron el acceso
  // o cuyo curso cerró seguía pudiendo entregar con el id que tenía guardado.
  if (!(await asignacionVigenteDelAlumno(asignacionId, dietista.id))) {
    return { ok: false, error: t("docencia.casoNoEncontrado") };
  }

  const entrega = await prisma.entregaCaso.findUnique({
    where: { asignacionId_alumnoId: { asignacionId, alumnoId: dietista.id } },
    select: { id: true, estado: true, pacienteId: true },
  });
  if (!entrega || !entrega.pacienteId) return { ok: false, error: t("docencia.abreloAntes") };
  if (entrega.estado === "CORREGIDA") return { ok: false, error: t("docencia.yaCorregida") };

  // El PDF, del plan de ESTE paciente y de este alumno. Si falla el navegador, no se entrega a
  // medias: se le dice y puede volver a intentarlo o entregar sin PDF.
    let entregable: { planId: string; nombre: string; sections?: PDFSectionOptions; displayOverrides?: DisplayOverrides } | null = null;
  if (opciones.entregable) {
    const plan = await prisma.planAlimenticio.findFirst({
      where: { id: opciones.entregable.planId, pacienteId: entrega.pacienteId, dietistaId: dietista.id },
      select: { id: true, paciente: { select: { nombre: true, apellidos: true } } },
    });
    if (!plan) return { ok: false, error: t("docencia.planNoDelCaso") };
    // El PDF no se genera ni se guarda aquí: se hace cuando alguien lo pide (`generarPdfDeEntrega`).
    // Sale idéntico porque entregar cierra el caso y el alumno ya no puede tocar el plan. Lo que sí
    // se guarda es CUÁL es el entregable y con qué secciones lo quiso (7 sep 2026).
    const nombrePaciente = `${plan.paciente.nombre} ${plan.paciente.apellidos}`.trim().replace(/\s+/g, "-");
    entregable = {
      planId: plan.id,
      nombre: `Plan-${nombrePaciente}.pdf`,
      sections: opciones.entregable.sections,
      displayOverrides: opciones.entregable.displayOverrides,
    };
  }

  const congelado = await congelarTrabajo(entrega.pacienteId);
  if (!congelado) return { ok: false, error: t("docencia.abreloAntes") };

  await prisma.entregaCaso.update({
    where: { id: entrega.id },
    data: {
      estado: "ENTREGADA",
      entregadaAt: new Date(),
      notaAlumno: sanitizeStringOptional(opciones.notaAlumno, 4000) || null,
      // Con el entregable van sus opciones de presentación, para poder rehacerlo igual.
      entregaSnapshot: { ...congelado, entregable: entregable ?? null } as unknown as Prisma.InputJsonValue,
      entregablePlanId: entregable?.planId ?? null,
      entregableNombre: entregable?.nombre ?? null,
      entregableBytes: null,
      entregablePdf: null,
    },
    select: { id: true },
  });
  revalidatePath("/aula");
  return { ok: true };
}


/*
 * Ya no hay «deshacer la entrega» del alumno: entregar cierra el caso y solo el profesor lo
 * reabre (`reabrirEntrega`, en casos.ts). Se quitó la acción entera y no solo el botón porque cada
 * export de un fichero "use server" es un endpoint: dejándola, el bloqueo se saltaba desde el
 * navegador (Guillermo, 7 sep 2026).
 */

export interface CasoDeEstePaciente {
  asignacionId: string;
  entregaId: string;
  casoNombre: string;
  consigna: string | null;
  claseNombre: string;
  fechaLimite: Date | null;
  estado: "SIN_EMPEZAR" | "EN_MARCHA" | "ENTREGADA" | "CORREGIDA";
  nota: number | null;
  comentario: string | null;
  entregadaAt: Date | null;
  /** El PDF que entregó, si lo hizo, y de qué plan. */
  entregableNombre: string | null;
  entregablePlanNombre: string | null;
  /** Hay entregable que descargar. El PDF no se guarda: se genera al pedirlo. */
  entregableGuardado: boolean;
  /** Sus planes, para elegir cuál va de entregable. */
  planes: { id: string; nombre: string; activo: boolean }[];
}

/**
 * ¿Este paciente viene de un caso de clase? Sirve para que, mientras el alumno trabaja en la
 * ficha, tenga delante lo que le han pedido, hasta cuándo, y el botón de entregar — que si no
 * están solo en el aula y hay que ir a buscarlos.
 */
export async function getCasoDelPaciente(pacienteId: string): Promise<CasoDeEstePaciente | null> {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const entrega = await prisma.entregaCaso.findFirst({
    where: { pacienteId, alumnoId: dietista.id },
    select: {
      id: true, estado: true, nota: true, comentario: true, visibleParaAlumno: true, entregadaAt: true,
      entregableNombre: true, entregablePlanId: true,
      asignacion: {
        select: {
          id: true, fechaLimite: true,
          caso: { select: { nombre: true, consigna: true } },
          clase: { select: { nombre: true } },
        },
      },
      paciente: { select: { planes: { orderBy: [{ activo: "desc" }, { createdAt: "desc" }], select: { id: true, nombre: true, activo: true } } } },
    },
  });
  if (!entrega) return null;

  const visible = entrega.visibleParaAlumno;
  const planes = entrega.paciente?.planes ?? [];
  return {
    asignacionId: entrega.asignacion.id,
    entregaId: entrega.id,
    casoNombre: entrega.asignacion.caso.nombre,
    consigna: entrega.asignacion.caso.consigna,
    claseNombre: entrega.asignacion.clase.nombre,
    fechaLimite: entrega.asignacion.fechaLimite,
    estado: entrega.estado as CasoDeEstePaciente["estado"],
    nota: visible ? entrega.nota : null,
    comentario: visible ? entrega.comentario : null,
    entregadaAt: entrega.entregadaAt,
    entregableNombre: entrega.entregableNombre,
    entregablePlanNombre: planes.find((p) => p.id === entrega.entregablePlanId)?.nombre ?? null,
    entregableGuardado: entrega.entregablePlanId != null,
    planes,
  };
}
