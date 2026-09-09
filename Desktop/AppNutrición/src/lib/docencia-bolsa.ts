import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { inicioDeHoy, inicioDeAnioEscolar } from "@/lib/docencia";

/**
 * #39 — Cuántas licencias de alumno consume una institución de verdad.
 *
 * Tres reglas que hay que tener juntas en un solo sitio, porque contarlas mal significa cobrar mal:
 *
 * 1. **Un alumno = una licencia**, aunque esté en las clases de dos profesores distintos. Por eso
 *    se cuentan alumnos distintos y no matrículas.
 2. **La plaza se consume PARA TODO EL CURSO.** Quien entra en septiembre la ocupa hasta el 31 de
 *    agosto, aunque se salga de todas las clases al día siguiente, aunque le retiren el acceso o
 *    aunque se archive la clase. Y el 1 de septiembre la facultad recupera sus plazas enteras
 *    (Guillermo, 8 sep 2026: "hay trescientas plazas… si un alumno se mete a una clase, va a estar
 *    esa plaza para todo el año escolar, por mucho que se vaya").
 *
 *    Antes se contaban solo los activos, así que la bolsa subía y bajaba sola y una facultad podía
 *    rotar gente para estirar lo comprado. Ahora el contador solo sube dentro del curso, que es lo
 *    que se vende y lo que se entiende sin explicaciones.
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
  // Cuenta quien haya pasado por una clase de esta facultad DURANTE ESTE CURSO, siga o no. Y
  // también quien siga activo desde antes, que su alta es de un curso anterior pero sigue ocupando.
  // Se agrupa por alumno: el que está en las clases de dos profesores sale una vez, no dos.
  const alumnos = await cliente.alumnoClase.findMany({
    where: {
      clase: { licenciaDocenteId: licenciaId },
      OR: [
        { altaAt: { gte: inicioDeAnioEscolar() } },
        { activa: true, clase: claseViva(licenciaId) },
      ],
    },
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
 * ¿Este alumno ya tiene gastada una plaza de esta institución en este curso?
 *
 * Hace falta antes de dar de alta, por dos motivos: si ya está en la clase de otro profesor de la
 * misma facultad, meterlo en una segunda no consume otra plaza (regla 1); y si estuvo y se fue,
 * volver a entrar tampoco, porque su plaza ya está gastada para todo el curso (regla 2). Sin esto,
 * el alumno que cambia de clase a mitad de curso pagaría dos veces, y en una facultad con la bolsa
 * justa el segundo profesor no podría añadir a sus propios alumnos.
 */
export async function alumnoYaOcupaPlaza(
  licenciaId: string,
  alumnoId: string,
  cliente: ClientePrisma = prisma,
): Promise<boolean> {
  const matricula = await cliente.alumnoClase.findFirst({
    where: {
      alumnoId,
      clase: { licenciaDocenteId: licenciaId },
      OR: [
        { altaAt: { gte: inicioDeAnioEscolar() } },
        { activa: true, clase: claseViva(licenciaId) },
      ],
    },
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

/**
 * ¿Le queda sitio al enlace de ESTA clase?
 *
 * El tope de la facultad no basta: un profesor con 300 en la bolsa podía llenarla él solo y dejar
 * sin sitio a los demás. Con su cupo puesto —"en mi clase somos 60"— manda el que se agote antes
 * (Guillermo, 8 sep 2026). Sin cupo, como hasta ahora: solo cuenta el de la facultad.
 *
 * Se cuenta como la bolsa: quien haya pasado por la clase este curso, siga o no. Si no, bastaría
 * con que se fuera uno para colar a otro por el enlace, y el cupo no querría decir nada.
 */
export async function plazasLibresDeLaClase(
  claseId: string,
  cliente: ClientePrisma = prisma,
): Promise<number | null> {
  const clase = await cliente.clase.findUnique({
    where: { id: claseId },
    select: { cupoEnlace: true },
  });
  if (!clase?.cupoEnlace) return null;

  // Cuentan los matriculados Y las invitaciones de esta clase que están sin usar: una invitación
  // por correo le guarda el sitio a esa persona, igual que le reserva la plaza en la bolsa de la
  // facultad. Sin esto, quien entrase por el enlace le quitaba el hueco y al aceptar su correo se
  // encontraba la clase llena, con la plaza ya gastada (Guillermo, 9 sep 2026).
  const [matriculas, invitaciones] = await Promise.all([
    cliente.alumnoClase.findMany({
      where: {
        claseId,
        OR: [{ altaAt: { gte: inicioDeAnioEscolar() } }, { activa: true }],
      },
      select: { alumnoId: true },
      distinct: ["alumnoId"],
    }),
    cliente.invitacionDocente.count({
      where: { claseId, rol: "ALUMNO", aceptadaAt: null, expiraAt: { gte: new Date() } },
    }),
  ]);
  return Math.max(0, clase.cupoEnlace - matriculas.length - invitaciones);
}
