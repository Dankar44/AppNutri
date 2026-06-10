import type { Metadata } from "next";
import { Users, Brain, LineChart, BookOpen, CalendarDays, FileText, Check, ShieldCheck, Globe, Sparkles, BadgeEuro } from "lucide-react";
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
  title: { absolute: "Software para nutricionistas gratis — Annonia" },
  description:
    "Annonia es un software para nutricionistas gratis, online y con inteligencia artificial: gestiona pacientes, crea planes nutricionales personalizados, haz seguimiento y comparte un portal con el paciente. Sin instalar nada.",
  alternates: { canonical: "/software-para-nutricionistas-gratis" },
  openGraph: {
    title: "Software para nutricionistas gratis — Annonia",
    description:
      "Gestiona pacientes, crea dietas personalizadas con IA y haz seguimiento desde el navegador. Gratis durante la fase de lanzamiento en España.",
    type: "website",
    locale: "es_ES",
    siteName: "Annonia",
    url: "/software-para-nutricionistas-gratis",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Annonia · Software para nutricionistas" }],
  },
};

const DATOS_CLAVE = [
  { icon: BadgeEuro, dato: "0 €", texto: "Gratis durante la fase de lanzamiento en España" },
  { icon: Globe, dato: "100% web", texto: "Funciona en el navegador, sin instalar nada" },
  { icon: Sparkles, dato: "Planes con IA", texto: "Dietas personalizadas en minutos, editables a mano" },
  { icon: ShieldCheck, dato: "RGPD · UE", texto: "Datos cifrados en servidores de la Unión Europea" },
];

const FUNCIONES = [
  { icon: Users, titulo: "Gestión de pacientes", texto: "Ficha clínica completa: datos, alergias, objetivos, anamnesis e historial en un solo lugar." },
  { icon: Brain, titulo: "Planes con inteligencia artificial", texto: "Genera dietas personalizadas en minutos a partir de los datos del paciente y ajústalas a mano." },
  { icon: LineChart, titulo: "Seguimiento de la evolución", texto: "Registra peso, medidas antropométricas y progreso con gráficas claras." },
  { icon: BookOpen, titulo: "Recetas", texto: "Crea y reutiliza recetas con su composición nutricional en tus planes." },
  { icon: CalendarDays, titulo: "Agenda y citas", texto: "Organiza tus consultas y sincroniza con Google Calendar." },
  { icon: FileText, titulo: "Portal del paciente y PDF", texto: "Tus pacientes acceden a su plan desde un portal propio y puedes exportarlo en PDF." },
];

const PARA_QUIEN = [
  "Nutricionistas y dietistas en consulta privada",
  "Clínicas y centros con varios profesionales",
  "Consulta online, presencial o mixta",
  "Docencia universitaria y prácticas en nutrición",
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "¿Cuál es el mejor software gratis para nutricionistas?",
    a: "Annonia es un software para nutricionistas gratuito, online y con inteligencia artificial. Permite gestionar pacientes, crear planes nutricionales personalizados, hacer seguimiento de la evolución y compartir un portal con el paciente, sin instalación y sin coste durante la fase de lanzamiento en España.",
  },
  {
    q: "¿Annonia es realmente gratis?",
    a: "Sí. Durante la fase de lanzamiento en España puedes usar Annonia de forma totalmente gratuita y con todas las funciones. Solo tienes que crear una cuenta.",
  },
  {
    q: "¿Necesito instalar algo?",
    a: "No. Annonia funciona en el navegador (web app) desde el ordenador, la tablet o el móvil. No requiere instalación ni mantenimiento.",
  },
  {
    q: "¿Mis pacientes tienen que registrarse?",
    a: "No. Tú les envías un acceso con email y PIN, y entran a su portal sin crear cuenta para ver su plan, recetas y seguimiento.",
  },
  {
    q: "¿Los datos están seguros?",
    a: "Sí. Annonia usa servidores en la Unión Europea y cumple con el RGPD. La protección de los datos clínicos de tus pacientes es una prioridad.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function SoftwareNutricionistasGratisPage() {
  return (
    <div className="min-h-dvh bg-white dark:bg-[#101117]">
      <JsonLd data={getOrganizationJsonLd()} />
      <JsonLd data={getSoftwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={getBreadcrumbJsonLd("Software para nutricionistas gratis", "/software-para-nutricionistas-gratis")} />

      <SeoHeader />

      <main>
        <SeoHero
          eyebrow="Software para nutricionistas"
          title={
            <>
              Software para nutricionistas <Highlight>gratis</Highlight>
            </>
          }
          description={
            <>
              <strong className="text-gray-900 dark:text-gray-100">Annonia</strong> es un software para
              nutricionistas gratuito, online y con inteligencia artificial: gestiona a tus pacientes,
              crea planes nutricionales personalizados en minutos, sigue su evolución y comparte un
              portal con cada paciente. Sin instalar nada y sin coste durante la fase de lanzamiento
              en España.
            </>
          }
        >
          <CtaButtons />
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
            Actualizado: <time dateTime="2026-06">junio de 2026</time>
          </p>
        </SeoHero>

        {/* Datos clave (citables) */}
        <section className="pb-14 sm:pb-20 -mt-2">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {DATOS_CLAVE.map((d) => (
                <div
                  key={d.dato}
                  className="bg-white dark:bg-[#17181e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 text-center"
                >
                  <div className="w-11 h-11 mx-auto rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-3">
                    <d.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="font-extrabold text-gray-900 dark:text-gray-100 text-lg">{d.dato}</p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-snug">{d.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Funciones */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-green-50/50 to-white dark:from-green-950/10 dark:to-[#101117]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Todo en un solo lugar"
              sub="Las herramientas que usas cada día en consulta, conectadas entre sí."
            >
              ¿Qué puedes hacer con <Highlight>Annonia</Highlight>?
            </SectionTitle>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
              {FUNCIONES.map((f) => (
                <div
                  key={f.titulo}
                  className="bg-white dark:bg-[#17181e] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-6"
                >
                  <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">{f.titulo}</h3>
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Por qué es gratis + para quién */}
        <section className="py-14 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 max-w-5xl mx-auto items-start">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
                  ¿Por qué es <Highlight>gratis</Highlight>?
                </h2>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                  Annonia está en fase de lanzamiento en España. Durante este periodo es gratis y con
                  todas las funciones, porque nuestra prioridad es que cada vez más nutricionistas lo
                  usen en su consulta y nos ayuden a mejorarlo con su feedback. Frente a las
                  soluciones tradicionales —de pago y de escritorio—, Annonia es una herramienta web,
                  moderna y sin coste.
                </p>
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-4">
                  ¿Para quién <Highlight>es</Highlight>?
                </h2>
                <ul className="space-y-3">
                  {PARA_QUIEN.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-gray-600 dark:text-gray-300">
                      <span className="mt-0.5 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 sm:py-20 bg-gradient-to-b from-green-50/40 to-white dark:from-green-950/10 dark:to-[#101117]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Resolvemos tus dudas">
              Preguntas <Highlight>frecuentes</Highlight>
            </SectionTitle>
            <div className="max-w-3xl mx-auto">
              <SeoFaqList items={FAQ} />
            </div>
          </div>
        </section>

        <SeoExplorar actual="/software-para-nutricionistas-gratis" />

        <SeoCtaFinal
          titulo="Empieza"
          highlight="gratis"
          resto="hoy mismo"
          descripcion="Crea tu cuenta en menos de un minuto y gestiona tu consulta desde el primer día. Si prefieres verlo antes, entra en la demo sin registrarte."
        />
      </main>

      <SeoFooter />
    </div>
  );
}
