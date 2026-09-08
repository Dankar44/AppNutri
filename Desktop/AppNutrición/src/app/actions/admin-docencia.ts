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
import { cursoDeAnio } from "@/lib/docencia";
import { contarAlumnosDeLicencia, plazasLibresDeLicencia, contarInvitacionesVivas } from "@/lib/docencia-bolsa";
import { sacarDeLaUniversidad } from "@/lib/docencia-salida";

export interface LicenciaDocenteItem {
  id: string;
  institucion: string;
  personaContacto: string | null;
  dominioEmail: string | null;
  maxProfesores: number;
  maxAlumnos: number;
  fechaInicio: Date;
  fechaFin: Date | null;
  activa: boolean;
  profesores: number;
  alumnos: number;
}

export interface LicenciaDocenteDetalle extends LicenciaDocenteItem {
  notas: string | null;
  createdAt: Date;
  /** Invitaciones enviadas y todavía sin usar. */
  invitaciones: { id: string; email: string; expiraAt: Date; envios: number; ultimoEnvioAt: Date | null }[];
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
    // Los alumnos se cuentan por la regla de la bolsa (alumnos distintos con acceso activo), no
    // por la columna de la licencia: quien está en dos clases ocupa una plaza, y a quien se le
    // retiró el acceso no ocupa ninguna.
    contarAlumnosDeLicencia(licenciaId),
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
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  return Promise.all(
    licencias.map(async (l) => ({
      id: l.id,
      institucion: l.institucion,
      personaContacto: l.personaContacto,
      dominioEmail: l.dominioEmail,
      maxProfesores: l.maxProfesores,
      maxAlumnos: l.maxAlumnos,
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
      invitaciones: {
        where: { aceptadaAt: null, expiraAt: { gte: new Date() } },
        select: { id: true, email: true, expiraAt: true, envios: true, ultimoEnvioAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!licencia) return null;

  return {
    id: licencia.id,
    institucion: licencia.institucion,
    personaContacto: licencia.personaContacto,
    dominioEmail: licencia.dominioEmail,
    maxProfesores: licencia.maxProfesores,
    maxAlumnos: licencia.maxAlumnos,
    fechaInicio: licencia.fechaInicio,
    fechaFin: licencia.fechaFin,
    activa: licencia.activa,
    notas: licencia.notas,
    createdAt: licencia.createdAt,
    invitaciones: licencia.invitaciones,
    miembros: licencia.miembros,
    ...(await contarMiembros(licencia.id)),
  };
}

export async function crearLicenciaDocente(data: {
  institucion: string;
  personaContacto?: string;
  dominioEmail?: string;
  maxProfesores: number;
  maxAlumnos: number;
  fechaInicio?: string;
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
        personaContacto: sanitizeStringOptional(data.personaContacto, 200) || null,
        dominioEmail: normalizarDominio(data.dominioEmail),
        maxProfesores,
        maxAlumnos,
        ...(data.fechaInicio ? { fechaInicio: new Date(data.fechaInicio) } : {}),
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
    personaContacto?: string;
    dominioEmail?: string;
    maxProfesores: number;
    maxAlumnos: number;
    fechaInicio?: string;
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
  // Las invitaciones enviadas y sin usar también están vendidas: bajar el cupo por debajo de
  // (alumnos + invitaciones) dejaba entrar a los invitados por encima del cupo nuevo, porque cada
  // invitación sigue siendo válida 30 días (auditoría 1 sep 2026).
  const reservadas = alumnos + (await contarInvitacionesVivas(licenciaId));
  if (maxAlumnos < reservadas) {
    return { ok: false, error: t("docencia.cupoAlumnosMenorQueAlta", { alta: reservadas }) };
  }

  try {
    await prisma.licenciaDocente.update({
      where: { id: licenciaId },
      data: {
        institucion,
        personaContacto: sanitizeStringOptional(data.personaContacto, 200) || null,
        dominioEmail: normalizarDominio(data.dominioEmail),
        maxProfesores,
        maxAlumnos,
        ...(data.fechaInicio ? { fechaInicio: new Date(data.fechaInicio) } : {}),
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

/**
 * A quién se le puede dar el rol de profesor de esta universidad: nutricionistas sin rol docente
 * y, además, **docentes que ahora mismo no están en ninguna universidad** (Guillermo, 6 sep 2026:
 * «así como docente, que no pertenece a alguna universidad, debería poder agregarse a otra»). Sin
 * esto, quien sale de una facultad se quedaba en un limbo del que no había forma de sacarle.
 *
 * Lo que sigue sin poderse es estar en dos a la vez: eso pide un cambio de modelo y está apuntado.
 */
export async function buscarDietistasParaDocencia(busqueda: string) {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const search = busqueda.trim();
  if (!search) return [];

  const filas = await prisma.dietista.findMany({
    where: {
      OR: [{ rolDocente: null }, { rolDocente: "PROFESOR", licenciaDocenteId: null }],
      AND: {
        OR: [
          { nombre: { contains: search, mode: "insensitive" } },
          { apellidos: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    },
    select: { id: true, nombre: true, apellidos: true, email: true, rolDocente: true },
    take: 10,
  });
  // `yaEsDocente` deja decir en la lista que a esa persona solo le falta universidad, no el rol.
  return filas.map(({ rolDocente, ...resto }) => ({ ...resto, yaEsDocente: rolDocente === "PROFESOR" }));
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
        select: { id: true, rolDocente: true, licenciaDocenteId: true },
      });
      if (!dietista) return { ok: false, error: t("admin.dietistaNoEncontrado") };
      // Se admite al que ya es profesor pero no está en ninguna universidad: es justo el caso de
      // quien salió de una facultad y entra en otra. Lo que no vale es sacarle de la suya sin más.
      if (dietista.rolDocente === "ALUMNO" || (dietista.rolDocente === "PROFESOR" && dietista.licenciaDocenteId)) {
        return { ok: false, error: t("docencia.yaTieneRolDocente") };
      }
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
        // Valor canónico: el filtro "Universidad" de /admin/dietistas compara exacto, y con texto
        // libre el profesor no aparecía justo en el filtro que existe para encontrarlo. La
        // institución no se pierde: queda en la licencia y se ve en su ficha.
        fuenteContacto: "universidad",
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
/**
 * Le saca de ESTA universidad, pero sigue siendo docente (Guillermo, 6 sep 2026). Libera la plaza
 * de profesor y pierde el acceso a las clases de esa facultad; conserva su espacio, sus casos y
 * sus pacientes, a la espera de que se le meta en otra. Sus clases se archivan, no se borran: si
 * vuelve a esta misma universidad las recupera tal cual.
 */
export async function sacarProfesorDeLaUniversidad(
  dietistaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("validation");

  const profesor = await prisma.dietista.findUnique({
    where: { id: dietistaId },
    select: { id: true, licenciaDocenteId: true, rolDocente: true },
  });
  if (!profesor) return { ok: false, error: t("admin.dietistaNoEncontrado") };
  // Cada export de un fichero "use server" es un endpoint: sin esto, pasarle el id de un ALUMNO
  // (que también tiene licencia) le sacaría de su facultad por una puerta que no es la suya.
  if (profesor.rolDocente !== "PROFESOR") return { ok: false, error: t("admin.dietistaNoEncontrado") };
  if (!profesor.licenciaDocenteId) return { ok: false, error: t("docencia.noEstasEnUniversidad") };

  try {
    await prisma.$transaction(async (tx) => {
      await sacarDeLaUniversidad(tx, dietistaId, profesor.licenciaDocenteId!);
      await tx.dietista.update({ where: { id: dietistaId }, data: { licenciaDocenteId: null } });
    });
    revalidarDocencia();
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error sacando al profesor de la universidad:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

export async function quitarRolDocente(dietistaId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");

  const t = await getTranslations("validation");

  try {
    // Sus clases se archivan, no se borran: los alumnos conservan su trabajo y todo vuelve si el
    // rol se le devuelve o si la clase pasa a otro profesor. Decidido con Guillermo el 30 ago 2026.
    // Desde el 6 sep 2026 lo hace el mismo camino que la salida voluntaria: si la clase la llevan
    // otros profesores, pasa a ellos en vez de archivarse y dejarles sin ella.
    const ficha = await prisma.dietista.findUnique({
      where: { id: dietistaId },
      select: { licenciaDocenteId: true },
    });
    await prisma.$transaction(async (tx) => {
      if (ficha?.licenciaDocenteId) {
        await sacarDeLaUniversidad(tx, dietistaId, ficha.licenciaDocenteId);
      }
      // Las de fuera de su licencia (o de antes de tenerla) se archivan igual: ya no es docente.
      await tx.clase.updateMany({
        where: { profesorId: dietistaId, archivada: false },
        data: { archivada: true, archivadaAt: new Date() },
      });
      await tx.dietista.update({
        where: { id: dietistaId },
        data: { rolDocente: null, licenciaDocenteId: null },
      });
    });
    revalidarDocencia();
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error quitando rol docente:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

export interface AlumnoAdmin {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  /** Nació en una clase (la creó su profesor) o ya era nutricionista antes. */
  cuentaDeClase: boolean;
  institucion: string | null;
  licenciaId: string | null;
  clase: string | null;
  claseId: string | null;
  profesor: string | null;
  /** Con el acceso puesto ahora mismo: es lo que de verdad consume plaza. */
  activo: boolean;
  altaAt: Date | null;
  bajaAt: Date | null;
  ultimoAcceso: Date | null;
  /** Nunca ha llegado a entrar: la facultad está pagando una plaza que no se usa. */
  nuncaEntro: boolean;
}

/**
 * Todos los alumnos, para poder responder al teléfono cuando llame una facultad.
 *
 * Se listan las MATRÍCULAS y no los alumnos: uno que esté en las clases de dos profesores sale
 * dos veces, que es justo lo que hay que ver para entender por qué la bolsa cuadra o no. La
 * cuenta de plazas ocupadas sí es de alumnos distintos, como se factura.
 */
export async function getAlumnosAdmin(filtros?: {
  licenciaId?: string;
  /** "activos" | "retirados" | undefined (todos) */
  estado?: string;
  buscar?: string;
}): Promise<AlumnoAdmin[]> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") return [];

  const buscar = filtros?.buscar?.trim();
  const matriculas = await prisma.alumnoClase.findMany({
    where: {
      ...(filtros?.estado === "activos" ? { activa: true } : {}),
      ...(filtros?.estado === "retirados" ? { activa: false } : {}),
      ...(filtros?.licenciaId ? { clase: { licenciaDocenteId: filtros.licenciaId } } : {}),
      ...(buscar
        ? {
            alumno: {
              OR: [
                { nombre: { contains: buscar, mode: "insensitive" } },
                { apellidos: { contains: buscar, mode: "insensitive" } },
                { email: { contains: buscar, mode: "insensitive" } },
              ],
            },
          }
        : {}),
    },
    orderBy: [{ activa: "desc" }, { altaAt: "desc" }],
    take: 500,
    include: {
      alumno: { select: { id: true, nombre: true, apellidos: true, email: true, cuentaDeClase: true, lastAccessAt: true } },
      clase: {
        select: {
          id: true, nombre: true,
          profesor: { select: { nombre: true, apellidos: true } },
          licenciaDocente: { select: { id: true, institucion: true } },
        },
      },
    },
  });

  return matriculas.map((m) => ({
    id: m.alumno.id,
    nombre: m.alumno.nombre,
    apellidos: m.alumno.apellidos,
    email: m.alumno.email,
    cuentaDeClase: m.alumno.cuentaDeClase,
    institucion: m.clase.licenciaDocente?.institucion ?? null,
    licenciaId: m.clase.licenciaDocente?.id ?? null,
    clase: m.clase.nombre,
    claseId: m.clase.id,
    profesor: `${m.clase.profesor.nombre} ${m.clase.profesor.apellidos}`.trim(),
    activo: m.activa,
    altaAt: m.altaAt,
    bajaAt: m.bajaAt,
    ultimoAcceso: m.alumno.lastAccessAt,
    nuncaEntro: m.alumno.lastAccessAt === null,
  }));
}

/** Lo que consume cada institución de verdad, para cobrar y para renovar. */
export async function getConsumoDeLicencias(): Promise<
  { id: string; institucion: string; maxAlumnos: number; ocupadas: number; libres: number; activa: boolean }[]
> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") return [];

  const licencias = await prisma.licenciaDocente.findMany({
    orderBy: { institucion: "asc" },
    select: { id: true, institucion: true, maxAlumnos: true, activa: true },
  });

  return Promise.all(
    licencias.map(async (l) => {
      const ocupadas = await contarAlumnosDeLicencia(l.id);
      return {
        id: l.id,
        institucion: l.institucion,
        maxAlumnos: l.maxAlumnos,
        ocupadas,
        libres: await plazasLibresDeLicencia(l.id),
        activa: l.activa,
      };
    }),
  );
}

/**
 * Renovar una universidad para el curso siguiente, sin crear otra licencia.
 *
 * Es lo que pasa cada verano: «seguimos, y este año somos 13 profesores y 350 alumnos». Se cambian
 * las fechas al curso nuevo y las plazas a las vendidas, y con eso profesores y alumnos recuperan
 * el espacio docente con todo su trabajo donde lo dejaron (Guillermo, 8 sep 2026).
 *
 * Las plazas se ponen, no se suman: «13» quiere decir 13 ese curso, no 13 más los del año pasado.
 * Si no se acumularan, una facultad con tres renovaciones acabaría con plazas de sobra sin pagarlas.
 */
export async function renovarLicenciaDocente(data: {
  licenciaId: string;
  /** Año en que empieza el curso: 2027 es el curso 2027/28. */
  curso: number;
  maxProfesores: number;
  maxAlumnos: number;
}): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin || admin.role !== "admin") redirect("/admin-login");
  const t = await getTranslations("validation");

  const profes = Math.floor(Number(data.maxProfesores));
  const alumnos = Math.floor(Number(data.maxAlumnos));
  if (!Number.isFinite(profes) || profes < 0 || profes > 200) return { ok: false, error: t("docencia.plazasNoValidas") };
  if (!Number.isFinite(alumnos) || alumnos < 0 || alumnos > 5000) return { ok: false, error: t("docencia.plazasNoValidas") };

  const curso = cursoDeAnio(Math.floor(Number(data.curso)));
  const licencia = await prisma.licenciaDocente.findUnique({
    where: { id: data.licenciaId },
    select: { id: true, fechaFin: true },
  });
  if (!licencia) return { ok: false, error: t("docencia.licenciaNoEncontrada") };
  // Hacia atrás no se renueva: sería quitarle el acceso a quien lo tiene.
  if (licencia.fechaFin && curso.fin.getTime() < licencia.fechaFin.getTime()) {
    return { ok: false, error: t("docencia.renovarHaciaAtras") };
  }

  try {
    await prisma.licenciaDocente.update({
      where: { id: data.licenciaId },
      data: {
        activa: true,
        fechaInicio: curso.inicio,
        fechaFin: curso.fin,
        maxProfesores: profes,
        maxAlumnos: alumnos,
      },
    });
    revalidatePath("/admin/universidades");
    revalidatePath(`/admin/universidades/${data.licenciaId}`);
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[docencia] Error renovando la licencia:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}
