import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale as getNextIntlLocale, getTranslations } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { LocaleProvider } from "@/components/locale-provider";
import { ThemeAwareToaster } from "@/components/theme-aware-toaster";
import { CookieBanner } from "@/components/cookie-banner";
import { GoogleAnalytics } from "@/components/google-analytics";
import { DeployReloader } from "@/components/deploy-reloader";
import type { Locale } from "@/i18n/config";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  const locale = (await getNextIntlLocale()) as Locale;

  return {
    metadataBase: new URL("https://annonia.com"),
    title: {
      default: t("metadata.title"),
      template: t("metadata.titleTemplate"),
    },
    description: t("metadata.description"),
    keywords: [
      "software nutricionista",
      "software para nutricionistas",
      "app para nutricionistas",
      "programa de nutrición",
      "gestión de pacientes nutrición",
      "dietas personalizadas online",
      "software nutrición clínica",
      "herramienta para nutricionistas",
      "plan alimenticio online",
      "software consulta nutrición",
      "app nutricionista",
      "gestión consulta nutricional",
      "planes alimenticios",
      "macros",
      "cálculo nutricional",
    ],
    authors: [{ name: "Annonia" }],
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Annonia",
    },
    formatDetection: { telephone: false },
    icons: {
      icon: [{ url: "/favicon.ico", sizes: "32x32" }],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: { canonical: "/" },
    openGraph: {
      title: t("metadata.ogTitle"),
      description: t("metadata.ogDescription"),
      type: "website",
      locale: locale === "pt" ? "pt_BR" : "es_ES",
      siteName: "Annonia",
      url: "https://annonia.com",
      images: [{
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: t("metadata.ogImageAlt"),
        type: "image/png",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("metadata.twitterTitle"),
      description: t("metadata.twitterDescription"),
      images: ["/og-image.png"],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getNextIntlLocale()) as Locale;
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("annonia-theme");var d=document.documentElement;var c=t==="dark"?"#101117":"#fafafa";if(t==="dark"){d.classList.add("dark");d.style.colorScheme="dark"}else{d.style.colorScheme="light"}var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m)}m.setAttribute("content",c)}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider>
            <LocaleProvider initial={locale}>
              {children}
              <ThemeAwareToaster />
              <CookieBanner />
              <DeployReloader />
            </LocaleProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
