import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("loginLayout.metaTitle"),
    description: t("loginLayout.metaDescription"),
    alternates: { canonical: "/login" },
    openGraph: {
      title: t("loginLayout.ogTitle"),
      description: t("loginLayout.ogDescription"),
    },
    twitter: {
      card: "summary",
      title: t("loginLayout.twitterTitle"),
    },
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
