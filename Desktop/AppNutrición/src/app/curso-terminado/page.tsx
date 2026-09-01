import { redirect } from "next/navigation";
import { GraduationCap, Archive, Gift } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCurrentDietista } from "@/app/actions/auth";
import { marcarAvisoFinCursoVisto } from "@/app/actions/docencia";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";

export const dynamic = "force-dynamic";

/**
 * #39 — El aviso de que su año escolar ha terminado.
 *
 * No es una puerta cerrada: se le enseña UNA vez y entra a su cuenta como cualquier otro. Lo
 * primero que tiene que leer es que no se ha borrado nada y que la cuenta se le queda.
 *
 * OJO — lo de "gratis de por vida" es de esta época, cuando todo es gratis. Cuando haya pasarela
 * de pago hay que volver aquí y decidir qué pasa con el alumno que termina la carrera.
 */
export default async function CursoTerminadoPage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");
  // Quien no tiene el aviso pendiente no pinta nada aquí.
  if (!dietista.exAlumnoDesde || dietista.avisoFinCursoVisto) redirect("/dashboard");

  const t = await getTranslations("docencia");
  const locale = await getLocale();

  // La última clase por la que entró, para poder nombrarla.
  const ultima = await prisma.alumnoClase.findFirst({
    where: { alumnoId: dietista.id },
    orderBy: [{ activa: "desc" }, { altaAt: "desc" }],
    select: {
      clase: {
        select: {
          nombre: true, curso: true, fechaFinCurso: true,
          licenciaDocente: { select: { institucion: true } },
        },
      },
    },
  });
  const clase = ultima?.clase ?? null;

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

          <div className="flex gap-3 rounded-lg bg-primary/5 border border-primary/20 p-3">
            <Gift className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm">{t("cursoTerminado.laCuentaSeQueda")}</p>
          </div>

          <div className="flex gap-3 rounded-lg bg-muted/60 p-3">
            <Archive className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{t("cursoTerminado.nadaSeBorra")}</p>
          </div>

          <form action={marcarAvisoFinCursoVisto}>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t("cursoTerminado.entrar")}
            </button>
          </form>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-4">
          {t("cursoTerminado.siVuelves")}
        </p>
      </div>
    </div>
  );
}
