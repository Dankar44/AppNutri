"use client";

import Link from "next/link";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Novedad } from "@/content/novedades";
import type { Locale } from "@/i18n/config";

/**
 * Aviso de novedad destacada. No decide si debe verse: eso lo hace
 * `BannersDashboard`, que es quien conoce también el banner de beta y evita que
 * se apilen dos franjas.
 */
export function NovedadesBanner({
  novedad,
  locale,
  onCerrar,
}: {
  novedad: Novedad;
  locale: Locale;
  onCerrar: () => void;
}) {
  const t = useTranslations("novedades");

  return (
    <div className="mt-14 lg:mt-0 bg-green-50 dark:bg-green-500/10 border-b border-green-200 dark:border-green-500/20 px-4 py-3">
      <div className="flex items-start gap-3 max-w-screen-xl mx-auto">
        <Sparkles className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-green-900 dark:text-green-200">
            <span className="font-semibold">{t("banner.etiqueta")}</span>{" "}
            {novedad.titulo[locale]}{" "}
            <Link
              href="/novedades"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onCerrar}
              className="font-semibold underline underline-offset-2 hover:text-green-700 dark:hover:text-green-100 inline-flex items-center gap-1 whitespace-nowrap"
            >
              {t("banner.enlace")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
        <button
          onClick={onCerrar}
          className="p-1 rounded-md hover:bg-green-200/50 dark:hover:bg-green-500/20 text-green-700 dark:text-green-300 shrink-0"
          aria-label={t("banner.cerrarAriaLabel")}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
