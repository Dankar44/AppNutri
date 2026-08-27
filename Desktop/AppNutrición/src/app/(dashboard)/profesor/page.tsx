import { GraduationCap, Users, UserCog, CalendarRange, Briefcase, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireProfesor } from "@/app/actions/docencia";
import type { Metadata } from "next";
import { cursoActual } from "@/lib/docencia";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("docencia");
  return { title: t("panel.titulo") };
}

/** Contador de una bolsa de licencias: "47 de 300". */
function Contador({
  icono: Icono,
  etiqueta,
  usadas,
  total,
}: {
  icono: typeof Users;
  etiqueta: string;
  usadas: number;
  total: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((usadas / total) * 100)) : 0;
  return (
    <div className="py-4 lg:p-5 border-b border-border last:border-b-0 lg:border lg:rounded-2xl lg:bg-card">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icono strokeWidth={1.75} className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{etiqueta}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">
        {usadas}
        <span className="text-base font-normal text-muted-foreground"> / {total}</span>
      </p>
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function ProfesorPage() {
  const datos = await requireProfesor();
  const t = await getTranslations("docencia");
  const locale = await getLocale();

  const { licencia } = datos;
  const curso = licencia?.curso || cursoActual();

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap strokeWidth={1.75} className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{t("panel.titulo")}</h1>
            <p className="text-sm text-muted-foreground truncate">
              {licencia ? licencia.institucion : t("panel.sinInstitucion")}
            </p>
          </div>
        </div>
      </section>

      {!licencia && (
        <p className="text-sm text-muted-foreground">{t("panel.sinLicencia")}</p>
      )}

      {licencia && !datos.puedeDarAltas && (
        <div className="flex gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
          <AlertTriangle strokeWidth={1.75} className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">{t("panel.licenciaCerradaTitulo")}</p>
            <p className="text-amber-800/80 dark:text-amber-200/70 mt-0.5">{t("panel.licenciaCerradaTexto")}</p>
          </div>
        </div>
      )}

      {licencia && (
        <section className="lg:grid lg:grid-cols-3 lg:gap-5">
          <Contador
            icono={Users}
            etiqueta={t("panel.alumnos")}
            usadas={datos.alumnosDados}
            total={licencia.maxAlumnos}
          />
          <Contador
            icono={UserCog}
            etiqueta={t("panel.profesores")}
            usadas={datos.profesoresDados}
            total={licencia.maxProfesores}
          />
          <div className="py-4 lg:p-5 lg:border lg:rounded-2xl lg:bg-card">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarRange strokeWidth={1.75} className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{t("panel.curso")}</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">{curso}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {licencia.fechaFin
                ? t("panel.hasta", { fecha: formatDate(licencia.fechaFin, locale) })
                : t("panel.sinFechaFin")}
            </p>
          </div>
        </section>
      )}

      {/* Lo que queda por construir, dicho a las claras para que nadie busque un botón que aún
          no existe. Se irá sustituyendo por las secciones reales en las siguientes fases. */}
      <section className="rounded-xl border border-dashed border-border p-4 lg:p-5">
        <p className="text-sm font-medium mb-2">{t("panel.enPreparacionTitulo")}</p>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>{t("panel.enPreparacionClases")}</li>
          <li>{t("panel.enPreparacionCasos")}</li>
          <li>{t("panel.enPreparacionCorreccion")}</li>
        </ul>
      </section>

      <section className="pt-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          <Briefcase strokeWidth={1.75} className="w-4 h-4" />
          {t("panel.irACuentaProfesional")}
        </Link>
        <p className="text-xs text-muted-foreground mt-2">{t("panel.irACuentaProfesionalAyuda")}</p>
      </section>
    </div>
  );
}
