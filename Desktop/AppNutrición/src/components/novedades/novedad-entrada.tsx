import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { Novedad } from "@/content/novedades";
import type { Locale } from "@/i18n/config";
import { intlTag } from "@/i18n/config";

type NovedadEntradaProps = {
  novedad: Novedad;
  locale: Locale;
  /** Marca "Nuevo" (solo dentro de la app: la pública no sabe quién mira). */
  esNueva?: boolean;
};

/**
 * Una entrada del changelog. La usan la página pública (/novedades) y la de
 * dentro del dashboard, para que el contenido se vea igual en las dos y no
 * haya que tocar dos markups cada vez.
 *
 * En móvil no hay caja: la tarjeta (borde, fondo, esquinas) entra en `lg:`.
 */
export function NovedadEntrada({ novedad, locale, esNueva }: NovedadEntradaProps) {
  const t = useTranslations("novedades");

  const fecha = new Intl.DateTimeFormat(intlTag(locale), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC", // la fecha es un día, no un instante: sin TZ se iría al anterior
  }).format(new Date(novedad.fecha));

  return (
    <article
      id={novedad.id}
      className="scroll-mt-24 py-7 lg:py-8 lg:px-8 lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <time
          dateTime={novedad.fecha}
          className={cn(
            "text-xs font-bold tracking-[0.18em] uppercase",
            "text-green-800 dark:text-green-300",
          )}
        >
          {fecha}
        </time>
        {esNueva && (
          <span className="inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
            {t("entrada.nuevo")}
          </span>
        )}
      </div>

      <h2 className="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight">
        {novedad.titulo[locale]}
      </h2>
      <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
        {novedad.descripcion[locale]}
      </p>

      {/* Dónde está: descrito en texto. Sin enlaces, para que sirva igual en la
          página pública (un visitante sin cuenta acabaría en el login). */}
      <div className="mt-5 lg:rounded-xl lg:bg-green-50/70 dark:lg:bg-green-950/25 lg:p-4">
        <p className="flex items-center gap-1.5 text-green-800 dark:text-green-300 text-[11px] font-bold tracking-[0.14em] uppercase">
          <Compass className="w-3.5 h-3.5" />
          {t("entrada.donde")}
        </p>
        <p className="mt-1.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {novedad.donde[locale]}
        </p>
      </div>
    </article>
  );
}
