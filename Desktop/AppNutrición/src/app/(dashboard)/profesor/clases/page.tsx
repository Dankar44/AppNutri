import Link from "next/link";
import { Users, Archive, GraduationCap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import { getMisClases } from "@/app/actions/clases";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { CrearClaseBoton } from "./crear-clase-boton";

export default async function ClasesPage({
  searchParams,
}: {
  searchParams: Promise<{ archivadas?: string }>;
}) {
  const profesor = await requireProfesor();
  const { archivadas } = await searchParams;
  const verArchivadas = archivadas === "1";
  const clases = await getMisClases(verArchivadas);
  const t = await getTranslations("docencia");
  const locale = await getLocale();
  // Sin esto, quien archiva su única clase lee "todavía no tienes ninguna clase" y piensa que la
  // ha perdido. Solo se pregunta cuando la lista sale vacía.
  const hayArchivadas =
    clases.length === 0 && !verArchivadas ? (await getMisClases(true)).length > 0 : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("clases.titulo")}</h1>
          <p className="text-sm text-muted-foreground">
            {profesor.licencia?.institucion ?? t("panel.sinInstitucion")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Arriba, junto al título: abajo del todo no se ve, y es donde va a mirar quien ha
              archivado una clase y no la encuentra. */}
          <Link
            href={verArchivadas ? "/profesor/clases" : "/profesor/clases?archivadas=1"}
            className="text-sm text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            {verArchivadas ? t("clases.ocultarArchivadas") : t("clases.verArchivadas")}
          </Link>
          <CrearClaseBoton puedeCrear={profesor.puedeDarAltas} />
        </div>
      </div>

      {clases.length === 0 ? (
        <div className="text-center py-14">
          <GraduationCap strokeWidth={1.5} className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">
            {hayArchivadas ? t("clases.soloArchivadasTitulo") : t("clases.vaciaTitulo")}
          </p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            {hayArchivadas ? t("clases.soloArchivadasTexto") : t("clases.vaciaTexto")}
          </p>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-2 lg:gap-4 divide-y divide-border lg:divide-y-0">
          {clases.map((c) => (
            <Link
              key={c.id}
              href={`/profesor/clases/${c.id}`}
              className="block py-4 lg:py-0 lg:p-5 lg:border lg:border-border lg:rounded-2xl lg:bg-card hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold leading-tight truncate">{c.nombre}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.curso ?? t("clases.sinCurso")}
                    {c.fechaFinCurso && <> · {t("clases.hasta", { fecha: formatDate(c.fechaFinCurso, locale) })}</>}
                  </p>
                </div>
                {c.archivada && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                    <Archive className="w-3 h-3" />
                    {t("clases.archivada")}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span className="tabular-nums">{t("clases.alumnos", { n: c.alumnosActivos })}</span>
                </span>
                {c.alumnosRetirados > 0 && (
                  <span className="text-xs">{t("clases.retirados", { n: c.alumnosRetirados })}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}
