import type { Metadata } from "next";
import {
  Cookie, HelpCircle, ShieldCheck, Settings, Globe, RefreshCcw, Mail, Monitor,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return {
    title: t("cookies.metadata.title"),
    description: t("cookies.metadata.description"),
    alternates: { canonical: "/legal/cookies" },
  };
}

function Section({
  icon: Icon, title, id, children,
}: {
  icon: React.ElementType; title: string; id: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 pt-1">{title}</h2>
      </div>
      <div className="pl-12 space-y-3 text-gray-600 dark:text-gray-400 text-[15px] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function CookieCard({
  name, purpose, duration, type, typeLabel, durationPrefix,
}: {
  name: string; purpose: string; duration: string; type: "necesaria" | "preferencia" | "tercero";
  typeLabel: string; durationPrefix: string;
}) {
  const colors = {
    necesaria: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20",
    preferencia: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20",
    tercero: "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50",
  };
  const badges = {
    necesaria: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    preferencia: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    tercero: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[type]}`}>
      <div className="flex items-center justify-between mb-2">
        <code className="text-sm font-semibold text-gray-900 dark:text-gray-100">{name}</code>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badges[type]}`}>
          {typeLabel}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{purpose}</p>
      <p className="text-xs text-gray-400">{durationPrefix} {duration}</p>
    </div>
  );
}

