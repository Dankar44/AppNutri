"use server";

/**
 * #39 (issue #31) — Módulo docente, lado del profesor.
 *
 * Un profesor tiene UNA sola cuenta con dos espacios: el docente (aquí) y el profesional de
 * siempre. Entra con su email y su contraseña de toda la vida y aterriza en el docente; el
 * botón «Acceder a mi cuenta profesional» le lleva al panel normal sin cerrar sesión.
 */

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { licenciaVigente } from "@/lib/docencia";
import { contarAlumnosDeLicencia } from "@/lib/docencia-bolsa";

export interface DatosProfesor {
  dietistaId: string;
  nombre: string;
  apellidos: string;
  licencia: {
    id: string;
    institucion: string;
    dominioEmail: string | null;
    maxProfesores: number;
    maxAlumnos: number;
    curso: string | null;
    fechaInicio: Date;
    fechaFin: Date | null;
    activa: boolean;
  } | null;
  /** Bolsa de licencias de alumno: cuántas se han repartido ya entre TODOS los profesores. */
  alumnosDados: number;
  profesoresDados: number;
  /** Si la licencia caducó o se desactivó: sigue entrando y viendo lo suyo, pero no da altas. */
  puedeDarAltas: boolean;
}

/** ¿La cuenta que ha iniciado sesión es de profesor? */
export async function esProfesor(): Promise<boolean> {
  // `getCurrentDietista` devuelve la fila entera y está cacheada por petición, así que el rol
  // sale de ahí: una consulta más aquí la pagaría cualquiera que abra la aplicación.
  const dietista = await getCurrentDietista();
  return dietista?.rolDocente === "PROFESOR";
}

/**
 * Datos del profesor que ha iniciado sesión, o null si esta cuenta no es de profesor.
 *
 * Sin `export` a propósito: en un fichero "use server" cada función exportada es un endpoint
 * invocable desde el navegador, y esta solo la usa `requireProfesor` aquí al lado. Se exportará
 * el día que la llame alguien de fuera.
 */
async function getDatosProfesor(): Promise<DatosProfesor | null> {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const ficha = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: {
      id: true, nombre: true, apellidos: true, rolDocente: true,
      licenciaDocente: {
        select: {
          id: true, institucion: true, dominioEmail: true, maxProfesores: true,
          maxAlumnos: true, curso: true, fechaInicio: true, fechaFin: true, activa: true,
        },
      },
    },
  });
  if (!ficha || ficha.rolDocente !== "PROFESOR") return null;

  const licencia = ficha.licenciaDocente;
  // La misma regla que la bolsa y que administración: alumnos DISTINTOS con el acceso puesto en
  // clases vivas. Contar la columna del alumno metía a los retirados y a los de clases archivadas,
  // así que tras cerrar un curso el panel seguía diciendo "300/300" mientras la clase decía que
  // había 300 plazas libres. Dos números distintos para lo mismo (auditoría 1 sep 2026).
  const [alumnosDados, profesoresDados] = licencia
    ? await Promise.all([
        contarAlumnosDeLicencia(licencia.id),
        prisma.dietista.count({ where: { licenciaDocenteId: licencia.id, rolDocente: "PROFESOR" } }),
      ])
    : [0, 0];

  return {
    dietistaId: ficha.id,
    nombre: ficha.nombre,
    apellidos: ficha.apellidos,
    licencia,
    alumnosDados,
    profesoresDados,
    puedeDarAltas: licenciaVigente(licencia),
  };
}

/** ¿Es alumno de alguna clase? Sale de la ficha que ya está en memoria: sin consulta extra. */
export async function esAlumno(): Promise<boolean> {
  const dietista = await getCurrentDietista();
  return dietista?.rolDocente === "ALUMNO";
}

/** Igual que `getDatosProfesor`, pero echa a quien no sea profesor. Para las páginas de /profesor. */
export async function requireProfesor(): Promise<DatosProfesor> {
  const datos = await getDatosProfesor();
  if (!datos) redirect("/dashboard");
  return datos;
}


/**
 * Da por visto el aviso de fin de curso y le manda a su cuenta. Lo llama el formulario de
 * `/curso-terminado`, que es lo único que hay ahí.
 */
export async function marcarAvisoFinCursoVisto(): Promise<void> {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");
  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { avisoFinCursoVisto: true },
  }).catch((e) => console.error("[docencia] No se pudo marcar el aviso como visto:", e));
  redirect("/dashboard");
}
