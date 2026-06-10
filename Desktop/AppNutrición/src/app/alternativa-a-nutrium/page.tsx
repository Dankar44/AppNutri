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
  title: { absolute: "Alternativa gratuita a Nutrium — Annonia" },
  description:
    "Annonia es una alternativa gratuita a Nutrium para nutricionistas: gestiona pacientes, crea planes con IA, haz seguimiento y ofrece un portal al paciente, sin suscripción mensual.",
  alternates: { canonical: "/alternativa-a-nutrium" },
  openGraph: {
    title: "Alternativa gratuita a Nutrium — Annonia",
    description: "Software de nutrición online y gratis, sin suscripción mensual.",
    type: "website",
    locale: "es_ES",
    siteName: "Annonia",
    url: "/alternativa-a-nutrium",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Annonia" }],
  },
};

const COMPARATIVA: { campo: string; annonia: string; otro: string }[] = [
  { campo: "Precio", annonia: "Gratis (fase de lanzamiento)", otro: "Suscripción mensual de pago" },
  { campo: "Funciona en", annonia: "Navegador (web)", otro: "Navegador (web)" },
  { campo: "Planes con IA", annonia: "Sí, plan semanal completo en minutos", otro: "Sí" },
  { campo: "Portal del paciente", annonia: "Sí (email + PIN, sin registro)", otro: "App para el paciente" },
  { campo: "Para empezar", annonia: "Creas la cuenta y listo (1 min)", otro: "Alta + suscripción" },
];

const VENTAJAS = [
  "Gratis durante la fase de lanzamiento en España (sin suscripción)",
  "Gestión de pacientes, planes con IA y seguimiento",
  "Portal para el paciente (email + PIN, sin que se registre)",
  "Recetas, agenda y generación de PDF",
  "Datos en servidores de la UE y cumplimiento del RGPD",
];

const FAQ = [
  {
    q: "¿Annonia es una alternativa gratuita a Nutrium?",
    a: "Sí. Annonia ofrece gestión de pacientes, planes personalizados con IA, seguimiento, recetas y portal del paciente, y es gratis durante su fase de lanzamiento en España, sin suscripción mensual.",
  },
  {
    q: "¿Qué incluye Annonia sin pagar?",
    a: "Todas las funciones: pacientes, planes con IA, seguimiento antropométrico, recetas, agenda, portal del paciente y generación de PDF. Durante la fase de lanzamiento no hay coste.",
  },
  {
    q: "¿Mis pacientes necesitan descargar una app?",
    a: "No es obligatorio. Acceden a su portal con email y PIN desde el navegador del móvil para ver su plan y seguimiento, sin crear cuenta.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

export default function AlternativaNutriumPage() {
  return (
    <div className="min-h-dvh bg-white dark:bg-[#101117]">
      <JsonLd data={getOrganizationJsonLd()} />
      <JsonLd data={getSoftwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={getBreadcrumbJsonLd("Alternativa a Nutrium", "/alternativa-a-nutrium")} />

      <SeoHeader />

      <main>
        <SeoHero
          eyebrow="Comparativa"
          title={
            <>
              La alternativa <Highlight>gratuita</Highlight> a Nutrium
            </>
          }
          description={
            <>
              <strong className="text-gray-900 dark:text-gray-100">Annonia</strong> es una alternativa
              gratuita a Nutrium para nutricionistas y dietistas: pacientes, planes con inteligencia
              artificial, seguimiento y portal del paciente desde el navegador, sin suscripción
              mensual, durante la fase de lanzamiento en España.
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
              Annonia frente a <Highlight>Nutrium</Highlight>
            </SectionTitle>
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <table className="w-full text-sm sm:text-base">
                <thead>
                  <tr className="bg-[#bdd9c5]/40 dark:bg-[#1a3a24]/50 text-left">
                    <th className="px-5 py-4 w-[30%]" aria-label="Característica"></th>
                    <th className="px-5 py-4 font-extrabold text-green-700 dark:text-green-400">Annonia</th>
                    <th className="px-5 py-4 font-semibold text-gray-500 dark:text-gray-400">Nutrium</th>
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
              Nutrium es una herramienta reconocida del sector; esta comparativa destaca la diferencia
              de modelo (gratuito frente a suscripción de pago). Datos sujetos a cambios.
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

        <SeoExplorar actual="/alternativa-a-nutrium" />

        <SeoCtaFinal
          titulo="Prueba Annonia"
          highlight="gratis"
          descripcion="Sin suscripción y con todas las funciones. Crea tu cuenta en menos de un minuto."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
