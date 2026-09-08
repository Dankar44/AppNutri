"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Comparativa, FilaComparativa } from "@/lib/comparativa-clase";

type Columna = "alumno" | "objetivoKcal" | "planKcal" | "desvio" | "nota";

/**
 * La tabla de la comparativa. Ordenable porque con veinte alumnos lo que se busca cambia: unas
 * veces es "quién no ha entregado" y otras "quién se ha ido más de madre".
 *
 * No califica: solo señala. La nota la sigue poniendo el profesor.
 */
export function TablaComparativa({ comparativa }: { comparativa: Comparativa }) {
  const t = useTranslations("casos.comparativa");
  const tc = useTranslations("casos.entregas");
  const [orden, setOrden] = useState<Columna>("alumno");
  const [asc, setAsc] = useState(true);

  const filas = useMemo(() => {
    const copia = [...comparativa.filas];
    copia.sort((a, b) => {
      if (orden === "alumno") return a.alumno.localeCompare(b.alumno, "es");
      // Quien no ha entregado no tiene número: siempre al final, se ordene como se ordene.
      const va = a[orden], vb = b[orden];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      return orden === "desvio" ? Math.abs(vb as number) - Math.abs(va as number) : (vb as number) - (va as number);
    });
    return asc ? copia : copia.reverse();
  }, [comparativa.filas, orden, asc]);

  function ordenarPor(c: Columna) {
    if (c === orden) { setAsc((v) => !v); return; }
    setOrden(c);
    setAsc(true);
  }

  const th = "px-3 py-2 text-left text-xs font-medium text-muted-foreground whitespace-nowrap";
  const td = "px-3 py-2.5 text-sm whitespace-nowrap";
  const Cabecera = ({ col, texto }: { col: Columna; texto: string }) => (
    <th className={th}>
      <button type="button" onClick={() => ordenarPor(col)} className="inline-flex items-center gap-1 hover:text-foreground">
        {texto}
        <ArrowUpDown className={cn("w-3 h-3", orden === col ? "text-foreground" : "opacity-40")} />
      </button>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[720px] w-full">
        <thead className="border-b border-border">
          <tr>
            <Cabecera col="alumno" texto={t("alumno")} />
            <th className={th}>{t("estado")}</th>
            <Cabecera col="objetivoKcal" texto={t("suObjetivo")} />
            <Cabecera col="planKcal" texto={t("suPlan")} />
            <Cabecera col="desvio" texto={t("desvio")} />
            <th className={th}>{t("reparto")}</th>
            <Cabecera col="nota" texto={t("nota")} />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {/* Lo del profesor va arriba y con su color: es contra lo que quiere leer la clase, no
              una fila más de la lista (Guillermo, 8 sep 2026). */}
          {comparativa.referencia && (
            <Fila f={comparativa.referencia} td={td} tc={tc} referencia />
          )}
          {filas.map((f) => <Fila key={f.alumnoId} f={f} td={td} tc={tc} />)}
        </tbody>
        {comparativa.medianaKcal != null && (
          <tfoot className="border-t-2 border-border">
            {/* La mediana es la referencia para ver quién se sale, y por eso va pegada a la tabla. */}
            <tr className="text-muted-foreground italic">
              <td className={td} colSpan={3}>{t("medianaClase")}</td>
              <td className={`${td} tabular-nums`}>{comparativa.medianaKcal} kcal</td>
              <td className={td} colSpan={3} />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

function Fila({ f, td, tc, referencia = false }: {
  f: FilaComparativa;
  td: string;
  tc: (k: string) => string;
  /** La del profesor: se distingue del resto y no se marca en rojo, que no se corrige a sí mismo. */
  referencia?: boolean;
}) {
  const t = useTranslations("casos.comparativa");
  // Más de un 20% arriba o abajo de su propio objetivo: eso ya no es matizar, es otra dieta.
  const seVa = !referencia && f.desvio != null && Math.abs(f.desvio) > 20;
  return (
    <tr className={cn(
      f.planKcal == null && !referencia && "text-muted-foreground",
      referencia && "bg-primary/5",
    )}>
      <td className={`${td} font-medium`}>
        {f.alumno}
        {referencia && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
            {t("tuyo")}
          </span>
        )}
      </td>
      <td className={`${td} text-xs`}>{referencia ? t("tuCaso") : tc(`estado.${f.estado}`)}</td>
      <td className={`${td} tabular-nums`}>{f.objetivoKcal ? `${f.objetivoKcal} kcal` : "—"}</td>
      <td className={`${td} tabular-nums`}>{f.planKcal ? `${f.planKcal} kcal` : "—"}</td>
      <td className={cn(td, "tabular-nums", seVa && "text-red-600 dark:text-red-400 font-semibold")}>
        {f.desvio == null ? "—" : `${f.desvio > 0 ? "+" : ""}${f.desvio}%`}
      </td>
      <td className={`${td} tabular-nums text-xs`}>
        {f.reparto ? `${f.reparto.proteinas}/${f.reparto.carbohidratos}/${f.reparto.grasas}` : "—"}
      </td>
      <td className={`${td} tabular-nums`}>{f.nota != null ? String(f.nota).replace(".", ",") : "—"}</td>
    </tr>
  );
}
