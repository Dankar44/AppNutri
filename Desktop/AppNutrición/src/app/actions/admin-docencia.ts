"use server";

/**
 * #39 (issue #31) — Módulo docente, lado administrador.
 *
 * El rol de profesor SOLO se concede desde aquí, a propósito: no hay registro de profesor ni
 * forma de pedirlo desde la aplicación. Lo damos nosotros al cerrar con una universidad,
 * diciendo cuántos profesores y cuántos alumnos entran en el trato.
 */

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { isNextNavigation } from "@/lib/utils";
import { sanitizeString, sanitizeStringOptional } from "@/lib/validation";
import { crearCuentaNutricionista } from "./admin";

export interface LicenciaDocenteItem {
  id: string;
  institucion: string;
  dominioEmail: string | null;
  maxProfesores: number;
  maxAlumnos: number;
  curso: string | null;
  fechaInicio: Date;
  fechaFin: Date | null;
  activa: boolean;
  profesores: number;
  alumnos: number;
}

export interface LicenciaDocenteDetalle extends LicenciaDocenteItem {
  notas: string | null;
  createdAt: Date;
  miembros: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
    rolDocente: "PROFESOR" | "ALUMNO" | null;
    createdAt: Date;
    lastAccessAt: Date | null;
  }[];
}

/**
 * Normaliza la lista de dominios: "@UA.es, https://alu.ua.es/ " → "ua.es,alu.ua.es".
 * Admite varios porque profesor y alumno suelen tener dominios distintos en la misma
 * universidad (urjc.es / alumnos.urjc.es). Quita repetidos y trozos vacíos.
 */
function normalizarDominio(valor?: string | null): string | null {
  const limpio = sanitizeStringOptional(valor, 200)?.toLowerCase();
  if (!limpio) return null;
  const dominios = limpio
    .split(",")
    .map((d) =>
      d
        .trim()
        .replace(/^@/, "")
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, ""),
    )
    .filter(Boolean);
  return dominios.length > 0 ? [...new Set(dominios)].join(",") : null;
}

function revalidarDocencia() {
  revalidatePath("/admin/universidades");
  revalidatePath("/admin/dietistas");
  revalidatePath("/admin");
}

/**
 * Cuenta profesores y alumnos de una licencia. Se llama una vez por licencia en el listado
 * (N+1); con el puñado de licencias que va a haber es asumible, y a cambio el código queda
 * claro. Si algún día son cientos, agrupar con un solo `groupBy`.
 */
async function contarMiembros(licenciaId: string) {
  const [profesores, alumnos] = await Promise.all([
    prisma.dietista.count({ where: { licenciaDocenteId: licenciaId, rolDocente: "PROFESOR" } }),
    prisma.dietista.count({ where: { licenciaDocenteId: licenciaId, rolDocente: "ALUMNO" } }),
  ]);
  return { profesores, alumnos };
}

