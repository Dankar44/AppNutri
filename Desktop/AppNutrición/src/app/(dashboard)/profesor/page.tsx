import Link from "next/link";
import { GraduationCap, Users, UserCog, CalendarRange, AlertTriangle, Plus, ClipboardList } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import { getMisClases } from "@/app/actions/clases";
import { getMisCasos } from "@/app/actions/casos";
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
  href,
}: {
  icono: typeof Users;
  etiqueta: string;
  usadas: number;
  total: number;
  href?: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((usadas / total) * 100)) : 0;
  const clases =
    "block py-4 lg:px-6 lg:py-6 border-b border-border last:border-b-0 lg:border lg:rounded-2xl lg:bg-card transition-colors";
  const cuerpo = (
    <>
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
    </>
  );

  // El contador de alumnos lleva a sus clases; los otros dos no llevan a ningún sitio todavía.
  return href ? (
    <Link href={href} className={`${clases} lg:hover:border-primary/40`}>{cuerpo}</Link>
  ) : (
    <div className={clases}>{cuerpo}</div>
  );
}

export default async function ProfesorPage() {
  const datos = await requireProfesor();
  const t = await getTranslations("docencia");
  const locale = await getLocale();
  const [clases, casos] = await Promise.all([
    getMisClases().then((c) => c.length),
    getMisCasos().then((c) => c.length),
  ]);

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
        <div className="flex gap-3 py-4 lg:p-4 lg:rounded-xl lg:border lg:border-amber-200 dark:lg:border-amber-500/30 lg:bg-amber-50 dark:lg:bg-amber-500/10 border-b border-border lg:border-b-0">
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
            href="/profesor/clases"
          />
          <Contador
            icono={UserCog}
            etiqueta={t("panel.profesores")}
            usadas={datos.profesoresDados}
            total={licencia.maxProfesores}
          />
          <div className="py-4 lg:px-6 lg:py-6 lg:border lg:rounded-2xl lg:bg-card">
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

      {/* Por dónde se empieza. En móvil el menú está detrás de la hamburguesa, así que sin esto
          el profesor entra, ve unos contadores y no tiene ni un sitio al que ir. */}
      <section className="py-4 lg:px-6 lg:py-6 lg:border lg:border-border lg:rounded-2xl lg:bg-card">
        <h2 className="font-semibold">{t("panel.porDondeEmpezar")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {clases === 0 ? t("panel.sinClasesTexto") : t("panel.conClasesTexto", { n: clases })}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link
            href="/profesor/clases"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {clases === 0 ? <Plus className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            {clases === 0 ? t("panel.crearPrimeraClase") : t("panel.verMisClases")}
          </Link>
          {/* El segundo paso, en la misma pantalla: sin esto el profesor no encuentra los casos. */}
          <Link
            href="/profesor/casos"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            {casos === 0 ? t("panel.crearPrimerCaso") : t("panel.verMisCasos")}
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{t("panel.dosPasos")}</p>
      </section>

      {/* El paso a su consulta vive en el menú («Mi cuenta profesional»), que es donde se busca;
          aquí solo se recuerda que sigue ahí. */}
      <p className="text-xs text-muted-foreground pt-2">{t("panel.irACuentaProfesionalAyuda")}</p>
    </div>
  );
}
