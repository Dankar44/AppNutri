import "server-only";
import { prisma } from "@/lib/prisma";
import { inicioDeHoy } from "@/lib/docencia";

/**
 * #39 — Cuándo puede entrar un alumno.
 *
 * El curso se cierra solo: nadie tiene que acordarse de nada en septiembre. No hay tarea
 * programada ni proceso nocturno; se mira al entrar, que es el único momento en el que importa.
 *
 * Lo que NO pasa al terminar el curso, porque se decidió así (Guillermo, 27 ago 2026):
 *  - no se borra nada: sus dietas y sus casos siguen ahí por si el año que viene vuelve;
 *  - al profesor no se le echa: pierde solo la capacidad de dar altas;
 *  - y una cuenta nacida en una clase no se convierte en una cuenta gratis de nutricionista.
 */

export interface ClaseViva {
  id: string;
  nombre: string;
  curso: string | null;
  fechaFinCurso: Date | null;
  institucion: string | null;
}

/** La clase en marcha que le da acceso, si le queda alguna. */
export async function claseVivaDeAlumno(alumnoId: string): Promise<ClaseViva | null> {
  const hoy = inicioDeHoy();
  const matricula = await prisma.alumnoClase.findFirst({
    where: {
      alumnoId,
      activa: true,
      clase: {
        archivada: false,
        OR: [{ fechaFinCurso: null }, { fechaFinCurso: { gte: hoy } }],
        AND: [{
          OR: [
            { licenciaDocenteId: null },
            {
              licenciaDocente: {
                activa: true,
                OR: [{ fechaFin: null }, { fechaFin: { gte: hoy } }],
              },
            },
          ],
        }],
      },
    },
    orderBy: { altaAt: "desc" },
    select: {
      clase: {
        select: {
          id: true, nombre: true, curso: true, fechaFinCurso: true,
          licenciaDocente: { select: { institucion: true } },
        },
      },
    },
  });
  if (!matricula) return null;
  return {
    id: matricula.clase.id,
    nombre: matricula.clase.nombre,
    curso: matricula.clase.curso,
    fechaFinCurso: matricula.clase.fechaFinCurso,
    institucion: matricula.clase.licenciaDocente?.institucion ?? null,
  };
}

/**
 * ¿Se le deja pasar al panel?
 *
 * Solo se cierra la puerta a las cuentas **nacidas en una clase**. A quien ya era nutricionista
 * antes de que su profesor le metiese en el aula no se le toca nada: acabar el curso solo le
 * quita lo de la clase. Y si un alumno se ha quedado con Annonia al terminar la carrera y tiene
 * su suscripción, entra como cualquier otro cliente.
 */
export async function alumnoPuedeEntrar(dietista: {
  id: string;
  rolDocente: string | null;
  cuentaDeClase: boolean;
}): Promise<{ puede: boolean; clase: ClaseViva | null }> {
  if (dietista.rolDocente !== "ALUMNO") return { puede: true, clase: null };

  const clase = await claseVivaDeAlumno(dietista.id);
  if (clase) return { puede: true, clase };
  if (!dietista.cuentaDeClase) return { puede: true, clase: null };

  const suscripcion = await prisma.suscripcion.findFirst({
    where: { dietistaId: dietista.id, estado: "ACTIVA" },
    select: { id: true },
  });
  return { puede: suscripcion !== null, clase: null };
}
