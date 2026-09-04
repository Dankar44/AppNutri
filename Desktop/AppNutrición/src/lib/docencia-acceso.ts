import "server-only";
import { prisma } from "@/lib/prisma";
import { inicioDeHoy } from "@/lib/docencia";

/**
 * #39 — Qué pasa con el alumno cuando se le acaba el curso.
 *
 * **Nunca se le echa** (Guillermo, 1 sep 2026). Lo que pierde al salir de una clase es la clase:
 * el material que le comparte el profesor, sus casos y sus entregas. Su cuenta, sus dietas y sus
 * pacientes de prácticas son suyos y sigue entrando con ellos.
 *
 * Cuando se queda sin ninguna clase viva deja de ser alumno y pasa a cuenta normal de
 * nutricionista, con un aviso que se le enseña una sola vez: se ha acabado su año escolar y, por
 * ser de los primeros, la cuenta se le queda gratis.
 *
 * OJO — lo de "gratis de por vida" es de esta época, cuando todo es gratis. **Cuando haya pasarela
 * de pago hay que volver aquí** y decidir qué pasa con el alumno que termina la carrera.
 *
 * Su plaza vuelve a la bolsa en cuanto sale de la clase, así que la facultad no paga por él
 * aunque siga usando Annonia: eso lo cuenta `docencia-bolsa`, por matrículas activas.
 */

export interface ClaseViva {
  id: string;
  nombre: string;
  fechaInicioCurso: Date | null;
  fechaFinCurso: Date | null;
  institucion: string | null;
}

/** La clase en marcha que le da acceso al material de su profesor, si le queda alguna. */
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
          id: true, nombre: true, fechaInicioCurso: true, fechaFinCurso: true,
          licenciaDocente: { select: { institucion: true } },
        },
      },
    },
  });
  if (!matricula) return null;
  return {
    id: matricula.clase.id,
    nombre: matricula.clase.nombre,
    fechaInicioCurso: matricula.clase.fechaInicioCurso,
    fechaFinCurso: matricula.clase.fechaFinCurso,
    institucion: matricula.clase.licenciaDocente?.institucion ?? null,
  };
}

export interface EstadoDelAlumno {
  /** Le queda alguna clase en marcha. */
  sigueEnClase: boolean;
  clase: ClaseViva | null;
  /** Hay que enseñarle el aviso de que su año escolar terminó y la cuenta se le queda. */
  avisoPendiente: boolean;
}

/**
 * Mira si sigue en alguna clase y, si no, le pasa a cuenta normal.
 *
 * Se llama al entrar al panel, que es el único momento en el que importa: sin tarea programada ni
 * proceso nocturno. Solo lo pagan los alumnos y los exalumnos con el aviso sin ver; el resto de
 * nutricionistas no paga ninguna consulta extra.
 */
export async function revisarCursoDelAlumno(dietista: {
  id: string;
  rolDocente: string | null;
  cuentaDeClase: boolean;
  exAlumnoDesde: Date | null;
  avisoFinCursoVisto: boolean;
}): Promise<EstadoDelAlumno> {
  if (dietista.rolDocente !== "ALUMNO") {
    return {
      sigueEnClase: false,
      clase: null,
      // Un exalumno que todavía no ha visto el aviso lo ve la próxima vez que entre.
      avisoPendiente: dietista.exAlumnoDesde !== null && !dietista.avisoFinCursoVisto,
    };
  }

  const clase = await claseVivaDeAlumno(dietista.id);
  if (clase) return { sigueEnClase: true, clase, avisoPendiente: false };

  // Sin clases: deja de ser alumno. Conserva `cuentaDeClase` porque sigue siendo verdad que su
  // cuenta nació en un aula, y eso es lo que distingue en administración al exalumno del
  // nutricionista que se registró por su cuenta.
  //
  // El aviso solo es para las cuentas NACIDAS en una clase: a quien ya era nutricionista antes de
  // que su profesor le metiese en el aula, decirle "la cuenta se te queda gratis" no le dice nada
  // — su cuenta siempre fue suya. A ese se le quita el rol y se le deja entrar sin más.
  const nacioEnClase = dietista.cuentaDeClase;
  await prisma.dietista.update({
    where: { id: dietista.id },
    data: {
      rolDocente: null,
      ...(nacioEnClase ? { exAlumnoDesde: new Date(), avisoFinCursoVisto: false } : {}),
    },
  }).catch((e) => console.error("[docencia] No se pudo pasar el alumno a cuenta normal:", e));

  return { sigueEnClase: false, clase: null, avisoPendiente: nacioEnClase };
}
