import type { Metadata } from "next";
import RegistroForm from "./registro-form";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("registro.metaTitle"),
    description: t("registro.metaDescription"),
    alternates: { canonical: "/registro" },
    openGraph: {
      title: t("registro.ogTitle"),
      description: t("registro.ogDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("registro.twitterTitle"),
    },
  };
}

export default function RegistroPage() {
  return <RegistroForm />;
}
