import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
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
  openGraph: {
    title: "NutriApp - Gestión de Dietas para Dietistas",
    description: "Crea dietas personalizadas, gestiona pacientes y optimiza tu consulta.",
    type: "website",
    locale: "es_ES",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
