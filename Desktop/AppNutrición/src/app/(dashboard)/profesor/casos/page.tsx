import Link from "next/link";
import { ClipboardList, Plus, Users, CheckCircle2, Clock, Archive } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { requireProfesor } from "@/app/actions/docencia";
import { getMisCasos } from "@/app/actions/casos";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("casos");
  return { title: t("titulo") };
}

/** #40 — Los casos del profesor: sus pacientes inventados, listos para asignar. */
export default async function CasosPage({
  searchParams,
}: {
  searchParams: Promise<{ archivados?: string }>;
}) {
  await requireProfesor();
  const { archivados } = await searchParams;
  const verArchivados = archivados === "1";
  const casos = await getMisCasos(verArchivados);
  const t = await getTranslations("casos");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t("titulo")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitulo", { n: casos.length })}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={verArchivados ? "/profesor/casos" : "/profesor/casos?archivados=1"}
            className="text-sm text-muted-foreground hover:text-foreground whitespace-nowrap"
          >
            {verArchivados ? t("acciones.ocultarArchivados") : t("acciones.verArchivados")}
          </Link>
          <Link
            href="/profesor/casos/nuevo"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("nuevo")}
          </Link>
        </div>
      </div>

      {casos.length === 0 ? (
        <div className="text-center py-14">
          <ClipboardList strokeWidth={1.5} className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium">{t("vaciaTitulo")}</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{t("vaciaTexto")}</p>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-2 lg:gap-4 divide-y divide-border lg:divide-y-0">
          {casos.map((c) => (
            <Link
              key={c.id}
              href={`/profesor/casos/${c.id}`}
              className="block py-4 lg:px-6 lg:py-6 lg:border lg:border-border lg:rounded-2xl lg:bg-card hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold leading-tight truncate">{c.nombre}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {t("tarjeta.paciente", { nombre: c.pacienteNombre })}
                  </p>
                </div>
                {c.archivado && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                    <Archive className="w-3 h-3" />
                    {t("tarjeta.archivado")}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {t("tarjeta.clases", { n: c.clases })}
                </span>
                {c.entregadas > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {t("tarjeta.entregadas", { n: c.entregadas })}
                  </span>
                )}
                {c.pendientes > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {t("tarjeta.pendientes", { n: c.pendientes })}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
