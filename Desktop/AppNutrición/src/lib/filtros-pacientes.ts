import type { Prisma } from "@/generated/prisma/client";

/**
 * #40 — Qué cuenta como paciente de verdad.
 *
 * Dos clases de paciente no lo son: el de ejemplo, que trae la aplicación para que se pueda
 * trastear sin miedo, y los que nacen de un caso de clase, que son personas inventadas por un
 * profesor para que sus alumnos practiquen.
 *
 * Está aquí, en un solo sitio, porque el filtro se repetía a mano en ocho ficheros: en cuanto uno
 * se queda atrás, las cifras que se usan para vender dejan de ser ciertas, y a un paciente
 * ficticio le empiezan a llegar recordatorios de cita.
 *
 * Lo que NO usa este filtro es la lista de pacientes del propio dietista: ahí sí se ven, con su
 * etiqueta, porque es donde el alumno trabaja sus casos.
 */
export const PACIENTES_REALES = { esDemo: false, esDeClase: false } as const;

/** Igual, para cuando se filtra por la relación (`{ paciente: ... }`). */
export const pacientesReales: Prisma.PacienteWhereInput = PACIENTES_REALES;
