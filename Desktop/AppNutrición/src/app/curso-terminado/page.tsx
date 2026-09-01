import { redirect } from "next/navigation";
import { GraduationCap, Archive } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDietistaAunqueNoPuedaEntrar, signOut } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { alumnoPuedeEntrar } from "@/lib/docencia-acceso";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";

export const dynamic = "force-dynamic";

/**
 * #39 — Lo que ve un alumno cuando su curso ya ha terminado.
 *
 * Es una puerta cerrada, no un borrado: lo primero que tiene que leer es que su trabajo sigue ahí.
 * Quien todavía tiene el curso en marcha no debe poder ni asomarse a esta página, así que se
 * comprueba igual que en el panel y se le devuelve a su sitio.
 */
export default async function CursoTerminadoPage() {
  const dietista = await getDietistaAunqueNoPuedaEntrar();
  if (!dietista) redirect("/login");

  const { puede } = await alumnoPuedeEntrar(dietista);
  if (puede) redirect("/dashboard");

  const t = await getTranslations("docencia");
  const locale = await getLocale();

  // La última clase por la que entró, para poder decirle a quién dirigirse.
  const ultima = await prisma.alumnoClase.findFirst({
    where: { alumnoId: dietista.id },
    orderBy: [{ activa: "desc" }, { altaAt: "desc" }],
    select: {
      clase: {
        select: {
          nombre: true, curso: true, fechaFinCurso: true,
          profesor: { select: { nombre: true, apellidos: true, email: true } },
          licenciaDocente: { select: { institucion: true } },
        },
      },
    },
  });
  const clase = ultima?.clase ?? null;
  const profesor = clase ? `${clase.profesor.nombre} ${clase.profesor.apellidos}`.trim() : null;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap strokeWidth={1.75} className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t("cursoTerminado.titulo")}</h1>
          {clase && (
            <p className="text-muted-foreground mt-1">
              {clase.nombre}
              {clase.licenciaDocente?.institucion && ` · ${clase.licenciaDocente.institucion}`}
            </p>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="text-sm">
            {clase?.fechaFinCurso
              ? t("cursoTerminado.explicacionConFecha", { fecha: formatDate(clase.fechaFinCurso, locale) })
              : t("cursoTerminado.explicacion")}
          </p>

          <div className="flex gap-3 rounded-lg bg-muted/60 p-3">
            <Archive className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{t("cursoTerminado.nadaSeBorra")}</p>
          </div>

          <p className="text-sm text-muted-foreground">
            {profesor
              ? t("cursoTerminado.hablaConProfesor", { profesor })
              : t("cursoTerminado.hablaConTuCentro")}
          </p>

          <form action={signOut}>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t("cursoTerminado.cerrarSesion")}
            </button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          {t("cursoTerminado.escribenos")}
        </p>
      </div>
    </div>
  );
}
