/**
 * #39 — Salir de una universidad, o de la docencia entera.
 *
 * Guillermo, 6 sep 2026: hay tres salidas distintas y conviene no confundirlas.
 *
 *  1. **Salir de una clase**: dejo de dar esa asignatura. Sigo siendo profesor de mi facultad.
 *  2. **Salir de la universidad**: dejo esa facultad y libero su plaza de profesor. Conservo el
 *     espacio docente —sigo siendo docente— pero pierdo el acceso a las clases en las que estaba,
 *     a la espera de que me metan en otra universidad.
 *  3. **Dejar de ser docente**: vuelvo a ser un nutricionista normal, con mis pacientes intactos.
 *
 * En las tres, nada se borra: las clases se archivan y vuelven si a esa persona la readmiten o si
 * la clase pasa a otro profesor. Lo mismo que ya hacía quitar el rol desde administración.
 */
import type { Prisma } from "@/generated/prisma/client";

/** Lo mínimo de Prisma que hace falta aquí: sirve tanto el cliente como una transacción. */
type ClientePrisma = Prisma.TransactionClient;

/**
 * Saca a un profesor de una universidad: de sus clases y de la licencia.
 *
 * Las clases que creó se las queda otro de los que la llevan, si hay alguno; si no queda nadie,
 * se archivan con él todavía como creador, que es lo que permite recuperarlas tal cual el día que
 * vuelva. No toca `rolDocente`: eso lo decide quien llama.
 */
export async function sacarDeLaUniversidad(
  tx: ClientePrisma,
  dietistaId: string,
  licenciaId: string,
): Promise<{ clasesArchivadas: number; clasesTraspasadas: number }> {
  const clases = await tx.clase.findMany({
    where: {
      licenciaDocenteId: licenciaId,
      OR: [{ profesorId: dietistaId }, { profesores: { some: { profesorId: dietistaId } } }],
    },
    select: {
      id: true,
      profesorId: true,
      archivada: true,
      profesores: { select: { profesorId: true }, orderBy: { createdAt: "asc" } },
    },
  });

  let clasesArchivadas = 0;
  let clasesTraspasadas = 0;

  for (const clase of clases) {
    if (clase.profesorId !== dietistaId) continue; // Solo colaboraba: basta con quitarle de la lista.

    const relevo = clase.profesores.find((p) => p.profesorId !== dietistaId);
    if (relevo) {
      await tx.clase.update({ where: { id: clase.id }, data: { profesorId: relevo.profesorId } });
      clasesTraspasadas++;
    } else if (!clase.archivada) {
      await tx.clase.update({
        where: { id: clase.id },
        data: { archivada: true, archivadaAt: new Date() },
      });
      clasesArchivadas++;
    }
  }

  await tx.profesorClase.deleteMany({
    where: { profesorId: dietistaId, clase: { licenciaDocenteId: licenciaId } },
  });

  return { clasesArchivadas, clasesTraspasadas };
}
