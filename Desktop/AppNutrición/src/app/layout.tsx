import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeAwareToaster } from "@/components/theme-aware-toaster";
import { CookieBanner } from "@/components/cookie-banner";
import { GoogleAnalytics } from "@/components/google-analytics";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://annonia.com"),
  title: {
    default: "Annonia — Software para Dietistas y Nutricionistas",
    template: "%s | Annonia",
  },
  description:
    "Software de nutrición para dietistas: crea dietas personalizadas, gestiona pacientes, agenda citas y genera planes alimenticios con inteligencia artificial. Prueba gratis 14 días.",
  keywords: [
    "software nutricionista",
    "software para dietistas",
    "app para nutricionistas",
    "programa de nutrición",
    "gestión de pacientes nutrición",
    "dietas personalizadas online",
    "software nutrición clínica",
    "herramienta para dietistas",
    "plan alimenticio online",
    "software consulta nutrición",
    "app dietista",
    "gestión consulta dietética",
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
    title: "Annonia — Software para Dietistas y Nutricionistas",
    description: "Software de nutrición profesional: dietas personalizadas, gestión de pacientes y agenda con IA. Desde 9,99€/mes.",
    type: "website",
    locale: "es_ES",
    siteName: "Annonia",
    url: "https://annonia.com",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "Annonia - Plataforma profesional para dietistas",
      type: "image/png",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Annonia — Software para Dietistas y Nutricionistas",
    description: "Software de nutrición profesional: dietas personalizadas, gestión de pacientes y agenda con IA. Prueba gratis 14 días.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("annonia-theme");var d=document.documentElement;var c=t==="dark"?"#101117":"#fafafa";if(t==="dark"){d.classList.add("dark");d.style.colorScheme="dark"}else{d.style.colorScheme="light"}var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.setAttribute("name","theme-color");document.head.appendChild(m)}m.setAttribute("content",c)}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          {children}
          <ThemeAwareToaster />
          <CookieBanner />
        </ThemeProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
