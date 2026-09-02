import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock, Circle, Star, AlertTriangle, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import { getCaso, getEntregasDeAsignacion, getAsignacionesDeCaso } from "@/app/actions/casos";
import { FechaLimite } from "./fecha-limite";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";

/** #40 — Cómo va una clase con un caso: quién ha entregado, quién no, y qué nota tiene. */
export default async function EntregasPage({
  params,
}: {
  params: Promise<{ id: string; asignacionId: string }>;
}) {
  await requireProfesor();
  const { id, asignacionId } = await params;
  const [caso, entregas, asignaciones, t, locale] = await Promise.all([
    getCaso(id),
    getEntregasDeAsignacion(asignacionId),
    getAsignacionesDeCaso(id),
    getTranslations("casos"),
    getLocale(),
  ]);
  if (!caso) notFound();
  // De qué clase es esta pantalla: con el mismo caso puesto a tres clases, sin esto no se sabe.
  const asignacion = asignaciones.find((a) => a.id === asignacionId) ?? null;

  const iconos = {
    SIN_EMPEZAR: <Circle className="w-4 h-4 text-muted-foreground/50" />,
    EN_MARCHA: <Clock className="w-4 h-4 text-amber-500" />,
    ENTREGADA: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
    CORREGIDA: <Star className="w-4 h-4 text-primary" />,
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/profesor/casos/${id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {caso.nombre}
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold">
          {asignacion ? asignacion.claseNombre : t("entregas.titulo")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {caso.nombre}
          {asignacion?.fechaLimite && (
            <> · {t("asignar.fechaLimite")}: {formatDate(asignacion.fechaLimite, locale)}</>
          )}
        </p>
      </div>

      {asignacion && (
        <FechaLimite
          asignacionId={asignacion.id}
          valor={asignacion.fechaLimite ? asignacion.fechaLimite.toISOString().slice(0, 10) : ""}
        />
      )}

      {entregas.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">{t("entregas.sinAlumnos")}</p>
      ) : (
        <div className="divide-y divide-border lg:border lg:border-border lg:rounded-xl lg:overflow-hidden">
          {entregas.map((e) => {
            const puedeAbrirse = e.id !== "";
            const fila = (
              <>
                <span className="shrink-0">{iconos[e.estado]}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{e.alumnoNombre}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {t(`entregas.estado.${e.estado}`)}
                    {e.entregadaAt && <> · {formatDate(e.entregadaAt, locale)}</>}
                    {" · "}
                    {t("entregas.planes", { n: e.planes })}
                  </p>
                </div>
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
                href={`/profesor/casos/${id}/entregas/${asignacionId}/${e.id}`}
                className="flex items-center gap-3 py-3 lg:px-4 hover:bg-muted/40 transition-colors"
              >
                {fila}
              </Link>
            ) : (
              <div key={e.alumnoId} className="flex items-center gap-3 py-3 lg:px-4">
                {fila}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
