import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import {
  getOrganizationJsonLd,
  getWebsiteJsonLd,
  getSoftwareApplicationJsonLd,
  getLandingFaqJsonLd,
} from "@/lib/structured-data";
import { LandingPage } from "@/components/landing/landing-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
    alternates: { canonical: "/landing" },
    openGraph: {
      title: t("metadata.ogTitle"),
      description: t("metadata.ogDescription"),
      type: "website",
      locale: "es_ES",
      siteName: "Annonia",
      url: "/landing",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: t("metadata.ogImageAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.twitterTitle"),
      description: t("metadata.twitterDescription"),
      images: ["/og-image.png"],
    },
  };
}

export default async function LandingPageRoute() {
  const t = await getTranslations("landing.structuredData");
  return (
    <>
      <JsonLd data={getOrganizationJsonLd(t)} />
      <JsonLd data={getWebsiteJsonLd(t)} />
      <JsonLd data={getSoftwareApplicationJsonLd(t)} />
      <JsonLd data={getLandingFaqJsonLd(t)} />
      <LandingPage />
    </>
  );
}
