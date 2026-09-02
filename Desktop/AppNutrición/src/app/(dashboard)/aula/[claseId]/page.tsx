import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users, CalendarRange, ClipboardList } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCurrentDietista } from "@/app/actions/auth";
import { getMisClasesComoAlumno, getMisCasosDelAula } from "@/app/actions/aula";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { diasDeCursoQueQuedan } from "@/lib/docencia";
import { CasosDelAlumno, type CasoParaAlumno } from "../casos-del-alumno";

/**
 * #40 — Una clase del alumno, por dentro: sus casos con la fecha de entrega.
 *
 * Los casos no se ven sueltos en el aula sino aquí, dentro de su clase (Guillermo, 2 sep 2026):
 * "que tengas que entrar a la clase y dentro lo veas".
 */
export default async function ClaseDelAlumnoPage({ params }: { params: Promise<{ claseId: string }> }) {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");
  const { claseId } = await params;

  const [clases, casosCrudos, t, tAula, locale] = await Promise.all([
    getMisClasesComoAlumno(),
    getMisCasosDelAula(),
    getTranslations("aula"),
    getTranslations("aula"),
    getLocale(),
  ]);
  const clase = clases.find((c) => c.id === claseId);
  if (!clase) notFound();

  const casos: CasoParaAlumno[] = casosCrudos
    .filter((c) => c.claseId === claseId)
    .map((c) => {
      const dias = diasDeCursoQueQuedan(c.fechaLimite);
      const sinEntregar = c.estado === "SIN_EMPEZAR" || c.estado === "EN_MARCHA";
      return {
        asignacionId: c.asignacionId,
        casoNombre: c.casoNombre,
        consigna: c.consigna,
        pacienteDelCaso: c.pacienteDelCaso,
        claseNombre: c.claseNombre,
        estado: c.estado,
        pacienteId: c.pacienteId,
        nota: c.nota,
        comentario: c.comentario,
        fechaLimite: c.fechaLimite ? formatDate(c.fechaLimite, locale) : null,
        fueraDePlazo: sinEntregar && dias !== null && dias < 0,
        diasQueQuedan: dias,
        entregaId: c.entregaId,
        entregadaEl: c.entregadaAt ? formatDateTime(c.entregadaAt, locale) : null,
        entregableNombre: c.entregableNombre,
        entregablePlanNombre: c.entregablePlanNombre,
        planes: c.planes,
      };
    });

  return (
    <div className="space-y-6">
      <Link
        href="/aula"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("volverAlAula")}
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{clase.nombre}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {[clase.institucion, clase.curso].filter(Boolean).join(" · ")}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-4 h-4 shrink-0" />
            {clase.profesores.map((p) => p.nombre).join(", ")}
          </span>
          {clase.fechaFinCurso && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange className="w-4 h-4 shrink-0" />
              {t("hasta", { fecha: formatDate(clase.fechaFinCurso, locale) })}
            </span>
          )}
        </div>
      </div>

      {casos.length === 0 ? (
        <div className="text-center py-14">
          <ClipboardList strokeWidth={1.5} className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">{tAula("casos.sinCasosTitulo")}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{tAula("casos.sinCasosTexto")}</p>
        </div>
      ) : (
        <CasosDelAlumno casos={casos} />
      )}
    </div>
  );
}
