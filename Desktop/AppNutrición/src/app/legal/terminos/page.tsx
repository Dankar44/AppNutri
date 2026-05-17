import type { Metadata } from "next";
import {
  FileText, Building2, ShoppingCart, Scale, UserCheck, ShieldAlert,
  Copyright, Stethoscope, AlertTriangle, Lock, RefreshCcw, Gavel, Mail,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  return {
    title: t("terminos.metadata.title"),
    description: t("terminos.metadata.description"),
    alternates: { canonical: "/legal/terminos" },
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

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm space-y-1.5">
      {children}
    </div>
  );
}

export default async function TerminosPage() {
  const t = await getTranslations("legal");

  const TOC = [
    { id: "identificacion", label: t("terminos.toc.identificacion") },
    { id: "objeto", label: t("terminos.toc.objeto") },
    { id: "acceso", label: t("terminos.toc.acceso") },
    { id: "pagos", label: t("terminos.toc.pagos") },
    { id: "desistimiento", label: t("terminos.toc.desistimiento") },
    { id: "uso", label: t("terminos.toc.uso") },
    { id: "propiedad", label: t("terminos.toc.propiedad") },
    { id: "responsabilidad-sanitaria", label: t("terminos.toc.responsabilidadSanitaria") },
    { id: "limitacion", label: t("terminos.toc.limitacion") },
    { id: "datos", label: t("terminos.toc.datos") },
    { id: "modificaciones", label: t("terminos.toc.modificaciones") },
    { id: "jurisdiccion", label: t("terminos.toc.jurisdiccion") },
    { id: "contacto", label: t("terminos.toc.contacto") },
  ];

  const funcionalidades = [
    t("terminos.objeto.funcionalidades.0"),
    t("terminos.objeto.funcionalidades.1"),
    t("terminos.objeto.funcionalidades.2"),
    t("terminos.objeto.funcionalidades.3"),
    t("terminos.objeto.funcionalidades.4"),
    t("terminos.objeto.funcionalidades.5"),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm font-medium mb-4">
          <FileText className="w-4 h-4" />
          {t("terminos.badge")}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t("terminos.titulo")}</h1>
        <p className="text-gray-400 text-sm">{t("terminos.ultimaActualizacion")}</p>
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
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-10">
          <div className="bg-white dark:bg-[#17181e] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sm:p-8 text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">
            <p>
              {t.rich("terminos.intro.parrafo1", {
                strong: (chunks) => <strong className="text-gray-900 dark:text-gray-100">{chunks}</strong>,
              })}
            </p>
            <p>
              {t("terminos.intro.parrafo2")}
            </p>
          </div>

          <Section icon={Building2} title={t("terminos.identificacion.titulo")} id="identificacion">
            <InfoCard>
              <p><strong className="text-gray-900 dark:text-gray-100">{t("terminos.identificacion.denominacion")}</strong> {t("terminos.identificacion.denominacionValor")}</p>
              <p><strong className="text-gray-900 dark:text-gray-100">{t("terminos.identificacion.domicilio")}</strong> {t("terminos.identificacion.domicilioValor")}</p>
              <p><strong className="text-gray-900 dark:text-gray-100">{t("terminos.identificacion.cif")}</strong> {t("terminos.identificacion.cifValor")}</p>
              <p><strong className="text-gray-900 dark:text-gray-100">{t("terminos.identificacion.email")}</strong> {t("terminos.identificacion.emailValor")}</p>
              <p><strong className="text-gray-900 dark:text-gray-100">{t("terminos.identificacion.registro")}</strong> {t("terminos.identificacion.registroValor")}</p>
            </InfoCard>
            <p>
              {t("terminos.identificacion.lssice")}
            </p>
          </Section>

          <Section icon={ShoppingCart} title={t("terminos.objeto.titulo")} id="objeto">
            <p>
              {t("terminos.objeto.descripcion")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {funcionalidades.map((item) => (
                <div key={item} className="flex items-start gap-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 text-sm">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section icon={UserCheck} title={t("terminos.acceso.titulo")} id="acceso">
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-4">
                <p className="font-semibold text-green-800 dark:text-green-300 text-sm mb-1">{t("terminos.acceso.dietistas.subtitulo")}</p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  {t("terminos.acceso.dietistas.contenido")}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                <p className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-1">{t("terminos.acceso.pacientes.subtitulo")}</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {t("terminos.acceso.pacientes.contenido")}
                </p>
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
                <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm mb-1">{t("terminos.acceso.edadMinima.subtitulo")}</p>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {t("terminos.acceso.edadMinima.contenido")}
                </p>
              </div>
            </div>
          </Section>

          <Section icon={Scale} title={t("terminos.pagos.titulo")} id="pagos">
            <p>
              {t("terminos.pagos.descripcion")}
            </p>
            <ul className="list-disc list-inside space-y-1.5 marker:text-green-400">
              <li>{t("terminos.pagos.puntos.0")}</li>
              <li>{t("terminos.pagos.puntos.1")}</li>
              <li>{t("terminos.pagos.puntos.2")}</li>
              <li>{t("terminos.pagos.puntos.3")}</li>
            </ul>
          </Section>

          <Section icon={RefreshCcw} title={t("terminos.desistimiento.titulo")} id="desistimiento">
            <p>
              {t("terminos.desistimiento.contenido")}
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm">
              <p>{t.rich("terminos.desistimiento.contacto", {
                strong: (chunks) => <strong className="text-gray-900 dark:text-gray-100">{chunks}</strong>,
              })}</p>
            </div>
          </Section>

          <Section icon={ShieldAlert} title={t("terminos.uso.titulo")} id="uso">
            <p>{t("terminos.uso.descripcion")}</p>
            <ul className="list-disc list-inside space-y-1.5 marker:text-green-400">
              <li>{t("terminos.uso.puntos.0")}</li>
              <li>{t("terminos.uso.puntos.1")}</li>
              <li>{t("terminos.uso.puntos.2")}</li>
              <li>{t("terminos.uso.puntos.3")}</li>
              <li>{t("terminos.uso.puntos.4")}</li>
            </ul>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
              {t("terminos.uso.aviso")}
            </div>
          </Section>

          <Section icon={Copyright} title={t("terminos.propiedad.titulo")} id="propiedad">
            <p>
              {t("terminos.propiedad.contenido")}
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-700 dark:text-blue-400">
              {t.rich("terminos.propiedad.tuContenido", {
                strong: (chunks) => <strong className="dark:text-blue-300">{chunks}</strong>,
              })}
            </div>
          </Section>

          <Section icon={Stethoscope} title={t("terminos.responsabilidadSanitaria.titulo")} id="responsabilidad-sanitaria">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-400 space-y-2">
              <p>
                {t.rich("terminos.responsabilidadSanitaria.puntos.0", {
                  strong: (chunks) => <strong className="dark:text-amber-300">{chunks}</strong>,
                })}
              </p>
              <p>
                {t("terminos.responsabilidadSanitaria.puntos.1")}
              </p>
              <p>
                {t("terminos.responsabilidadSanitaria.puntos.2")}
              </p>
            </div>
          </Section>

          <Section icon={AlertTriangle} title={t("terminos.limitacion.titulo")} id="limitacion">
            <p>
              {t("terminos.limitacion.descripcion")}
            </p>
            <ul className="list-disc list-inside space-y-1.5 marker:text-gray-400">
              <li>{t("terminos.limitacion.puntos.0")}</li>
              <li>{t("terminos.limitacion.puntos.1")}</li>
            </ul>
          </Section>

          <Section icon={Lock} title={t("terminos.datos.titulo")} id="datos">
            <p>
              {t.rich("terminos.datos.contenido", {
                a: (chunks) => <a href="/legal/privacidad" className="text-green-600 dark:text-green-400 font-medium hover:underline">{chunks}</a>,
              })}
            </p>
          </Section>

          <Section icon={RefreshCcw} title={t("terminos.modificaciones.titulo")} id="modificaciones">
            <p>
              {t("terminos.modificaciones.contenido")}
            </p>
          </Section>

          <Section icon={Gavel} title={t("terminos.jurisdiccion.titulo")} id="jurisdiccion">
            <p>
              {t("terminos.jurisdiccion.contenido")}
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm">
              <p>
                {t.rich("terminos.jurisdiccion.odr", {
                  a: (chunks) => <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-green-600 dark:text-green-400 hover:underline">{chunks}</a>,
                })}
              </p>
            </div>
          </Section>

          <Section icon={Mail} title={t("terminos.contacto.titulo")} id="contacto">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 p-5 text-center">
              <p className="text-sm text-green-800 dark:text-green-300">
                {t.rich("terminos.contacto.contenido", {
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
