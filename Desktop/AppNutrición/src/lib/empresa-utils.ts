import { prisma } from "@/lib/prisma";

export function generarSlug(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function getCompanyMemberIds(
  dietistaId: string,
  empresaId: string | null,
): Promise<string[]> {
  if (!empresaId) return [dietistaId];
  const members = await prisma.dietista.findMany({
    where: { empresaId },
    select: { id: true },
  });
  return members.map((m) => m.id);
}

/**
 * #39 — Ids cuyo material COMPARTIDO ve esta persona, además del suyo.
 *
 * Dos formas de compartir con la misma mecánica, para no tener dos sistemas que se contradigan:
 *  - el centro, que ya existía: los del mismo `empresaId` se ven lo que marcan como compartido;
 *  - la clase: el alumno ve lo que su profesor marca como compartido, mientras el curso siga vivo.
 *
 * Lo que NO hace: el profesor no ve el material de sus alumnos por esta vía. Cada alumno trabaja
 * lo suyo, y lo que el profesor tiene que ver son las entregas, no su despensa.
 *
 * Un nutricionista normal sin centro no paga ninguna consulta extra por esto.
 */
export async function getMaterialMemberIds(dietista: {
  id: string;
  empresaId: string | null;
  rolDocente: string | null;
}): Promise<string[]> {
  const ids = await getCompanyMemberIds(dietista.id, dietista.empresaId);
  if (dietista.rolDocente !== "ALUMNO") return ids;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const matriculas = await prisma.alumnoClase.findMany({
    where: {
      alumnoId: dietista.id,
      activa: true,
      clase: {
        archivada: false,
        OR: [{ fechaFinCurso: null }, { fechaFinCurso: { gte: hoy } }],
      },
    },
    select: { clase: { select: { profesorId: true } } },
  });

  return [...new Set([...ids, ...matriculas.map((m) => m.clase.profesorId)])];
}

/**
 * ¿Esta persona tiene con quién compartir su material?
 *
 * Un nutricionista suelto no: el interruptor de "compartir" no le diría nada. Lo tienen los que
 * están en un centro (compañeros) y los profesores (sus alumnos).
 */
export async function puedeCompartirMaterial(dietista: {
  empresaId: string | null;
  rolDocente: string | null;
}): Promise<boolean> {
  return dietista.empresaId !== null || dietista.rolDocente === "PROFESOR";
}
