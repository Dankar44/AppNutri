import type { Metadata } from "next";
import { Check } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { getOrganizationJsonLd, getSoftwareApplicationJsonLd } from "@/lib/structured-data";
import {
  SeoHeader,
  SeoHero,
  SeoFooter,
  SeoFaqList,
  SeoExplorar,
  SeoCtaFinal,
  SectionTitle,
  CtaButtons,
  Highlight,
  getBreadcrumbJsonLd,
} from "@/components/seo/seo-shell";

export const metadata: Metadata = {
  title: { absolute: "Alternativa gratuita a Dietowin — Annonia" },
  description:
    "Annonia es una alternativa gratuita y 100% online a Dietowin para nutricionistas: gestiona pacientes, crea planes con IA y haz seguimiento desde el navegador, sin instalar nada y sin licencia.",
  alternates: { canonical: "/alternativa-a-dietowin" },
  openGraph: {
    title: "Alternativa gratuita a Dietowin — Annonia",
    description: "Software de nutrición gratis y online, sin instalación ni licencia.",
    type: "website",
    locale: "es_ES",
    siteName: "Annonia",
    url: "/alternativa-a-dietowin",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Annonia" }],
  },
};

const COMPARATIVA: { campo: string; annonia: string; otro: string }[] = [
  { campo: "Precio", annonia: "Gratis (fase de lanzamiento)", otro: "De pago (licencia)" },
  { campo: "Funciona en", annonia: "Navegador, sin instalar", otro: "Se instala en el ordenador" },
  { campo: "Para empezar", annonia: "Creas la cuenta y listo (1 min)", otro: "Licencia + instalación" },
  { campo: "Planes con IA", annonia: "Sí, plan semanal completo en minutos", otro: "Cálculo automatizado propio" },
  { campo: "Portal del paciente", annonia: "Sí (email + PIN, sin registro)", otro: "App móvil" },
];

const VENTAJAS = [
  "Gratis durante la fase de lanzamiento en España",
  "100% web: sin instalar ni mantener nada",
  "Planes nutricionales personalizados con IA",
  "Portal para el paciente (email + PIN, sin que se registre)",
  "Datos en servidores de la UE y cumplimiento del RGPD",
];

const FAQ = [
  {
    q: "¿Annonia es una alternativa gratuita a Dietowin?",
    a: "Sí. Annonia es un software de gestión nutricional gratuito durante su fase de lanzamiento en España, con gestión de pacientes, planes personalizados con IA, seguimiento y portal del paciente. A diferencia de las soluciones de pago con licencia, puedes empezar sin coste.",
  },
  {
    q: "¿Tengo que instalar Annonia en el ordenador?",
    a: "No. Annonia funciona en el navegador (web app) desde el ordenador, la tablet o el móvil, sin instalación ni actualizaciones que gestionar.",
  },
  {
    q: "¿Puedo crear planes personalizados como en un software profesional?",
    a: "Sí. Annonia genera planes nutricionales personalizados con ayuda de inteligencia artificial a partir de los datos del paciente, y puedes ajustarlos a mano alimento por alimento.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function AlternativaDietowinPage() {
  return (
    <div className="min-h-dvh bg-white dark:bg-[#101117]">
      <JsonLd data={getOrganizationJsonLd()} />
      <JsonLd data={getSoftwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={getBreadcrumbJsonLd("Alternativa a Dietowin", "/alternativa-a-dietowin")} />

      <SeoHeader />

      <main>
        <SeoHero
          eyebrow="Comparativa"
          title={
            <>
              La alternativa <Highlight>gratuita</Highlight> a Dietowin
            </>
          }
          description={
            <>
              <strong className="text-gray-900 dark:text-gray-100">Annonia</strong> es una alternativa
              gratuita y 100% online a Dietowin para nutricionistas y dietistas: pacientes, planes con
              inteligencia artificial y seguimiento desde el navegador, sin instalar nada y sin
              licencia, durante la fase de lanzamiento en España.
            </>
          }
        >
          <CtaButtons />
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
            Actualizado: <time dateTime="2026-06">junio de 2026</time>
          </p>
        </SeoHero>

        {/* Tabla comparativa */}
        <section className="py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Frente a frente">
              Annonia frente a <Highlight>Dietowin</Highlight>
            </SectionTitle>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <table className="w-full text-sm sm:text-base">
                <thead>
                  <tr className="bg-[#bdd9c5]/40 dark:bg-[#1a3a24]/50 text-left">
                    <th className="px-5 py-4 w-[30%]" aria-label="Característica"></th>
                    <th className="px-5 py-4 font-extrabold text-green-700 dark:text-green-400">Annonia</th>
                    <th className="px-5 py-4 font-semibold text-gray-500 dark:text-gray-400">Dietowin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#17181e]">
                  {COMPARATIVA.map((fila) => (
                    <tr key={fila.campo}>
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-gray-100">{fila.campo}</td>
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-200">
                        <span className="inline-flex items-start gap-2">
                          <Check className="w-4 h-4 mt-1 text-green-600 dark:text-green-400 shrink-0" />
                          {fila.annonia}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400">{fila.otro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 text-center">
              Dietowin es un software consolidado en el sector; esta comparativa destaca las diferencias
              de modelo (gratuito y web frente a licencia e instalación). Datos sujetos a cambios.
            </p>
          </div>
        </section>

        {/* Ventajas */}
        <section className="py-12 sm:py-16 bg-gradient-to-b from-green-50/40 to-white dark:from-green-950/10 dark:to-[#101117]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <SectionTitle eyebrow="Por qué cambiarte">
              ¿Por qué elegir <Highlight>Annonia</Highlight>?
            </SectionTitle>
            <ul className="space-y-3.5">
              {VENTAJAS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 bg-white dark:bg-[#17181e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm px-5 py-4 text-gray-700 dark:text-gray-200"
                >
                  <span className="mt-0.5 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 sm:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <SectionTitle eyebrow="Dudas habituales">
              Preguntas <Highlight>frecuentes</Highlight>
            </SectionTitle>
            <SeoFaqList items={FAQ} />
          </div>
        </section>

        <SeoExplorar actual="/alternativa-a-dietowin" />

        <SeoCtaFinal
          titulo="Prueba Annonia"
          highlight="gratis"
          descripcion="Sin licencia, sin instalación y con todas las funciones. Crea tu cuenta en menos de un minuto."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
