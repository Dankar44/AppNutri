/**
 * #39/#40 — La limpieza del módulo docente, que corre SOLA.
 *
 * Guillermo, 7 sep 2026: «toda la limpieza que se pueda hacer automática, mejor». Así que no hay
 * botón ni cron que mantener: la aplicación se limpia a sí misma una vez al día, cuando alguien
 * entra en el espacio docente o en el aula. Y `scripts/limpiar-docencia.ts` llama a esto mismo
 * para poder mirarlo o forzarlo a mano — una sola implementación, sin dos verdades.
 *
 * Lo que se lleva, todo de cursos que ya han terminado:
 *
 *   1. La **foto del trabajo** de las entregas de clases cuyo curso acabó. Es lo único que ocupa
 *      algo por entrega (~1 KB): el PDF no se guarda desde el 7 sep 2026, se genera al pedirlo.
 *   2. Las **invitaciones sin usar** caducadas hace más de 90 días.
 *   3. Los **pacientes de prácticas** de quien ya no es alumno: al acabar su año escolar pierde
 *      los pacientes que nacieron de un caso. Nunca los suyos propios, y su cuenta no se toca.
 *
 * Lo que NO se toca nunca: la nota, el comentario, las fechas y el nombre de lo que entregó. El
 * expediente se queda entero; lo que se va es el peso.
 */
import type { PrismaClient } from "@/generated/prisma/client";

/** Días que se guarda una invitación caducada antes de tirarla. */
const DIAS_INVITACION = 90;

export interface ResultadoLimpieza {
  fotosBorradas: number;
  invitacionesBorradas: number;
  pacientesBorrados: number;
}

/**
 * Hace la limpieza. Con `simular` solo cuenta lo que se llevaría, sin tocar nada.
 *
 * Recibe el cliente de Prisma para poder usarse tanto desde la aplicación como desde un script.
 */
export async function limpiarDocencia(
  prisma: PrismaClient,
  { simular = false }: { simular?: boolean } = {},
): Promise<ResultadoLimpieza> {
  const hoy = new Date();
  const caducadasAntesDe = new Date(hoy.getTime() - DIAS_INVITACION * 24 * 60 * 60 * 1000);

  // 1. La foto del trabajo de los cursos terminados. El filtro de "tiene foto" se hace en SQL
  // crudo: en Prisma, comparar un Json con null pide `JsonNull` y aquí solo hace falta saber si
  // la columna está vacía.
  const conFoto = await prisma.$queryRaw<{ id: string }[]>`
    SELECT e.id FROM entregas_caso e
      JOIN asignaciones_caso a ON a.id = e."asignacionId"
      JOIN clases c ON c.id = a."claseId"
     WHERE e."entregaSnapshot" IS NOT NULL
       AND c."fechaFinCurso" IS NOT NULL
       AND c."fechaFinCurso" < ${hoy}`;
  const fotos = conFoto;
  if (!simular && fotos.length > 0) {
    // En SQL, no en Prisma: `{ set: null }` guarda el JSON `null` («null» como valor), no un NULL
    // de columna, y entonces `IS NULL` sigue siendo falso y la fila seguiría ocupando.
    await prisma.$executeRaw`
      UPDATE entregas_caso SET "entregaSnapshot" = NULL WHERE id = ANY(${fotos.map((f) => f.id)}::text[])`;
  }

  // 2. Invitaciones sin usar que caducaron hace mucho.
  const dondeInvitaciones = { aceptadaAt: null, expiraAt: { lt: caducadasAntesDe } };
  const invitaciones = await prisma.invitacionDocente.count({ where: dondeInvitaciones });
  if (!simular && invitaciones > 0) {
    await prisma.invitacionDocente.deleteMany({ where: dondeInvitaciones });
  }

  // 3. Los pacientes de prácticas de quien ya no es alumno.
  // Ojo al NULL: `rolDocente != 'ALUMNO'` NO casa cuando la columna es NULL, que es justo el caso
  // de quien dejó de ser alumno. Hay que nombrarlo aparte.
  const dondePacientes = {
    esDeClase: true,
    dietista: { OR: [{ rolDocente: null }, { rolDocente: { not: "ALUMNO" as const } }] },
  };
  const pacientes = await prisma.paciente.count({ where: dondePacientes });
  if (!simular && pacientes > 0) {
    await prisma.paciente.deleteMany({ where: dondePacientes });
  }

  return {
    fotosBorradas: fotos.length,
    invitacionesBorradas: invitaciones,
    pacientesBorrados: pacientes,
  };
}

/**
 * Cada cuánto se repasa: una vez al día por proceso. Se guarda en memoria a propósito, sin tabla
 * ni columna nueva — al reiniciar (un despliegue) se limpia otra vez, que tampoco hace daño porque
 * la limpieza es idempotente y si no hay nada que borrar no toca la base.
 */
const CADA = 24 * 60 * 60 * 1000;
let ultimaVez = 0;

/**
 * Lanza la limpieza si toca, **sin esperarla**: quien la dispara es alguien abriendo su aula o su
 * espacio docente, y no tiene por qué pagar el tiempo. Si falla, se anota y ya se reintentará.
 */
export function limpiarDocenciaSiToca(prisma: PrismaClient): void {
  const ahora = Date.now();
  if (ahora - ultimaVez < CADA) return;
  ultimaVez = ahora;
  void limpiarDocencia(prisma)
    .then((r) => {
      const total = r.fotosBorradas + r.invitacionesBorradas + r.pacientesBorrados;
      if (total > 0) {
        console.log(`[docencia] Limpieza: ${r.fotosBorradas} fotos, ${r.invitacionesBorradas} invitaciones, ${r.pacientesBorrados} pacientes de prácticas`);
      }
    })
    .catch((e) => console.error("[docencia] La limpieza automática ha fallado:", e));
}
