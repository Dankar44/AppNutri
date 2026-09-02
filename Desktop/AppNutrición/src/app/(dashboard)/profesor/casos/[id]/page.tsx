import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Archive } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import { getCaso, getAsignacionesDeCaso, getClasesParaAsignar } from "@/app/actions/casos";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { AccionesCaso } from "./acciones-caso";
import { Asignaciones } from "./asignaciones";

/** #40 — La ficha del caso: qué pide, a quién ficticio, y a qué clases está puesto. */
export default async function CasoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfesor();
  const { id } = await params;
  const caso = await getCaso(id);
  if (!caso) notFound();

  const [asignaciones, clases, t, locale] = await Promise.all([
    getAsignacionesDeCaso(id),
    getClasesParaAsignar(id),
    getTranslations("casos"),
    getLocale(),
  ]);

  // Las fechas se formatean aquí: los componentes de cliente no saben de idiomas.
  const fechas = Object.fromEntries(
    asignaciones.map((a) => [a.id, a.fechaLimite ? formatDate(a.fechaLimite, locale) : ""]),
  );

  const listas: [string, string[]][] = [
    [t("campos.patologias"), caso.patologias],
    [t("campos.alergias"), caso.alergias],
    [t("campos.intolerancias"), caso.intolerancias],
    [t("campos.medicamentos"), caso.medicamentos],
    [t("campos.suplementos"), caso.suplementos],
    [t("campos.preferencias"), caso.preferencias],
  ];

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
          <p className="text-sm text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {caso.pacienteNombre} {caso.pacienteApellidos}
          </p>
        </div>
        <AccionesCaso casoId={caso.id} archivado={caso.archivado} />
      </div>

      {caso.archivado && (
        <div className="flex gap-3 py-4 lg:p-4 lg:rounded-xl lg:border lg:border-border lg:bg-muted/50 border-b border-border lg:border-b-0">
          <Archive className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{t("acciones.archivarTexto")}</p>
        </div>
      )}

      {caso.consigna && (
        <section className="py-4 lg:p-5 lg:border lg:border-border lg:rounded-xl lg:bg-card">
          <h2 className="font-semibold mb-2">{t("campos.consigna")}</h2>
          <p className="text-sm whitespace-pre-wrap">{caso.consigna}</p>
        </section>
      )}

      <Asignaciones casoId={caso.id} asignaciones={asignaciones} clases={clases} fechas={fechas} />

      <section className="py-4 lg:p-5 lg:border lg:border-border lg:rounded-xl lg:bg-card space-y-3">
        <h2 className="font-semibold">{t("secciones.elPaciente")}</h2>
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {caso.sexo && (
            <div className="flex justify-between gap-3 border-b border-border pb-1.5">
              <dt className="text-muted-foreground">{t("campos.sexo")}</dt>
              <dd>{t(`sexo.${caso.sexo}`)}</dd>
            </div>
          )}
          {caso.fechaNacimiento && (
            <div className="flex justify-between gap-3 border-b border-border pb-1.5">
              <dt className="text-muted-foreground">{t("campos.fechaNacimiento")}</dt>
              <dd>{formatDate(caso.fechaNacimiento, locale)}</dd>
            </div>
          )}
          {caso.peso != null && (
            <div className="flex justify-between gap-3 border-b border-border pb-1.5">
              <dt className="text-muted-foreground">{t("campos.peso")}</dt>
              <dd className="tabular-nums">{caso.peso}</dd>
            </div>
          )}
          {caso.altura != null && (
            <div className="flex justify-between gap-3 border-b border-border pb-1.5">
              <dt className="text-muted-foreground">{t("campos.altura")}</dt>
              <dd className="tabular-nums">{caso.altura}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-b border-border pb-1.5">
            <dt className="text-muted-foreground">{t("campos.objetivo")}</dt>
            <dd>{t(`objetivo.${caso.objetivo}`)}</dd>
          </div>
          {caso.nivelActividad && (
            <div className="flex justify-between gap-3 border-b border-border pb-1.5">
              <dt className="text-muted-foreground">{t("campos.nivelActividad")}</dt>
              <dd className="text-right">{caso.nivelActividad}</dd>
            </div>
          )}
        </dl>

        {listas.some(([, v]) => v.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 pt-1">
            {listas.filter(([, v]) => v.length > 0).map(([label, valores]) => (
              <div key={label}>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-sm">{valores.join(", ")}</p>
              </div>
            ))}
          </div>
        )}

        {caso.notas && (
          <div className="pt-1">
            <p className="text-xs font-medium text-muted-foreground">{t("campos.notas")}</p>
            <p className="text-sm whitespace-pre-wrap mt-0.5">{caso.notas}</p>
          </div>
        )}
      </section>
    </div>
  );
}