export async function getLicenciasDocentes(busqueda?: string): Promise<LicenciaDocenteItem[]> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const search = busqueda?.trim();

  const licencias = await prisma.licenciaDocente.findMany({
    where: search
      ? {
          OR: [
            { institucion: { contains: search, mode: "insensitive" } },
            { dominioEmail: { contains: search, mode: "insensitive" } },
            { curso: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    licencias.map(async (l) => ({
      id: l.id,
      institucion: l.institucion,
      dominioEmail: l.dominioEmail,
      maxProfesores: l.maxProfesores,
      maxAlumnos: l.maxAlumnos,
      curso: l.curso,
      fechaInicio: l.fechaInicio,
      fechaFin: l.fechaFin,
      activa: l.activa,
      ...(await contarMiembros(l.id)),
    })),
  );
}

export async function getLicenciaDocenteDetalle(licenciaId: string): Promise<LicenciaDocenteDetalle | null> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const licencia = await prisma.licenciaDocente.findUnique({
    where: { id: licenciaId },
    include: {
      miembros: {
        select: {
          id: true, nombre: true, apellidos: true, email: true,
          rolDocente: true, createdAt: true, lastAccessAt: true,
        },
        orderBy: [{ rolDocente: "asc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!licencia) return null;

  return {
    id: licencia.id,
    institucion: licencia.institucion,
    dominioEmail: licencia.dominioEmail,
    maxProfesores: licencia.maxProfesores,
    maxAlumnos: licencia.maxAlumnos,
    curso: licencia.curso,
    fechaInicio: licencia.fechaInicio,
    fechaFin: licencia.fechaFin,
    activa: licencia.activa,
    notas: licencia.notas,
    createdAt: licencia.createdAt,
    miembros: licencia.miembros,
    ...(await contarMiembros(licencia.id)),
  };
}

export async function crearLicenciaDocente(data: {
  institucion: string;
  dominioEmail?: string;
  maxProfesores: number;
  maxAlumnos: number;
  curso?: string;
  fechaFin?: string;
  notas?: string;
}): Promise<{ ok: boolean; error?: string; licenciaId?: string }> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("validation");

  const institucion = sanitizeString(data.institucion, 150);
  if (!institucion) return { ok: false, error: t("docencia.institucionObligatoria") };

  const maxProfesores = Math.trunc(Number(data.maxProfesores));
  const maxAlumnos = Math.trunc(Number(data.maxAlumnos));
  if (!Number.isFinite(maxProfesores) || maxProfesores < 1) {
    return { ok: false, error: t("docencia.minimoUnProfesor") };
  }
  if (!Number.isFinite(maxAlumnos) || maxAlumnos < 0) {
    return { ok: false, error: t("docencia.alumnosNoValido") };
  }

  try {
    const licencia = await prisma.licenciaDocente.create({
      data: {
        institucion,
        dominioEmail: normalizarDominio(data.dominioEmail),
        maxProfesores,
        maxAlumnos,
        curso: sanitizeStringOptional(data.curso, 20) || null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        notas: sanitizeStringOptional(data.notas, 1000) || null,
      },
    });
    revalidarDocencia();
    return { ok: true, licenciaId: licencia.id };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error creando licencia:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

export async function editarLicenciaDocente(
  licenciaId: string,
  data: {
    institucion: string;
    dominioEmail?: string;
    maxProfesores: number;
    maxAlumnos: number;
    curso?: string;
    fechaFin?: string;
    activa: boolean;
    notas?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("validation");

  const institucion = sanitizeString(data.institucion, 150);
  if (!institucion) return { ok: false, error: t("docencia.institucionObligatoria") };

  const maxProfesores = Math.trunc(Number(data.maxProfesores));
  const maxAlumnos = Math.trunc(Number(data.maxAlumnos));
  if (!Number.isFinite(maxProfesores) || maxProfesores < 1) {
    return { ok: false, error: t("docencia.minimoUnProfesor") };
  }
  if (!Number.isFinite(maxAlumnos) || maxAlumnos < 0) {
    return { ok: false, error: t("docencia.alumnosNoValido") };
  }

  // Bajar el cupo por debajo de lo ya repartido dejaría la licencia en un estado imposible de
  // leer ("4 de 3 profesores"), así que se rechaza y se dice cuántos hay dados de alta.
  const { profesores, alumnos } = await contarMiembros(licenciaId);
  if (maxProfesores < profesores) {
    return { ok: false, error: t("docencia.cupoProfesoresMenorQueAlta", { alta: profesores }) };
  }
  if (maxAlumnos < alumnos) {
    return { ok: false, error: t("docencia.cupoAlumnosMenorQueAlta", { alta: alumnos }) };
  }

  try {
    await prisma.licenciaDocente.update({
      where: { id: licenciaId },
      data: {
        institucion,
        dominioEmail: normalizarDominio(data.dominioEmail),
        maxProfesores,
        maxAlumnos,
        curso: sanitizeStringOptional(data.curso, 20) || null,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
        activa: data.activa,
        notas: sanitizeStringOptional(data.notas, 1000) || null,
      },
    });
    revalidarDocencia();
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error editando licencia:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

/** Nutricionistas sin rol docente, para elegir a quién se le da el de profesor. */
export async function buscarDietistasParaDocencia(busqueda: string) {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const search = busqueda.trim();
  if (!search) return [];

  return prisma.dietista.findMany({
    where: {
      rolDocente: null,
      OR: [
        { nombre: { contains: search, mode: "insensitive" } },
        { apellidos: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    },
    select: { id: true, nombre: true, apellidos: true, email: true },
    take: 10,
  });
}

/**
 * Da el rol de profesor, por los dos caminos que se dan en la realidad:
 *  - "existente": el profesor ya usa Annonia como nutricionista. Se le añade el rol y la
 *    próxima vez que entre aterriza en su espacio docente, con su cuenta de siempre intacta.
 *  - "nuevo": no tenía cuenta. Se la creamos con `crearCuentaNutricionista`, que ya deja lista
 *    la cuenta profesional completa (suscripción, paciente de ejemplo y email de bienvenida),
 *    y encima le ponemos el rol. Nace con las dos cosas.
 */
export async function asignarProfesorLicencia(data: {
  licenciaId: string;
  modo: "existente" | "nuevo";
  dietistaId?: string;
  nombre?: string;
  apellidos?: string;
  email?: string;
  password?: string;
}): Promise<{ ok: boolean; error?: string; dietistaId?: string }> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("validation");

  const licencia = await prisma.licenciaDocente.findUnique({
    where: { id: data.licenciaId },
    select: { id: true, maxProfesores: true, institucion: true },
  });
  if (!licencia) return { ok: false, error: t("docencia.licenciaNoEncontrada") };

  const { profesores } = await contarMiembros(licencia.id);
  if (profesores >= licencia.maxProfesores) {
    return { ok: false, error: t("docencia.sinCupoProfesores", { max: licencia.maxProfesores }) };
  }

  try {
    let dietistaId: string;

    if (data.modo === "existente") {
      if (!data.dietistaId) return { ok: false, error: t("docencia.dietistaObligatorio") };
      const dietista = await prisma.dietista.findUnique({
        where: { id: data.dietistaId },
        select: { id: true, rolDocente: true },
      });
      if (!dietista) return { ok: false, error: t("admin.dietistaNoEncontrado") };
      if (dietista.rolDocente) return { ok: false, error: t("docencia.yaTieneRolDocente") };
      dietistaId = dietista.id;
    } else {
      if (!data.email || !data.password || !data.nombre) {
        return { ok: false, error: t("admin.camposObligatorios") };
      }
      const creada = await crearCuentaNutricionista({
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        apellidos: data.apellidos || "",
        fuenteContacto: `Docencia — ${licencia.institucion}`,
      });
      if (!creada.ok || !creada.dietistaId) return { ok: false, error: creada.error };
      dietistaId = creada.dietistaId;
    }

    await prisma.dietista.update({
      where: { id: dietistaId },
      data: { rolDocente: "PROFESOR", licenciaDocenteId: licencia.id },
    });

    revalidarDocencia();
    return { ok: true, dietistaId };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error asignando profesor:", e);
    return { ok: false, error: e instanceof Error ? e.message : t("general.errorDesconocido") };
  }
}

/**
 * Le quita el rol docente: la cuenta sigue existiendo tal cual y pasa a ser una cuenta de
 * nutricionista normal, con sus pacientes y sus dietas intactos. Solo pierde el espacio docente.
 */
export async function quitarRolDocente(dietistaId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("validation");

  try {
    await prisma.dietista.update({
      where: { id: dietistaId },
      data: { rolDocente: null, licenciaDocenteId: null },
    });
    revalidarDocencia();
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error quitando rol docente:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}
