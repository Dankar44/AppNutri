import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeAwareToaster } from "@/components/theme-aware-toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "NutriApp - Gestión de Dietas para Dietistas",
    template: "%s | NutriApp",
  },
  description:
    "Plataforma profesional para dietistas: crea dietas personalizadas, gestiona pacientes y optimiza tu consulta con inteligencia artificial.",
  keywords: ["nutrición", "dietista", "dietas", "planes alimenticios", "macros", "pacientes"],
  authors: [{ name: "NutriApp" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NutriApp",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "NutriApp - Gestión de Dietas para Dietistas",
    description: "Crea dietas personalizadas, gestiona pacientes y optimiza tu consulta.",
    type: "website",
    locale: "es_ES",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#16a34a",
  viewportFit: "cover",
};

// Script inline que aplica la clase `dark` ANTES de que React hidrate,
// evitando el flash de modo claro cuando el usuario tiene modo oscuro guardado.
const THEME_INIT_SCRIPT = `
(function(){
  try {
    var t = localStorage.getItem("nutriapp-theme");
    var d = document.documentElement;
    if (t === "dark") {
      d.classList.add("dark");
      d.style.colorScheme = "dark";
    } else {
      d.style.colorScheme = "light";
    }
  } catch(e) {}
})();
`.trim();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ThemeProvider>
          {children}
          <ThemeAwareToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
