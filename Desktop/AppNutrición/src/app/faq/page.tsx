import type { Metadata } from "next";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { getOrganizationJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: { absolute: "Preguntas frecuentes sobre software de nutrición — Annonia" },
  description:
    "Resolvemos las dudas más comunes sobre software para nutricionistas: qué es, cuánto cuesta, qué herramientas usan los dietistas y cómo gestionar pacientes y dietas online con Annonia.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Preguntas frecuentes — Annonia",
    description: "Dudas comunes sobre software para nutricionistas y sobre Annonia.",
    type: "website",
    locale: "es_ES",
    siteName: "Annonia",
    url: "/faq",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Annonia" }],
  },
};

type QA = { q: string; a: string };

const SECTOR: QA[] = [
  {
    q: "¿Qué software usan los nutricionistas?",
    a: "Los nutricionistas usan software de gestión para llevar las fichas de sus pacientes, crear planes nutricionales, calcular valores nutricionales y hacer seguimiento de la evolución. Las opciones van desde herramientas gratuitas y modernas en la nube, como Annonia, hasta programas de escritorio de pago con licencia.",
  },
  {
    q: "¿Cuánto cuesta un software de nutrición?",
    a: "Depende de la herramienta: hay opciones gratuitas como Annonia (gratis durante su fase de lanzamiento en España), suscripciones mensuales que suelen ir de 20 a 40 € al mes, y licencias de programas de escritorio que pueden costar varios cientos de euros. Conviene valorar funciones, si es web o de escritorio y el soporte antes de elegir.",
  },
  {
    q: "¿Cómo elegir un software para nutricionistas?",
    a: "Fíjate en que sea fácil de usar, que funcione en el navegador (sin instalación), que permita crear planes personalizados y hacer seguimiento, que ofrezca un portal para el paciente y que cumpla el RGPD con servidores en la UE. Probar una demo o una cuenta gratuita antes de pagar es la mejor forma de decidir.",
  },
  {
    q: "¿Cómo gestionar pacientes como nutricionista?",
    a: "Lo ideal es centralizar en una sola herramienta la ficha clínica de cada paciente (datos, alergias, objetivos), sus planes nutricionales, el seguimiento de medidas y la comunicación. Con Annonia puedes hacer todo esto desde el navegador y darle a cada paciente acceso a su propio portal.",
  },
  {
    q: "¿Se pueden crear dietas personalizadas online?",
    a: "Sí. Con Annonia introduces los datos y el objetivo del paciente (perder peso, ganar masa, patología, etc.) y la herramienta genera un plan personalizado con ayuda de inteligencia artificial, que después puedes ajustar a mano alimento por alimento.",
  },
];

const PRODUCTO: QA[] = [
  {
    q: "¿Annonia es gratis?",
    a: "Sí, Annonia es completamente gratis durante su fase de lanzamiento en España, con todas las funciones. Solo necesitas crear una cuenta.",
  },
  {
    q: "¿Qué puedo hacer con Annonia?",
    a: "Gestionar pacientes, crear planes nutricionales personalizados con IA, hacer seguimiento antropométrico, crear recetas, organizar tu agenda de citas, ofrecer un portal al paciente y generar PDF de los planes.",
  },
  {
    q: "¿Necesito instalar algo?",
    a: "No. Annonia funciona en el navegador desde el ordenador, la tablet o el móvil. No hay instalación ni actualizaciones que gestionar.",
  },
  {
    q: "¿Mis pacientes necesitan crear una cuenta?",
    a: "No. Les envías un acceso con email y PIN y entran a su portal sin registrarse, donde ven su plan, recetas y seguimiento.",
  },
  {
    q: "¿Mis datos y los de mis pacientes están seguros?",
    a: "Sí. Annonia usa encriptación, servidores en la Unión Europea y cumple con el RGPD. La seguridad de los datos clínicos es una prioridad.",
  },
  {
    q: "¿Funciona en el móvil?",
    a: "Sí, está optimizado para móvil, tablet y escritorio. Es una web app que incluso puedes instalar en el dispositivo.",
  },
];

const TODAS = [...PRODUCTO, ...SECTOR];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: TODAS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

function Bloque({ titulo, items }: { titulo: string; items: QA[] }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold">{titulo}</h2>
      <div className="mt-4 space-y-3">
        {items.map((f) => (
          <details key={f.q} className="rounded-lg border border-border bg-card p-4">
            <summary className="cursor-pointer font-medium">{f.q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-dvh bg-background">
      <JsonLd data={getOrganizationJsonLd()} />
      <JsonLd data={faqJsonLd} />

      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <Link href="/landing" className="mb-8 inline-flex items-center gap-2 text-sm font-medium">
          <Leaf className="h-5 w-5 text-primary" />
          Annonia
        </Link>

        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">Preguntas frecuentes</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Dudas habituales sobre software para nutricionistas y sobre Annonia.
        </p>

        <Bloque titulo="Sobre Annonia" items={PRODUCTO} />
        <Bloque titulo="Sobre software de nutrición" items={SECTOR} />

        <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-bold">¿Lo probamos?</h2>
          <p className="mt-2 text-muted-foreground">Crea tu cuenta gratis o entra en la demo sin registrarte.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/registro" className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-green-700">
              Crear mi cuenta gratis
            </Link>
            <Link href="/demo" className="rounded-lg border border-input bg-card px-6 py-3 font-medium transition-colors hover:bg-muted/50">
              Ver la demo
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
