import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, FileText, Eye } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import { getTrabajoDeEntrega } from "@/app/actions/casos";
import { PlanVisual } from "@/components/paciente/plan-visual";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { Corregir } from "./corregir";

/**
 * #40 — El trabajo del alumno, para corregirlo.
 *
 * Solo lectura: el profesor ve el paciente y el plan tal y como los ha dejado, pero no puede
 * tocarlos — son de la cuenta del alumno.
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
        href={`/profesor/casos/${id}/entregas/${asignacionId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("entregas.titulo")}
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{trabajo.alumnoNombre}</h1>
        <p className="text-sm text-muted-foreground">
          {trabajo.casoNombre} · {trabajo.claseNombre} · {t(`entregas.estado.${trabajo.estado}`)}
          {trabajo.entregadaAt && <> · {formatDate(trabajo.entregadaAt, locale)}</>}
        </p>
      </div>

      <div className="flex gap-3 py-3 lg:p-3 lg:rounded-lg lg:bg-muted/50 border-b border-border lg:border-b-0">
        <Eye className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">{t("entregas.soloLectura")}</p>
      </div>

      {trabajo.paciente && (
        <section className="py-4 lg:p-5 lg:border lg:border-border lg:rounded-xl lg:bg-card">
          <h2 className="font-semibold inline-flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            {trabajo.paciente.nombre} {trabajo.paciente.apellidos}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
            {trabajo.paciente.peso != null && <span>{t("campos.peso")}: {trabajo.paciente.peso}</span>}
            {trabajo.paciente.altura != null && <span>{t("campos.altura")}: {trabajo.paciente.altura}</span>}
            <span>{t("campos.objetivo")}: {t(`objetivo.${trabajo.paciente.objetivo}`)}</span>
          </div>
        </section>
      )}

      {trabajo.planes.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t("entregas.sinPlanes")}</p>
      ) : (
        <section className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="w-4 h-4 text-muted-foreground" />
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

      <Corregir
        entregaId={trabajo.entregaId}
        nota={trabajo.nota}
        comentario={trabajo.comentario}
        visibleParaAlumno={trabajo.visibleParaAlumno}
        yaCorregida={trabajo.estado === "CORREGIDA"}
      />
    </div>
  );
}