export default async function CookiesPage() {
  const t = await getTranslations("legal");

  const TOC = [
    { id: "que-son", label: t("cookies.toc.queSon") },
    { id: "necesarias", label: t("cookies.toc.necesarias") },
    { id: "preferencias", label: t("cookies.toc.preferencias") },
    { id: "terceros", label: t("cookies.toc.terceros") },
    { id: "gestion", label: t("cookies.toc.gestion") },
    { id: "actualizaciones", label: t("cookies.toc.actualizaciones") },
    { id: "contacto", label: t("cookies.toc.contacto") },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium mb-4">
          <Cookie className="w-4 h-4" />
          {t("cookies.badge")}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t("cookies.titulo")}</h1>
        <p className="text-gray-400 text-sm">{t("cookies.ultimaActualizacion")}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* TOC sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{t("layout.tocLabel")}</p>
            <nav className="space-y-0.5">
              {TOC.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Quick summary card */}
            <div className="mt-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
              <p className="text-xs font-semibold text-green-800 dark:text-green-300 mb-2">{t("cookies.resumenRapido.titulo")}</p>
              <ul className="text-xs text-green-700 dark:text-green-400 space-y-1.5">
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5">&#10003;</span>
                  <span>{t("cookies.resumenRapido.soloCookiesNecesarias")}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5">&#10003;</span>
                  <span>{t("cookies.resumenRapido.sinTracking")}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5">&#10003;</span>
                  <span>{t("cookies.resumenRapido.gaConConsentimiento")}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="mt-0.5">&#10003;</span>
                  <span>{t("cookies.resumenRapido.gestionConsentimiento")}</span>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-10">
          <div className="bg-white dark:bg-[#17181e] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8 text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">
            <p>
              {t.rich("cookies.intro", {
                strong: (chunks) => <strong className="text-gray-900 dark:text-gray-100">{chunks}</strong>,
              })}
            </p>
          </div>

          <Section icon={HelpCircle} title={t("cookies.queSon.titulo")} id="que-son">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-sm">
                {t("cookies.queSon.contenido")}
              </p>
            </div>
          </Section>

          <Section icon={ShieldCheck} title={t("cookies.necesarias.titulo")} id="necesarias">
            <p>
              {t.rich("cookies.necesarias.descripcion", {
                strong: (chunks) => <strong className="text-gray-900 dark:text-gray-100">{chunks}</strong>,
              })}
            </p>
            <div className="space-y-3">
              <CookieCard
                name={t("cookies.necesarias.cookies.supabaseAuth.nombre")}
                purpose={t("cookies.necesarias.cookies.supabaseAuth.proposito")}
                duration={t("cookies.necesarias.cookies.supabaseAuth.duracion")}
                type="necesaria"
                typeLabel={t("cookies.tipoLabels.necesaria")}
                durationPrefix={t("cookies.duracionPrefix")}
              />
              <CookieCard
                name={t("cookies.necesarias.cookies.adminSession.nombre")}
                purpose={t("cookies.necesarias.cookies.adminSession.proposito")}
                duration={t("cookies.necesarias.cookies.adminSession.duracion")}
                type="necesaria"
                typeLabel={t("cookies.tipoLabels.necesaria")}
                durationPrefix={t("cookies.duracionPrefix")}
              />
              <CookieCard
                name={t("cookies.necesarias.cookies.pacienteSession.nombre")}
                purpose={t("cookies.necesarias.cookies.pacienteSession.proposito")}
                duration={t("cookies.necesarias.cookies.pacienteSession.duracion")}
                type="necesaria"
                typeLabel={t("cookies.tipoLabels.necesaria")}
                durationPrefix={t("cookies.duracionPrefix")}
              />
            </div>
          </Section>

          <Section icon={Settings} title={t("cookies.preferencias.titulo")} id="preferencias">
            <p>
              {t.rich("cookies.preferencias.descripcion", {
                code: (chunks) => <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">{chunks}</code>,
              })}
            </p>
            <div className="space-y-3">
              <CookieCard
                name={t("cookies.preferencias.cookies.theme.nombre")}
                purpose={t("cookies.preferencias.cookies.theme.proposito")}
                duration={t("cookies.preferencias.cookies.theme.duracion")}
                type="preferencia"
                typeLabel={t("cookies.tipoLabels.preferencia")}
                durationPrefix={t("cookies.duracionPrefix")}
              />
              <CookieCard
                name={t("cookies.preferencias.cookies.tours.nombre")}
                purpose={t("cookies.preferencias.cookies.tours.proposito")}
                duration={t("cookies.preferencias.cookies.tours.duracion")}
                type="preferencia"
                typeLabel={t("cookies.tipoLabels.preferencia")}
                durationPrefix={t("cookies.duracionPrefix")}
              />
              <CookieCard
                name={t("cookies.preferencias.cookies.welcome.nombre")}
                purpose={t("cookies.preferencias.cookies.welcome.proposito")}
                duration={t("cookies.preferencias.cookies.welcome.duracion")}
                type="preferencia"
                typeLabel={t("cookies.tipoLabels.preferencia")}
                durationPrefix={t("cookies.duracionPrefix")}
              />
              <CookieCard
                name={t("cookies.preferencias.cookies.consent.nombre")}
                purpose={t("cookies.preferencias.cookies.consent.proposito")}
                duration={t("cookies.preferencias.cookies.consent.duracion")}
                type="preferencia"
                typeLabel={t("cookies.tipoLabels.preferencia")}
                durationPrefix={t("cookies.duracionPrefix")}
              />
            </div>
          </Section>

          <Section icon={Globe} title={t("cookies.terceros.titulo")} id="terceros">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5 mb-4">
              <p className="text-sm text-green-800 dark:text-green-300 font-medium mb-1">
                {t("cookies.terceros.ga4Info")}
              </p>
              <p className="text-sm text-green-700 dark:text-green-400">
                {t("cookies.terceros.ga4Condicion")}
              </p>
            </div>
            <p>{t("cookies.terceros.descripcion")}</p>
            <div className="space-y-3">
              <CookieCard
                name={t("cookies.terceros.cookies.supabase.nombre")}
                purpose={t("cookies.terceros.cookies.supabase.proposito")}
                duration={t("cookies.terceros.cookies.supabase.duracion")}
                type="tercero"
                typeLabel={t("cookies.tipoLabels.tercero")}
                durationPrefix={t("cookies.duracionPrefix")}
              />
              <CookieCard
                name={t("cookies.terceros.cookies.stripe.nombre")}
                purpose={t("cookies.terceros.cookies.stripe.proposito")}
                duration={t("cookies.terceros.cookies.stripe.duracion")}
                type="tercero"
                typeLabel={t("cookies.tipoLabels.tercero")}
                durationPrefix={t("cookies.duracionPrefix")}
              />
              <CookieCard
                name={t("cookies.terceros.cookies.googleCalendar.nombre")}
                purpose={t("cookies.terceros.cookies.googleCalendar.proposito")}
                duration={t("cookies.terceros.cookies.googleCalendar.duracion")}
                type="tercero"
                typeLabel={t("cookies.tipoLabels.tercero")}
                durationPrefix={t("cookies.duracionPrefix")}
              />
              <CookieCard
                name={t("cookies.terceros.cookies.ga4.nombre")}
                purpose={t("cookies.terceros.cookies.ga4.proposito")}
                duration={t("cookies.terceros.cookies.ga4.duracion")}
                type="tercero"
                typeLabel={t("cookies.tipoLabels.tercero")}
                durationPrefix={t("cookies.duracionPrefix")}
              />
            </div>
          </Section>

          <Section icon={Monitor} title={t("cookies.gestion.titulo")} id="gestion">
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#17181e] rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">{t("cookies.gestion.banner.subtitulo")}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("cookies.gestion.banner.contenido")}
                </p>
              </div>

              <div className="bg-white dark:bg-[#17181e] rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3">{t("cookies.gestion.navegador.subtitulo")}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {t("cookies.gestion.navegador.contenido")}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "Chrome", href: "https://support.google.com/chrome/answer/95647" },
                    { name: "Firefox", href: "https://support.mozilla.org/es/kb/cookies-informacion-que-los-sitios-web-guardan-en-" },
                    { name: "Safari", href: "https://support.apple.com/es-es/guide/safari/sfri11471/mac" },
                    { name: "Edge", href: "https://support.microsoft.com/es-es/microsoft-edge/eliminar-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
                  ].map((browser) => (
                    <a
                      key={browser.name}
                      href={browser.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-green-50 dark:hover:bg-green-900/20 border border-gray-200 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800 transition-all text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400"
                    >
                      <Globe className="w-4 h-4" />
                      {browser.name}
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-400">
                {t("cookies.gestion.aviso")}
              </div>
            </div>
          </Section>

          <Section icon={RefreshCcw} title={t("cookies.actualizaciones.titulo")} id="actualizaciones">
            <p>
              {t("cookies.actualizaciones.contenido")}
            </p>
          </Section>

          <Section icon={Mail} title={t("cookies.contacto.titulo")} id="contacto">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5 text-center">
              <p className="text-sm text-green-800 dark:text-green-300">
                {t.rich("cookies.contacto.contenido", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
