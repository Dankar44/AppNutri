import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import {
  ORGANIZATION_JSONLD,
  WEBSITE_JSONLD,
  SOFTWARE_APPLICATION_JSONLD,
  LANDING_FAQ_JSONLD,
} from "@/lib/structured-data";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Annonia — Software de Nutrición para Dietistas | Dietas Personalizadas con IA",
  description:
    "Software para nutricionistas y dietistas: crea dietas personalizadas, gestiona pacientes, agenda citas online y genera planes alimenticios con inteligencia artificial. Prueba gratis 14 días.",
  alternates: { canonical: "/landing" },
  openGraph: {
    title: "Annonia — Software de Nutrición para Dietistas",
    description: "Software para nutricionistas: dietas personalizadas con IA, gestión de pacientes, agenda y portal del paciente. Desde 9,99€/mes.",
    type: "website",
    locale: "es_ES",
    siteName: "Annonia",
    url: "/landing",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Annonia — Software de nutrición para dietistas y nutricionistas" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Annonia — Software de Nutrición para Dietistas",
    description: "Dietas personalizadas con IA, gestión de pacientes y agenda online. Prueba gratis 14 días.",
    images: ["/og-image.png"],
  },
};

export default function LandingPageRoute() {
  return (
    <>
      <JsonLd data={ORGANIZATION_JSONLD} />
      <JsonLd data={WEBSITE_JSONLD} />
      <JsonLd data={SOFTWARE_APPLICATION_JSONLD} />
      <JsonLd data={LANDING_FAQ_JSONLD} />
      <LandingPage />
    </>
  );
}
