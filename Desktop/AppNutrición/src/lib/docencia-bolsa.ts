import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { inicioDeHoy } from "@/lib/docencia";

/**
 * #39 — Cuántas licencias de alumno consume una institución de verdad.
 *
 * Tres reglas que hay que tener juntas en un solo sitio, porque contarlas mal significa cobrar mal:
 *
 * 1. **Un alumno = una licencia**, aunque esté en las clases de dos profesores distintos. Por eso
 *    se cuentan alumnos distintos y no matrículas.
 * 2. **Solo cuentan los que tienen el acceso activo y en clases vivas.** A quien se le retiró al
 *    acabar el curso no ocupa plaza: su sitio queda libre, y sus datos siguen intactos. Una clase
 *    archivada no cuenta, y una cuyo curso ya pasó tampoco: si no se descontara, la bolsa de una
 *    facultad seguiría llena de los alumnos del año anterior hasta que a alguien se le ocurriera
 *    archivar las clases a mano (encontrado al probar el ciclo del curso, 1 sep 2026).
 * 3. **Las invitaciones sin usar también reservan.** Si no, se mandarían doscientas invitaciones
 *    para cincuenta plazas y el problema aparecería al aceptarlas, cuando ya es tarde.
 *
 * Todas las funciones aceptan un cliente de transacción para poder contar y escribir dentro del
 * mismo bloque: comprobar fuera y escribir después dejaba entrar a dos personas a la vez en la
 * última plaza (auditoría 1 sep 2026).
 */

type ClientePrisma = Prisma.TransactionClient | typeof prisma;

/** Clases que de verdad están en marcha: ni archivadas ni con el curso ya pasado. */
function claseViva(licenciaId: string): Prisma.ClaseWhereInput {
  return {
    licenciaDocenteId: licenciaId,
    archivada: false,
    OR: [{ fechaFinCurso: null }, { fechaFinCurso: { gte: inicioDeHoy() } }],
  };
}

export async function contarAlumnosDeLicencia(
  licenciaId: string,
  cliente: ClientePrisma = prisma,
): Promise<number> {
  // Se cuentan MATRÍCULAS activas y se agrupan por alumno: así el alumno que está en las clases de
  // dos profesores de la misma facultad sale una vez, no dos.
  const alumnos = await cliente.alumnoClase.findMany({
    where: { activa: true, clase: claseViva(licenciaId) },
    select: { alumnoId: true },
    distinct: ["alumnoId"],
  });
  return alumnos.length;
}

/** Invitaciones enviadas, vivas y sin usar de una institución. Cada una reserva su plaza. */
export async function contarInvitacionesVivas(
  licenciaId: string,
  cliente: ClientePrisma = prisma,
): Promise<number> {
  const invitaciones = await cliente.invitacionDocente.findMany({
    where: {
      rol: "ALUMNO",
      aceptadaAt: null,
      expiraAt: { gte: new Date() },
      licenciaDocenteId: licenciaId,
      clase: { archivada: false },
    },
    select: { email: true },
    distinct: ["email"],
  });
  return invitaciones.length;
}

/** Plazas de alumno que quedan libres, contando también lo reservado por invitaciones. */
export async function plazasLibresDeLicencia(
  licenciaId: string,
  cliente: ClientePrisma = prisma,
): Promise<number> {
  const licencia = await cliente.licenciaDocente.findUnique({
    where: { id: licenciaId },
    select: { maxAlumnos: true },
  });
  if (!licencia) return 0;

  const [ocupadas, invitadas] = await Promise.all([
    contarAlumnosDeLicencia(licenciaId, cliente),
    contarInvitacionesVivas(licenciaId, cliente),
  ]);
  return Math.max(0, licencia.maxAlumnos - ocupadas - invitadas);
}

/**
 * ¿Este alumno ya está ocupando una plaza de esta institución?
 *
 * Hace falta antes de dar de alta: si ya está en la clase de otro profesor de la misma facultad,
 * meterlo en una segunda clase no consume otra plaza (regla 1), así que no se le puede rechazar
 * por bolsa llena. Sin esto, en una facultad con la bolsa justa el segundo profesor no podría
 * añadir a sus propios alumnos.
 */
export async function alumnoYaOcupaPlaza(
  licenciaId: string,
  alumnoId: string,
  cliente: ClientePrisma = prisma,
): Promise<boolean> {
  const matricula = await cliente.alumnoClase.findFirst({
    where: { alumnoId, activa: true, clase: claseViva(licenciaId) },
    select: { id: true },
  });
  return matricula !== null;
}

/**
 * Coge una plaza de la bolsa y hace el alta **dentro de la misma transacción**.
 *
 * La fila de la licencia se bloquea (`FOR UPDATE`) mientras se cuenta y se escribe, así que dos
 * altas simultáneas se ponen en fila y solo una se queda con la última plaza. Antes se contaba
 * fuera y se escribía después, y cuarenta personas pulsando a la vez entraban las cuarenta.
 *
 * `email` sirve para consumir la invitación que esa persona tuviera pendiente: si se apunta por el
 * enlace de la clase teniendo una invitación por correo sin usar, su plaza estaba reservada dos
 * veces y la bolsa parecía más pequeña de lo que es.
 */
export async function conPlazaDeLaBolsa<T>(
  licenciaId: string,
  quien: { alumnoId?: string | null; email?: string | null },
  trabajo: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<{ ok: true; valor: T } | { ok: false; motivo: "sinPlazas" }> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRawUnsafe(`SELECT id FROM licencias_docentes WHERE id = $1 FOR UPDATE`, licenciaId);

    if (quien.email) {
      // La invitación pendiente deja de reservar en cuanto la persona entra por donde sea: si se
      // apunta por el enlace de la clase teniendo una invitación por correo sin usar, su plaza
      // estaba contada dos veces. Se borra en vez de marcarla aceptada para que no aparezca en la
      // lista del profesor como una invitación que alguien usó.
      await tx.invitacionDocente.deleteMany({
        where: { email: quien.email, rol: "ALUMNO", licenciaDocenteId: licenciaId, aceptadaAt: null },
      });
    }

    const yaDentro = quien.alumnoId
      ? await alumnoYaOcupaPlaza(licenciaId, quien.alumnoId, tx)
      : false;
    if (!yaDentro && (await plazasLibresDeLicencia(licenciaId, tx)) <= 0) {
      return { ok: false as const, motivo: "sinPlazas" as const };
    }

    return { ok: true as const, valor: await trabajo(tx) };
  }, {
    // Dentro va la creación de la cuenta de autenticación, que cifra la contraseña; y con la fila
    // de la licencia bloqueada, una clase entera apuntándose a la vez hace cola aquí.
    timeout: 20_000,
    maxWait: 15_000,
  });
}
