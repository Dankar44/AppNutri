import type { Metadata } from "next";
import Link from "next/link";
import { Leaf, Check, Users, Brain, LineChart, BookOpen, CalendarDays, FileText } from "lucide-react";
import { JsonLd } from "@/components/json-ld";
import { getOrganizationJsonLd, getSoftwareApplicationJsonLd } from "@/lib/structured-data";

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

const FUNCIONES = [
  { icon: Users, titulo: "Gestión de pacientes", texto: "Ficha clínica completa: datos, alergias, objetivos, anamnesis e historial en un solo lugar." },
  { icon: Brain, titulo: "Planes con inteligencia artificial", texto: "Genera dietas personalizadas en minutos a partir de los datos del paciente y ajústalas a mano." },
  { icon: LineChart, titulo: "Seguimiento de la evolución", texto: "Registra peso, medidas antropométricas y progreso con gráficas claras." },
  { icon: BookOpen, titulo: "Recetas", texto: "Crea y reutiliza recetas con su composición nutricional en tus planes." },
  { icon: CalendarDays, titulo: "Agenda y citas", texto: "Organiza tus consultas y sincroniza con Google Calendar." },
  { icon: FileText, titulo: "Portal del paciente y PDF", texto: "Tus pacientes acceden a su plan desde un portal propio y puedes exportarlo en PDF." },
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
    <div className="min-h-dvh bg-background">
      <JsonLd data={getOrganizationJsonLd()} />
      <JsonLd data={getSoftwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd} />

      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <Link href="/landing" className="mb-8 inline-flex items-center gap-2 text-sm font-medium">
          <Leaf className="h-5 w-5 text-primary" />
          Annonia
        </Link>

        <span className="mb-4 inline-flex w-fit items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-primary">
          Gratis · sin instalación
        </span>

        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          Software para nutricionistas gratis
        </h1>

        {/* Respuesta directa en las primeras líneas (clave para SEO y para que lo cite la IA). */}
        <p className="mt-4 text-lg text-muted-foreground">
          <strong className="text-foreground">Annonia</strong> es un software para nutricionistas
          gratuito, online y con inteligencia artificial. Te permite gestionar a tus pacientes,
          crear planes nutricionales personalizados en minutos, hacer seguimiento de su evolución y
          compartir todo a través de un portal para el paciente, sin instalar nada y sin coste
          durante la fase de lanzamiento en España.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/registro" className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-green-700">
            Crear mi cuenta gratis
          </Link>
          <Link href="/demo" className="rounded-lg border border-input bg-card px-6 py-3 font-medium transition-colors hover:bg-muted/50">
            Ver la demo
          </Link>
        </div>

        <h2 className="mt-12 text-2xl font-bold">¿Qué puedes hacer con Annonia?</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FUNCIONES.map((f) => (
            <div key={f.titulo} className="rounded-xl border border-border bg-card p-5">
              <f.icon className="mb-3 h-6 w-6 text-primary" />
              <h3 className="font-semibold">{f.titulo}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.texto}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 text-2xl font-bold">¿Por qué es gratis?</h2>
        <p className="mt-3 text-muted-foreground">
          Annonia está en fase de lanzamiento en España. Durante este periodo es gratis y con todas
          las funciones, porque nuestra prioridad es que cada vez más nutricionistas lo usen en su
          consulta y nos ayuden a mejorarlo con su feedback. Frente a las soluciones tradicionales
          —de pago y de escritorio—, Annonia es una herramienta web, moderna y sin coste.
        </p>

        <h2 className="mt-12 text-2xl font-bold">¿Para quién es?</h2>
        <ul className="mt-4 space-y-2.5">
          {[
            "Nutricionistas y dietistas en consulta privada",
            "Clínicas y centros con varios profesionales",
            "Consulta online, presencial o mixta",
            "Docencia universitaria y prácticas en nutrición",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-muted-foreground">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-12 text-2xl font-bold">Empieza en menos de un minuto</h2>
        <p className="mt-3 text-muted-foreground">
          Crea tu cuenta gratis y empieza a gestionar tu consulta hoy mismo. Si prefieres verlo
          primero, entra en la <Link href="/demo" className="text-primary hover:underline">demo</Link> sin registrarte.
        </p>

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
          <p className="mt-2 text-muted-foreground">Sin tarjeta, sin instalación, con todas las funciones.</p>
          <Link href="/registro" className="mt-5 inline-block rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-green-700">
            Crear mi cuenta gratis
          </Link>
        </div>
      </main>
    </div>
  );
}
