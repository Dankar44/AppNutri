import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, CalendarOff, CalendarClock, ClipboardList, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import { getClase, getProfesoresDeClase, getProfesoresQuePuedeAnadir } from "@/app/actions/clases";
import { getCasosDeClase } from "@/app/actions/casos";
import { formatDate } from "@/lib/utils";
import { cursoTerminado, diasDeCursoQueQuedan } from "@/lib/docencia";
import { getLocale } from "@/i18n/locale";
import { AccionesClase } from "./acciones-clase";
import { AltaAlumnos } from "./alta-alumnos";
import { ListaAlumnos } from "./lista-alumnos";
import { ProfesoresClase } from "./profesores-clase";
import { getPlazasLibres } from "@/app/actions/alumnos";

export default async function ClaseDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profesor = await requireProfesor();
  const { id } = await params;
  const clase = await getClase(id);
  if (!clase) notFound();

  const t = await getTranslations("docencia");
  const locale = await getLocale();
  const plazasLibres = await getPlazasLibres();
  const [profesores, candidatos, casos] = await Promise.all([
    getProfesoresDeClase(clase.id),
    getProfesoresQuePuedeAnadir(clase.id),
    getCasosDeClase(clase.id),
  ]);
  const terminado = cursoTerminado(clase.fechaFinCurso);
  // Avisar ANTES, no el día que sus alumnos se quedan fuera y le llaman por teléfono.
  const diasQueQuedan = diasDeCursoQueQuedan(clase.fechaFinCurso);
  const acabaPronto = !terminado && diasQueQuedan !== null && diasQueQuedan <= 30;

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
            {clase.fechaInicioCurso && clase.fechaFinCurso
              ? t("clases.delAl", { inicio: formatDate(clase.fechaInicioCurso, locale), fin: formatDate(clase.fechaFinCurso, locale) })
              : clase.fechaFinCurso
                ? t("clases.hasta", { fecha: formatDate(clase.fechaFinCurso, locale) })
                : t("clases.sinCurso")}
          </p>
        </div>
        <AccionesClase
          clase={{
            id: clase.id,
            nombre: clase.nombre,
            fechaInicioCurso: clase.fechaInicioCurso ? clase.fechaInicioCurso.toISOString().slice(0, 10) : null,
            fechaFinCurso: clase.fechaFinCurso ? clase.fechaFinCurso.toISOString().slice(0, 10) : null,
            archivada: clase.archivada,
            alumnosActivos: clase.alumnosActivos,
          }}
          soyElCreador={clase.profesorId === profesor.dietistaId}
        />
      </div>

      {clase.archivada && (
        <div className="flex gap-3 py-4 lg:p-4 lg:rounded-xl lg:border lg:border-amber-200 dark:lg:border-amber-500/30 lg:bg-amber-50 dark:lg:bg-amber-500/10 border-b border-border lg:border-b-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">{t("clases.archivadaTitulo")}</p>
            <p className="text-amber-800/80 dark:text-amber-200/70 mt-0.5">{t("clases.archivadaTexto")}</p>
          </div>
        </div>
      )}

      {acabaPronto && !clase.archivada && clase.alumnosActivos > 0 && (
        <div className="flex gap-3 py-4 lg:p-4 lg:rounded-xl lg:border lg:border-amber-200 dark:lg:border-amber-500/30 lg:bg-amber-50 dark:lg:bg-amber-500/10 border-b border-border lg:border-b-0">
          <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">
              {t("clases.acabaProntoTitulo", { dias: diasQueQuedan })}
            </p>
            <p className="text-amber-800/80 dark:text-amber-200/70 mt-0.5">
              {t("clases.acabaProntoTexto", { n: clase.alumnosActivos })}
            </p>
          </div>
        </div>
      )}

      {terminado && !clase.archivada && (
        <div className="flex gap-3 py-4 lg:p-4 lg:rounded-xl lg:border lg:border-border lg:bg-muted/50 border-b border-border lg:border-b-0">
          <CalendarOff className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">{t("clases.cursoTerminadoTitulo")}</p>
            <p className="text-muted-foreground mt-0.5">{t("clases.cursoTerminadoTexto")}</p>
          </div>
        </div>
      )}

      {!clase.archivada && (
        <AltaAlumnos
          claseId={clase.id}
          plazasLibres={plazasLibres}
          enlace={clase.enlaceInvitacion}
          enlaceAbierto={clase.invitacionAbierta && clase.enlaceInvitacion !== null}
          puedeDarAltas={profesor.puedeDarAltas}
          cursoTerminado={terminado}
          cupoActual={clase.cupoEnlace}
          cupoUsado={clase.cupoUsado}
        />
      )}

      {/* Los casos de esta clase. El nombre abre el paciente del caso, como uno más de la consulta;
          «Ver entregas» lleva a cómo va esta clase con él. */}
      <section className="py-4 lg:px-6 lg:py-6 lg:border lg:border-border lg:rounded-xl lg:bg-card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold inline-flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
            {t("clases.casosTitulo", { n: casos.length })}
          </h2>
          <Link href="/profesor/casos" className="text-sm font-medium text-primary hover:underline">
            {t("clases.irACasos")}
          </Link>
        </div>
        {casos.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">{t("clases.sinCasos")}</p>
        ) : (
          <div className="mt-3 divide-y divide-border">
            {casos.map((c) => (
              <div key={c.asignacionId} className="flex items-center gap-3 py-3">
                <Link
                  href={
                    c.pacienteId
                      ? `/pacientes/${c.pacienteId}?espacio=docente&desde=clase:${clase.id}`
                      : `/profesor/casos/${c.casoId}`
                  }
                  className="min-w-0 flex-1 group"
                >
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.pacienteNombre && <>{c.pacienteNombre} · </>}
                    {t("clases.casoProgreso", { entregadas: c.entregadas, alumnos: c.alumnos })}
                    {c.fechaLimite && <> · {t("clases.hasta", { fecha: formatDate(c.fechaLimite, locale) })}</>}
                  </p>
                </Link>
                <Link
                  href={`/profesor/casos/${c.casoId}?clase=${c.asignacionId}#clase-${c.asignacionId}`}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 shrink-0"
                >
                  {t("clases.verEntregas")}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {!clase.archivada && (
        <ProfesoresClase
          claseId={clase.id}
          profesores={profesores}
          candidatos={candidatos}
          yoId={profesor.dietistaId}
          soyElCreador={profesores.some((p) => p.id === profesor.dietistaId && p.esElCreador)}
          alumnos={clase.alumnosActivos}
        />
      )}

      <ListaAlumnos
        claseId={clase.id}
        claseArchivada={clase.archivada}
        alumnos={clase.alumnos.map((a) => ({
          id: a.id,
          nombre: a.nombre,
          apellidos: a.apellidos,
          email: a.email,
          activa: a.activa,
          // La fecha se formatea aquí: el componente de cliente no sabe de idiomas.
          ultimoAcceso: a.ultimoAcceso
            ? t("clases.ultimoAcceso", { fecha: formatDate(a.ultimoAcceso, locale) })
            : t("clases.nuncaHaEntrado"),
        }))}
      />
    </div>
  );
}
