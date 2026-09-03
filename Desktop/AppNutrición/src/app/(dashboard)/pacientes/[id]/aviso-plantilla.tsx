import Link from "next/link";
import { ClipboardList, ArrowRight, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { AsignacionResumen } from "@/app/actions/casos";
import { AsignarAClase } from "@/app/(dashboard)/profesor/casos/[id]/asignar-a-clase";
import { CompartirPlanes } from "@/app/(dashboard)/profesor/casos/[id]/compartir-planes";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";

/**
 * #40 — Encima de la ficha del paciente plantilla: el profesor tiene que saber que lo que rellena
 * aquí es lo que se van a encontrar sus alumnos, tener a un clic la vuelta al caso, y poder
 * asignarlo a una clase con su fecha límite sin salir de la ficha (Guillermo, 2 sep 2026).
 */
export async function AvisoPlantilla({
  caso,
  asignaciones,
  clases,
}: {
  caso: { id: string; nombre: string; consigna: string | null; compartirPlanes: boolean; empezados: number };
  asignaciones: AsignacionResumen[];
  clases: { id: string; nombre: string; curso: string | null }[];
}) {
  const [t, locale] = await Promise.all([getTranslations("casos"), getLocale()]);
  const enClases = asignaciones
    .map((a) =>
      a.fechaLimite
        ? `${a.claseNombre} (${t("asignar.hasta", { fecha: formatDate(a.fechaLimite, locale) })})`
        : a.claseNombre,
    )
    .join(", ");

  return (
    <section className="mb-6 py-4 lg:px-6 lg:py-5 lg:rounded-xl lg:border lg:border-primary/30 lg:bg-primary/5 border-b border-border lg:border-b">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary inline-flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            {t("paciente.avisoTitulo", { caso: caso.nombre })}
          </p>
          <p className="text-sm mt-1">{t("paciente.avisoTexto")}</p>
          {/* La copia se hace al empezar el caso: a quien ya lo empezó no le llegan los cambios. */}
          {/* Los cambios les llegan solos (ver sincronizarCopiaSiHaceFalta): solo se dice cuántos son. */}
          {caso.empezados > 0 && (
            <p className="text-xs text-muted-foreground mt-2">{t("paciente.yaEmpezado", { n: caso.empezados })}</p>
          )}
          {caso.consigna && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
              <span className="font-medium text-foreground">{t("campos.consigna")}: </span>
              {caso.consigna}
            </p>
          )}
        </div>
        <Link
          href={`/profesor/casos/${caso.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
        >
          {t("paciente.verCaso")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Si la planificación y el plan que haga aquí son su solución o se los da hechos. */}
      <div className="mt-4 pt-3 border-t border-primary/20">
        <CompartirPlanes casoId={caso.id} valor={caso.compartirPlanes} compacto />
      </div>

      {/* A qué clases está puesto, y el botón para ponerlo a otra, aquí mismo. */}
      <div className="mt-3 pt-3 border-t border-primary/20 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground inline-flex items-start gap-1.5 min-w-0">
          <Users className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <span className="font-medium text-foreground">{t("asignar.titulo", { n: asignaciones.length })}</span>
            {enClases && <>: {enClases}</>}
          </span>
        </p>
        {clases.length > 0 ? (
          <AsignarAClase casoId={caso.id} clases={clases} destacado={asignaciones.length === 0} />
        ) : (
          <span className="text-xs text-muted-foreground">
            {asignaciones.length > 0 ? t("asignar.todasAsignadas") : t("asignar.sinClases")}
          </span>
        )}
      </div>
    </section>
  );
}
