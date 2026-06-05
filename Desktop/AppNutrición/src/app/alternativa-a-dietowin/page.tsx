import type { Metadata } from "next";
import Link from "next/link";
import { Leaf, Check } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { getOrganizationJsonLd, getSoftwareApplicationJsonLd } from "@/lib/structured-data";

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
    <div className="min-h-dvh bg-background">
      <JsonLd data={getOrganizationJsonLd()} />
      <JsonLd data={getSoftwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd} />

      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <Link href="/landing" className="mb-8 inline-flex items-center gap-2 text-sm font-medium">
          <Leaf className="h-5 w-5 text-primary" />
          Annonia
        </Link>

        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Annonia: la alternativa gratuita a Dietowin
        </h1>

        <p className="mt-4 text-lg text-muted-foreground">
          <strong className="text-foreground">Annonia</strong> es una alternativa <strong className="text-foreground">gratuita y 100% online</strong> a
          Dietowin para nutricionistas y dietistas. Gestiona pacientes, crea planes nutricionales
          personalizados con inteligencia artificial y haz seguimiento de la evolución desde el
          navegador, <strong className="text-foreground">sin instalar nada y sin licencia</strong>, durante la fase de lanzamiento en España.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/registro" className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-green-700">
            Crear mi cuenta gratis
          </Link>
          <Link href="/demo" className="rounded-lg border border-input bg-card px-6 py-3 font-medium transition-colors hover:bg-muted/50">
            Ver la demo
          </Link>
        </div>

        <h2 className="mt-12 text-2xl font-bold">Annonia frente a Dietowin</h2>
        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium"></th>
                <th className="px-4 py-3 font-semibold text-primary">Annonia</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Dietowin</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-4 py-3 font-medium">Precio</td>
                <td className="px-4 py-3">Gratis (fase de lanzamiento)</td>
                <td className="px-4 py-3 text-muted-foreground">De pago (licencia)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-3 font-medium">Funciona en</td>
                <td className="px-4 py-3">Navegador, sin instalar</td>
                <td className="px-4 py-3 text-muted-foreground">Se instala en el ordenador</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-3 font-medium">Para empezar</td>
                <td className="px-4 py-3">Creas la cuenta y listo (1 min)</td>
                <td className="px-4 py-3 text-muted-foreground">Licencia + instalación</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium">Portal del paciente</td>
                <td className="px-4 py-3">Sí (email + PIN, sin registro)</td>
                <td className="px-4 py-3 text-muted-foreground">App móvil</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Dietowin es un software consolidado en el sector; esta comparativa destaca las diferencias
          de modelo (gratuito y web frente a licencia e instalación). Datos sujetos a cambios.
        </p>

        <h2 className="mt-12 text-2xl font-bold">¿Por qué elegir Annonia?</h2>
        <ul className="mt-4 space-y-2.5">
          {[
            "Gratis durante la fase de lanzamiento en España",
            "100% web: sin instalar ni mantener nada",
            "Planes nutricionales personalizados con IA",
            "Portal para el paciente (email + PIN, sin que se registre)",
            "Datos en servidores de la UE y cumplimiento del RGPD",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-muted-foreground">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 text-2xl font-bold">Preguntas frecuentes</h2>
        <div className="mt-5 space-y-3">
          {FAQ.map((f) => (
            <details key={f.q} className="rounded-lg border border-border bg-card p-4">
              <summary className="cursor-pointer font-medium">{f.q}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-bold">Prueba Annonia gratis</h2>
          <p className="mt-2 text-muted-foreground">Sin licencia, sin instalación, con todas las funciones.</p>
          <Link href="/registro" className="mt-5 inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-green-700">
            Crear mi cuenta gratis
          </Link>
        </div>
      </main>
    </div>
  );
}
