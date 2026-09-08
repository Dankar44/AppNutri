import { NextResponse, type NextRequest } from "next/server";
import { getCurrentDietista } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { asignacionQuePuedoCorregir } from "@/lib/docencia";
import { getTranslations } from "next-intl/server";

/**
 * Las notas de una clase en un caso, para pasarlas al acta.
 *
 * Sale en CSV porque es lo que abre Excel de todos, con `;` de separador y BOM: sin eso, Excel en
 * español mete toda la fila en una sola columna y se come los acentos. Se listan TODOS los alumnos
 * de la clase, también los que no han entregado, porque un acta necesita la lista entera.
 *
 * Lo puede pedir quien puede corregir: el autor del caso y los profesores que llevan la clase.
 */

/** Una celda de CSV: comillas si lleva separador, comillas o saltos de línea. */
function celda(valor: string | number | null | undefined): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Aquí no vale `requireProfesor`: hace un redirect, que en una descarga no sirve de nada.
  const dietista = await getCurrentDietista();
  if (!dietista || dietista.rolDocente !== "PROFESOR") return new NextResponse(null, { status: 401 });

  const { id } = await params;
  const t = await getTranslations("casos.notasCsv");

  const asignacion = await prisma.asignacionCaso.findFirst({
    where: { id, ...asignacionQuePuedoCorregir(dietista.id, dietista.licenciaDocenteId ?? null) },
    select: {
      fechaLimite: true,
      caso: { select: { nombre: true } },
      clase: {
        select: {
          nombre: true,
          alumnos: {
            where: { activa: true },
            select: { alumno: { select: { id: true, nombre: true, apellidos: true, email: true } } },
          },
        },
      },
      entregas: {
        select: {
          alumnoId: true, estado: true, entregadaAt: true, nota: true,
          comentario: true, visibleParaAlumno: true,
        },
      },
    },
  });
  if (!asignacion) return new NextResponse(null, { status: 404 });

  const porAlumno = new Map(asignacion.entregas.map((e) => [e.alumnoId, e]));
  const filas = asignacion.clase.alumnos
    .map((m) => m.alumno)
    .sort((a, b) => `${a.apellidos} ${a.nombre}`.localeCompare(`${b.apellidos} ${b.nombre}`, "es"))
    .map((alumno) => {
      const e = porAlumno.get(alumno.id);
      // Quien no ha abierto el caso no tiene fila de entrega: para el acta cuenta como sin empezar.
      const estado = e?.estado ?? "SIN_EMPEZAR";
      return [
        celda(alumno.apellidos),
        celda(alumno.nombre),
        celda(alumno.email),
        celda(t(`estado.${estado}`)),
        celda(e?.entregadaAt ? e.entregadaAt.toLocaleDateString("es-ES") : ""),
        // La coma decimal es la que entiende Excel en español.
        celda(e?.nota != null ? String(e.nota).replace(".", ",") : ""),
        celda(e?.nota != null ? t(e.visibleParaAlumno ? "si" : "no") : ""),
        celda(e?.comentario ?? ""),
      ].join(";");
    });

  const cabecera = [
    t("apellidos"), t("nombre"), t("correo"), t("estadoCol"),
    t("fechaEntrega"), t("nota"), t("publicada"), t("comentario"),
  ].map(celda).join(";");

  // \r\n y BOM: lo que Excel espera. Sin el BOM, «José» sale como «JosÃ©».
  const csv = "﻿" + [cabecera, ...filas].join("\r\n") + "\r\n";
  const nombre = `${t("fichero")}-${asignacion.caso.nombre}-${asignacion.clase.nombre}`
    .replace(/[^\w.\-áéíóúÁÉÍÓÚñÑ ]/g, "_").slice(0, 120);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
