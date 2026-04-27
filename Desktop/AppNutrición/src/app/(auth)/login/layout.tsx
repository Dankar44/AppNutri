import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión — Annonia Software de Nutrición",
  description:
    "Accede a tu cuenta de Annonia. Gestiona dietas personalizadas, pacientes y tu consulta de nutrición desde cualquier dispositivo.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "Iniciar sesión en Annonia",
    description: "Accede a tu software de nutrición profesional.",
  },
  twitter: {
    card: "summary",
    title: "Iniciar sesión en Annonia",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
