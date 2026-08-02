import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PublicHeader } from "@/components/landing/public-header";
import { PublicFooter } from "@/components/landing/public-footer";
import { NovedadesLista } from "@/components/novedades/novedades-lista";
import { getNovedades } from "@/content/novedades";
import { getLocale } from "@/i18n/locale";
import { createClient } from "@/lib/supabase/server";

const EMAIL_SOPORTE = "annonianutri@gmail.com";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("novedades");
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
    alternates: { canonical: "/novedades" },
    openGraph: {
      title: t("metadata.ogTitle"),
      description: t("metadata.ogDescription"),
      url: "/novedades",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.ogTitle"),
    },
  };
}

export default async function NovedadesPage() {
  const t = await getTranslations("novedades");
  const locale = await getLocale();
  const novedades = getNovedades();

  // El canal de contacto depende de quién mira: un nutricionista con sesión
  // escribe por Soporte (dentro de la app); un visitante sin cuenta, por email.
  // Enlazar al dashboard desde una página pública lo dejaría en el login.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tieneSesion = !!user;

  const mailto = `mailto:${EMAIL_SOPORTE}?subject=${encodeURIComponent(t("feedback.asuntoEmail"))}`;

  return (
    <div className="min-h-screen bg-white dark:bg-[#101117] text-gray-900 dark:text-gray-100 overflow-x-hidden">
      <PublicHeader anchorBase="/landing" />

      {/* ─── CABECERA ─── */}
      <section className="pt-28 pb-10 sm:pt-32 sm:pb-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="inline-block text-green-800 dark:text-green-300 text-xs font-bold tracking-[0.18em] uppercase mb-4">
            {t("hero.eyebrow")}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            {t("hero.titulo")}
          </h1>
          <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            {t("hero.descripcion")}
          </p>
        </div>
      </section>

      {/* ─── LISTA DE NOVEDADES (la más reciente arriba) ─── */}
      <section className="pb-16 sm:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {novedades.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t("vacio")}</p>
          ) : (
            <NovedadesLista locale={locale} />
          )}
        </div>
      </section>

      {/* ─── FEEDBACK ─── */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-100 dark:border-gray-800 lg:hidden" />
          <div className="pt-10 lg:pt-8 lg:pb-8 lg:px-8 lg:rounded-2xl lg:bg-green-50/70 dark:lg:bg-green-950/25">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              {t("feedback.titulo")}
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
              {t("feedback.descripcion")}
            </p>

            {tieneSesion ? (
              <>
                <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
                  <Link
                    href="/mensajes?c=soporte"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {t("feedback.botonSoporte")}
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-1.5 px-2 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 transition-colors"
                  >
                    {t("feedback.volverPanel")}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {t("feedback.notaSoporte")}
                </p>
              </>
            ) : (
              <>
                <a
                  href={mailto}
                  className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20"
                >
                  <Mail className="w-4 h-4" />
                  {t("feedback.botonEmail")}
                </a>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {t("feedback.notaEmail")}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <PublicFooter anchorBase="/landing" />
    </div>
  );
}
