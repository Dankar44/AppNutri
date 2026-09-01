import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users, Archive, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import { getClase } from "@/app/actions/clases";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { AccionesClase } from "./acciones-clase";

export default async function ClaseDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfesor();
  const { id } = await params;
  const clase = await getClase(id);
  if (!clase) notFound();

  const t = await getTranslations("docencia");
  const locale = await getLocale();

  return (
    <div className="space-y-6">
      <Link
        href="/profesor/clases"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("clases.volver")}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">{clase.nombre}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {clase.curso ?? t("clases.sinCurso")}
            {clase.fechaFinCurso && <> · {t("clases.hasta", { fecha: formatDate(clase.fechaFinCurso, locale) })}</>}
          </p>
        </div>
        <AccionesClase
          clase={{
            id: clase.id,
            nombre: clase.nombre,
            curso: clase.curso,
            fechaFinCurso: clase.fechaFinCurso ? clase.fechaFinCurso.toISOString().slice(0, 10) : null,
            archivada: clase.archivada,
          }}
        />
      </div>

      {clase.archivada && (
        <div className="flex gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">{t("clases.archivadaTitulo")}</p>
            <p className="text-amber-800/80 dark:text-amber-200/70 mt-0.5">{t("clases.archivadaTexto")}</p>
          </div>
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">
          {t("clases.alumnosTitulo", { n: clase.alumnosActivos })}
        </h2>

        {clase.alumnos.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border rounded-xl">
            <Users strokeWidth={1.5} className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium">{t("clases.sinAlumnosTitulo")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("clases.sinAlumnosTexto")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border lg:border lg:border-border lg:rounded-xl lg:overflow-hidden">
            {clase.alumnos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-3 lg:px-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {a.nombre} {a.apellidos}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {a.email}
                    {" · "}
                    {a.ultimoAcceso
                      ? t("clases.ultimoAcceso", { fecha: formatDate(a.ultimoAcceso, locale) })
                      : t("clases.nuncaHaEntrado")}
                  </p>
                </div>
                {!a.activa && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                    <Archive className="w-3 h-3" />
                    {t("clases.accesoRetirado")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
