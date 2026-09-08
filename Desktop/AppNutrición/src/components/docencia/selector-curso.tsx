"use client";

import { useMemo } from "react";
import { cursosParaElegir } from "@/lib/docencia";

/**
 * Elegir el curso escolar, del 1 de septiembre al 31 de agosto.
 *
 * Un desplegable y no dos fechas sueltas: lo que se vende es un curso entero, y a mano salían
 * licencias que empezaban un martes cualquiera, o con las dos fechas de cursos distintos. Aquí no
 * se puede escribir nada raro (Guillermo, 8 sep 2026).
 */
export function SelectorCurso({
  value,
  onChange,
  id,
}: {
  /** El año en que empieza el curso: 2026 es «2026/27». */
  value: number;
  onChange: (anio: number) => void;
  id?: string;
}) {
  // El de ahora y los tres siguientes: se vende con antelación, pero no a cinco años vista.
  const cursos = useMemo(() => cursosParaElegir(), []);

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      {cursos.map((c) => (
        <option key={c.anio} value={c.anio}>
          {c.etiqueta}
        </option>
      ))}
    </select>
  );
}
