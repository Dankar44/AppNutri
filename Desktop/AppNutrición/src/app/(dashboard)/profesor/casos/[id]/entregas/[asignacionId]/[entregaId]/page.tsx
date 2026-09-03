import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, FileText, Eye, AlertTriangle, MessageSquareText, GitCompareArrows, Download, Camera } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import { getTrabajoDeEntrega } from "@/app/actions/casos";
import { PlanVisual } from "@/components/paciente/plan-visual";
import { formatDateTime } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { Corregir } from "./corregir";
import { PlanificacionDelAlumno } from "./planificacion-del-alumno";

/**
 * #40 — El trabajo del alumno, para corregirlo.
 *
 * Solo lectura, y una vez entregado es la FOTO de la entrega: el paciente, su planificación, sus
 * planes y el PDF del entregable tal y como los mandó. Lo que toque después no cambia esto salvo
 * que vuelva a entregar (Guillermo, 2 sep 2026). Mientras no ha entregado se ve en vivo, avisando.
 */
export default async function EntregaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; asignacionId: string; entregaId: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  await requireProfesor();
  const { id, asignacionId, entregaId } = await params;
  const { plan } = await searchParams;
  const [trabajo, t, locale] = await Promise.all([
    getTrabajoDeEntrega(entregaId, plan),
    getTranslations("casos"),
    getLocale(),
  ]);
  if (!trabajo) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/profesor/casos/${id}?clase=${asignacionId}#clase-${asignacionId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {trabajo.casoNombre}
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{trabajo.alumnoNombre}</h1>
        <p className="text-sm text-muted-foreground">
          {trabajo.casoNombre} · {trabajo.claseNombre} · {t(`entregas.estado.${trabajo.estado}`)}
        </p>
      </div>

      <div className="flex gap-3 py-3 lg:p-3 lg:rounded-lg lg:bg-muted/50 border-b border-border lg:border-b-0">
        {trabajo.congelado ? <Camera className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" /> : <Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
        <p className="text-xs text-muted-foreground">
          {trabajo.congelado && trabajo.entregadaAt
            ? t("entregas.fotoFija", { fecha: formatDateTime(trabajo.entregadaAt, locale) })
            : t("entregas.soloLectura")}
        </p>
      </div>

      {/* El entregable: el PDF tal y como lo mandó. Es lo que más le interesa al profesor. */}
      {(trabajo.estado === "ENTREGADA" || trabajo.estado === "CORREGIDA") && (
        <section className="py-4 lg:px-6 lg:py-5 lg:border lg:border-border lg:rounded-xl lg:bg-card flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="font-semibold inline-flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {t("entregas.entregable")}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {trabajo.entregable
                ? t("entregas.entregableDe", {
                    plan: trabajo.entregable.planNombre ?? trabajo.entregable.nombre,
                    tamano: trabajo.entregable.bytes ? `${Math.max(1, Math.round(trabajo.entregable.bytes / 1024))} KB` : "",
                  })
                : t("entregas.sinEntregable")}
            </p>
          </div>
          {trabajo.entregable && (
            <a
              href={`/api/entregas/${trabajo.entregaId}/pdf`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 shrink-0"
            >
              <Download className="w-4 h-4" />
              {t("entregas.abrirPdf")}
            </a>
          )}
        </section>
      )}

      {trabajo.notaAlumno && (
        <section className="py-4 lg:px-6 lg:py-6 lg:border lg:border-primary/30 lg:rounded-xl lg:bg-primary/5 border-b border-border lg:border-b">
          <h2 className="font-semibold inline-flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-primary" />
            {t("entregas.notaDelAlumno")}
          </h2>
          <p className="text-sm whitespace-pre-wrap mt-2">{trabajo.notaAlumno}</p>
        </section>
      )}

      {trabajo.paciente && (
        <section className="py-4 lg:px-6 lg:py-6 lg:border lg:border-border lg:rounded-xl lg:bg-card">
          <h2 className="font-semibold inline-flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            {trabajo.paciente.nombre} {trabajo.paciente.apellidos}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
            {trabajo.paciente.peso != null && <span>{t("campos.peso")}: {trabajo.paciente.peso}</span>}
            {trabajo.paciente.altura != null && <span>{t("campos.altura")}: {trabajo.paciente.altura}</span>}
            <span>{t("campos.objetivo")}: {t(`objetivo.${trabajo.paciente.objetivo}`)}</span>
          </div>
          {/* Lo que el alumno ha escrito en la ficha: si la consigna pedía razonar algo, está aquí. */}
          {trabajo.paciente.patologias.length > 0 && (
            <p className="text-sm mt-2">
              <span className="text-muted-foreground">{t("campos.patologias")}: </span>
              {trabajo.paciente.patologias.join(", ")}
            </p>
          )}
          {trabajo.paciente.notas && (
            <div className="mt-3">
              <p className="text-xs font-medium text-muted-foreground">{t("campos.notas")}</p>
              <p className="text-sm whitespace-pre-wrap mt-0.5">{trabajo.paciente.notas}</p>
            </div>
          )}
        </section>
      )}

      {trabajo.paciente && (
        <PlanificacionDelAlumno
          paciente={trabajo.paciente}
          planificaciones={trabajo.planificaciones}
          medidas={trabajo.medidas}
          fichaInformacion={trabajo.fichaInformacion}
        />
      )}

      {trabajo.planes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t("entregas.sinPlanes")}</p>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="w-4 h-4 text-muted-foreground" />
            {/* Su solución, en otra pestaña, para tenerla al lado mientras corrige. */}
            {trabajo.casoPacienteId && (
              <a
                href={`/pacientes/${trabajo.casoPacienteId}?pestana=plan-alimentacion&espacio=docente`}
                target="_blank"
                rel="noopener"
                className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline order-last"
              >
                <GitCompareArrows className="w-4 h-4" />
                {t("compartir.compararConTuPlan")}
              </a>
            )}
            {trabajo.planes.map((p) => {
              const activo = trabajo.planVisto?.id === p.id;
              return (
                <Link
                  key={p.id}
                  href={`/profesor/casos/${id}/entregas/${asignacionId}/${entregaId}?plan=${p.id}`}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.nombre}
                </Link>
              );
            })}
          </div>

          {trabajo.planVisto && (
            <div className="lg:border lg:border-border lg:rounded-xl lg:bg-card lg:p-5">
              {/* Las mismas opciones que el enlace público: se ve el plan, no se toca. */}
              <PlanVisual
                plan={trabajo.planVisto}
                pacienteId=""
                pacienteNombre={trabajo.paciente ? `${trabajo.paciente.nombre} ${trabajo.paciente.apellidos}` : ""}
                showPlanSelector={false}
                showPdfButton={false}
                showAsignarButton={false}
                showNuevaDietaButton={false}
                showAguaEjercicio={false}
                showFoodTable={false}
                readOnly
                interactionMode="shared"
              />
            </div>
          )}
        </section>
      )}

      {trabajo.estado !== "ENTREGADA" && trabajo.estado !== "CORREGIDA" && (
        <div className="flex gap-3 py-3 lg:p-4 lg:rounded-xl lg:border lg:border-amber-200 dark:lg:border-amber-500/30 lg:bg-amber-50 dark:lg:bg-amber-500/10 border-b border-border lg:border-b">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 dark:text-amber-200">{t("entregas.todaviaNoEntregada")}</p>
        </div>
      )}

      <Corregir
        entregaId={trabajo.entregaId}
        puedeCorregirse={trabajo.estado === "ENTREGADA" || trabajo.estado === "CORREGIDA"}
        nota={trabajo.nota}
        comentario={trabajo.comentario}
        visibleParaAlumno={trabajo.visibleParaAlumno}
        yaCorregida={trabajo.estado === "CORREGIDA"}
      />
    </div>
  );
}
