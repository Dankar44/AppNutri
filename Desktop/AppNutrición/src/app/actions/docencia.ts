"use server";

/**
 * #39 (issue #31) — Módulo docente, lado del profesor.
 *
 * Un profesor tiene UNA sola cuenta con dos espacios: el docente (aquí) y el profesional de
 * siempre. Entra con su email y su contraseña de toda la vida y aterriza en el docente; el
 * botón «Acceder a mi cuenta profesional» le lleva al panel normal sin cerrar sesión.
 */

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { ESPACIO_COOKIE, licenciaVigente, type EspacioActivo } from "@/lib/docencia";

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

/**
 * ¿La cuenta que ha iniciado sesión es de profesor? Consulta mínima (solo el rol), pensada
 * para el aterrizaje del panel, que se ejecuta en cada carga.
 */
export async function esProfesor(): Promise<boolean> {
  const dietista = await getCurrentDietista();
  if (!dietista) return false;
  const ficha = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { rolDocente: true },
  });
  return ficha?.rolDocente === "PROFESOR";
}

/** Datos del profesor que ha iniciado sesión, o null si esta cuenta no es de profesor. */
export async function getDatosProfesor(): Promise<DatosProfesor | null> {
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
  const [alumnosDados, profesoresDados] = licencia
    ? await Promise.all([
        prisma.dietista.count({ where: { licenciaDocenteId: licencia.id, rolDocente: "ALUMNO" } }),
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

/** Igual que `getDatosProfesor`, pero echa a quien no sea profesor. Para las páginas de /profesor. */
export async function requireProfesor(): Promise<DatosProfesor> {
  const datos = await getDatosProfesor();
  if (!datos) redirect("/dashboard");
  return datos;
}

/** ¿En qué espacio está trabajando? Por defecto, el docente: es la razón de tener el rol. */
export async function getEspacioActivo(): Promise<EspacioActivo> {
  const store = await cookies();
  return store.get(ESPACIO_COOKIE)?.value === "profesional" ? "profesional" : "docente";
}

/**
 * A dónde mandar a alguien recién identificado: el profesor entra por su espacio docente.
 *
 * Se decide AQUÍ, en el login, y no dejándolo solo en la redirección de /dashboard: cuando el
 * panel ya ha empezado a enviarse al navegador, Next no puede devolver una redirección de
 * verdad y la resuelve con un <meta refresh>, así que el profesor vería el panel de
 * nutricionista durante un segundo antes de saltar. Comprobado el 27 ago 2026.
 */
export async function destinoTrasEntrar(): Promise<string> {
  if (await getEspacioActivo() === "profesional") return "/dashboard";
  return (await esProfesor()) ? "/profesor" : "/dashboard";
}

/**
 * Pasa al panel de nutricionista de siempre. La cookie es de SESIÓN: al volver a entrar otro
 * día, el profesor aterriza de nuevo en su espacio docente. Para el camino de vuelta hay un
 * enlace en el menú lateral (/api/espacio?a=docente).
 */
export async function entrarEspacioProfesional() {
  const store = await cookies();
  store.set(ESPACIO_COOKIE, "profesional", { path: "/", httpOnly: true, sameSite: "lax" });
  redirect("/dashboard");
}
