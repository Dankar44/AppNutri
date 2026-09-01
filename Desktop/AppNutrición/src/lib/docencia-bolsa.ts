import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * #39 — Cuántas licencias de alumno consume una institución de verdad.
 *
 * Dos reglas que hay que tener juntas en un solo sitio, porque contarlas mal significa cobrar mal:
 *
 * 1. **Un alumno = una licencia**, aunque esté en las clases de dos profesores distintos. Por eso
 *    se cuentan alumnos distintos y no matrículas.
 * 2. **Solo cuentan los que tienen el acceso activo.** A quien se le retiró al acabar el curso no
 *    ocupa plaza: su sitio queda libre para otro, y sus datos siguen intactos por si vuelve.
 */
export async function contarAlumnosDeLicencia(licenciaId: string): Promise<number> {
  const alumnos = await prisma.dietista.findMany({
    where: {
      rolDocente: "ALUMNO",
      matriculas: {
        some: {
          activa: true,
          clase: { licenciaDocenteId: licenciaId, archivada: false },
        },
      },
    },
    select: { id: true },
  });
  return alumnos.length;
}

/**
 * Plazas de alumno que quedan libres. Cuenta también las invitaciones sin usar: si no, se podrían
 * mandar doscientas invitaciones para cincuenta plazas y el problema aparecería al aceptarlas,
 * cuando ya es tarde para explicárselo a nadie.
 */
export async function plazasLibresDeLicencia(licenciaId: string): Promise<number> {
  const licencia = await prisma.licenciaDocente.findUnique({
    where: { id: licenciaId },
    select: { maxAlumnos: true },
  });
  if (!licencia) return 0;

  const [ocupadas, invitadas] = await Promise.all([
    contarAlumnosDeLicencia(licenciaId),
    prisma.invitacionDocente.count({
      where: {
        rol: "ALUMNO",
        aceptadaAt: null,
        expiraAt: { gte: new Date() },
        clase: { licenciaDocenteId: licenciaId, archivada: false },
      },
    }),
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
export async function alumnoYaOcupaPlaza(licenciaId: string, alumnoId: string): Promise<boolean> {
  const matricula = await prisma.alumnoClase.findFirst({
    where: {
      alumnoId,
      activa: true,
      clase: { licenciaDocenteId: licenciaId, archivada: false },
    },
    select: { id: true },
  });
  return matricula !== null;
}
