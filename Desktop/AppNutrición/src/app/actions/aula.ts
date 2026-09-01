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
import { getCurrentDietista } from "./auth";
import { inicioDeHoy } from "@/lib/docencia";

export interface ClaseDelAlumno {
  id: string;
  nombre: string;
  curso: string | null;
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
          id: true, nombre: true, curso: true, fechaFinCurso: true, archivada: true,
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
      curso: c.curso,
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
