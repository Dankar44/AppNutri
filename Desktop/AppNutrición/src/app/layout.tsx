import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriApp - Gestión de Dietas para Dietistas",
  description:
    "Plataforma profesional para dietistas: crea dietas personalizadas, gestiona pacientes y optimiza tu consulta.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
