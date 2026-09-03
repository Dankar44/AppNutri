import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Archive, ArrowRight, ClipboardList, ChevronRight, Users, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import {
  getCaso,
  getAsignacionesDeCaso,
  getClasesParaAsignar,
  getEntregasDeAsignacion,
  contarAlumnosQueEmpezaron,
} from "@/app/actions/casos";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { AccionesCaso } from "./acciones-caso";
import { AsignarAClase } from "./asignar-a-clase";
import { FechaLimite } from "./fecha-limite";
import { RetirarAsignacion } from "./retirar-asignacion";
import { ListaEntregas } from "./lista-entregas";
import { CompartirPlanes } from "./compartir-planes";

/**
 * #40 — La ficha del caso: qué se les pide, a qué clases está puesto y cómo va cada una, con sus
 * alumnos y sus entregas debajo. Todo lo del caso en una sola pantalla.
 *
 * El paciente NO se enseña aquí: se abre su ficha de siempre, que es donde el profesor lo rellena
 * (anamnesis, mediciones, alergias, horario, planificación, planes…) exactamente igual que con uno
 * de verdad.
 */
export default async function CasoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ clase?: string }>;
}) {
  await requireProfesor();
  const { id } = await params;
  const { clase: claseAbierta } = await searchParams;
  const caso = await getCaso(id);
  if (!caso) notFound();

  const [asignaciones, clases, t, locale] = await Promise.all([
    getAsignacionesDeCaso(id),
    getClasesParaAsignar(id),
    getTranslations("casos"),
    getLocale(),
  ]);
  const entregasPorClase = await Promise.all(asignaciones.map((a) => getEntregasDeAsignacion(a.id)));
  const empezados = await contarAlumnosQueEmpezaron(id);

  return (
    <div className="space-y-6">
      <Link
        href="/profesor/casos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("acciones.volver")}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">{caso.nombre}</h1>
          {caso.pacienteNombre && (
            <p className="text-sm text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {caso.pacienteNombre}
            </p>
          )}
        </div>
        <AccionesCaso casoId={caso.id} archivado={caso.archivado} />
      </div>

      {caso.archivado && (
        <div className="flex gap-3 py-4 lg:p-4 lg:rounded-xl lg:border lg:border-border lg:bg-muted/50 border-b border-border lg:border-b-0">
          <Archive className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{t("acciones.archivarTexto")}</p>
        </div>
      )}

      {/* La puerta al paciente, la primera: es donde está el trabajo de verdad del profesor. */}
      {caso.pacienteId && (
        <Link
          href={`/pacientes/${caso.pacienteId}?espacio=docente`}
          className="block py-4 lg:px-6 lg:py-6 lg:rounded-xl lg:border lg:border-primary/30 lg:bg-primary/5 border-b border-border lg:border-b hover:lg:border-primary/60 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User strokeWidth={1.75} className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold group-hover:text-primary transition-colors">
                {t("paciente.abrirFicha", { nombre: caso.pacienteNombre })}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{t("paciente.abrirFichaAyuda")}</p>
              {empezados > 0 && (
                <p className="text-sm mt-1.5 inline-flex items-start gap-1.5 text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t("paciente.yaEmpezado", { n: empezados })}</span>
                </p>
              )}
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
          </div>
        </Link>
      )}

      {caso.pacienteId && (
        <section className="py-4 lg:px-6 lg:py-5 lg:border lg:border-border lg:rounded-xl lg:bg-card">
          <CompartirPlanes casoId={caso.id} valor={caso.compartirPlanes} />
        </section>
      )}

      <section className="py-4 lg:px-6 lg:py-6 lg:border lg:border-border lg:rounded-xl lg:bg-card">
        <h2 className="font-semibold inline-flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-muted-foreground" />
          {t("campos.consigna")}
        </h2>
        {caso.consigna ? (
          <p className="text-sm whitespace-pre-wrap mt-2">{caso.consigna}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            {t("paciente.sinConsigna")}{" "}
            <Link href={`/profesor/casos/${caso.id}/editar`} className="text-primary hover:underline">
              {t("acciones.editar")}
            </Link>
          </p>
        )}
      </section>

      {/* Las clases: cada una con su plazo, su progreso y sus alumnos debajo. */}
      <section className="py-4 lg:px-6 lg:py-6 lg:border lg:border-border lg:rounded-xl lg:bg-card">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold">{t("asignar.titulo", { n: asignaciones.length })}</h2>
          {!caso.archivado && <AsignarAClase casoId={caso.id} clases={clases} />}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t("asignar.explicacion")}</p>

        {asignaciones.length > 0 && (
          <div className="mt-4 space-y-3">
            {asignaciones.map((a, i) => {
              const fecha = a.fechaLimite ? t("asignar.hasta", { fecha: formatDate(a.fechaLimite, locale) }) : t("asignar.sinFechaLimite");
              // Con una sola clase se ve todo del tirón; con varias, se despliega la que se pida.
              const abierta = asignaciones.length === 1 || claseAbierta === a.id;
              return (
                <details
                  key={a.id}
                  id={`clase-${a.id}`}
                  open={abierta}
                  className="group border-b border-border lg:border lg:border-border lg:rounded-xl"
                >
                  <summary className="list-none cursor-pointer flex items-center gap-3 py-3 lg:px-4 [&::-webkit-details-marker]:hidden">
                    <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{a.claseNombre}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {t("asignar.progreso", { entregadas: a.entregadas + a.corregidas, alumnos: a.alumnos })}
                        </span>
                        {a.corregidas > 0 && <> · {t("asignar.corregidas", { n: a.corregidas })}</>}
                        {" · "}
                        {fecha}
                      </p>
                    </div>
                  </summary>
                  <div className="lg:px-4 pb-3 lg:border-t lg:border-border">
                    <div className="flex items-center justify-between gap-3 flex-wrap py-2">
                      <FechaLimite
                        asignacionId={a.id}
                        valor={a.fechaLimite ? a.fechaLimite.toISOString().slice(0, 10) : ""}
                        etiqueta={
                          a.fechaLimite
                            ? `${t("asignar.fechaLimite")}: ${formatDate(a.fechaLimite, locale)}`
                            : t("asignar.ponerFecha")
                        }
                      />
                      <RetirarAsignacion asignacionId={a.id} />
                    </div>
                    <ListaEntregas casoId={caso.id} asignacionId={a.id} entregas={entregasPorClase[i]} />
                  </div>
                </details>
              );
            })}
          </div>
        )}

        {clases.length === 0 && asignaciones.length === 0 && (
          <p className="text-sm text-muted-foreground mt-3">
            {t("asignar.sinClases")}{" "}
            <Link href="/profesor/clases" className="text-primary hover:underline">
              {t("asignar.irAClases")}
            </Link>
          </p>
        )}
        {clases.length === 0 && asignaciones.length > 0 && !caso.archivado && (
          <p className="text-xs text-muted-foreground mt-3">{t("asignar.todasAsignadas")}</p>
        )}
      </section>
    </div>
  );
}
