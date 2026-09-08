import Link from "next/link";
import { CheckCircle2, Clock, Circle, Star, AlertTriangle, ChevronRight, FileText, Download } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { EntregaResumen } from "@/app/actions/casos";
import { formatDateTime } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { PublicarNotas } from "./publicar-notas";

const ICONOS = {
  SIN_EMPEZAR: <Circle className="w-4 h-4 text-muted-foreground/50" />,
  EN_MARCHA: <Clock className="w-4 h-4 text-amber-500" />,
  ENTREGADA: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  CORREGIDA: <Star className="w-4 h-4 text-primary" />,
};

/**
 * #40 — Los alumnos de una clase con el caso: quién no lo ha empezado, quién va por la mitad,
 * quién ha entregado y qué nota tiene. Cada fila lleva al trabajo del alumno.
 */
export async function ListaEntregas({
  casoId,
  asignacionId,
  entregas,
}: {
  casoId: string;
  asignacionId: string;
  entregas: EntregaResumen[];
}) {
  const [t, locale] = await Promise.all([getTranslations("casos"), getLocale()]);

  if (entregas.length === 0) {
    return <p className="text-sm text-muted-foreground py-3">{t("entregas.sinAlumnos")}</p>;
  }

  // Corregidas que el alumno todavía no puede ver: se publican todas de una vez.
  const sinPublicar = entregas.filter((e) => e.estado === "CORREGIDA" && !e.visibleParaAlumno).length;

  // Alguna nota puesta: hasta que no hay ninguna, descargar el acta no tiene sentido.
  const hayNotas = entregas.some((e) => e.nota != null);

  return (
    <div className="divide-y divide-border">
      {sinPublicar > 0 && <PublicarNotas asignacionId={asignacionId} cuantas={sinPublicar} />}
      {hayNotas && (
        <div className="flex justify-end py-2">
          {/* Un enlace normal, no fetch: así el navegador se encarga de la descarga y del nombre. */}
          <a
            href={`/api/asignaciones/${asignacionId}/notas`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {t("entregas.descargarNotas")}
          </a>
        </div>
      )}
      {entregas.map((e) => {
        // Sin entrega todavía no hay nada que abrir: el alumno ni ha empezado.
        const puedeAbrirse = e.id !== "";
        const fila = (
          <>
            <span className="shrink-0">{ICONOS[e.estado]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{e.alumnoNombre}</p>
              <p className="text-xs text-muted-foreground truncate">
                {t(`entregas.estado.${e.estado}`)}
                {e.entregadaAt && <> · {formatDateTime(e.entregadaAt, locale)}</>}
                {" · "}
                {t("entregas.planes", { n: e.planes })}
              </p>
            </div>
            {e.conPdf && (
              <span title={t("entregas.entregable")} className="text-primary shrink-0">
                <FileText className="w-4 h-4" />
              </span>
            )}
            {e.fuera && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                {t("entregas.yaNoEstaEnLaClase")}
              </span>
            )}
            {e.tarde && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 shrink-0">
                <AlertTriangle className="w-3 h-3" />
                {t("entregas.tarde")}
              </span>
            )}
            {e.nota !== null && (
              <span className="text-sm font-bold tabular-nums text-primary shrink-0">{e.nota}</span>
            )}
            {puedeAbrirse && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
          </>
        );

        return puedeAbrirse ? (
          <Link
            key={e.alumnoId}
            href={`/profesor/casos/${casoId}/entregas/${asignacionId}/${e.id}`}
            className="flex items-center gap-3 py-3 hover:bg-muted/40 transition-colors -mx-2 px-2 rounded-lg"
          >
            {fila}
          </Link>
        ) : (
          <div key={e.alumnoId} className="flex items-center gap-3 py-3">
            {fila}
          </div>
        );
      })}
    </div>
  );
}
