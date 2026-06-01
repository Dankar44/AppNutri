import type { Metadata } from "next";
import { Leaf, Check } from "lucide-react";
import { ColaboradoresForm } from "./colaboradores-form";

export const metadata: Metadata = {
  title: "Programa de colaboradores — Annonia",
  description:
    "Únete al programa de acceso anticipado de Annonia. Buscamos nutricionistas que quieran usar la herramienta gratis y ayudarnos a darle forma con su feedback.",
};

const BENEFICIOS = [
  "Cuenta gratuita, sin límite de tiempo",
  "Acceso anticipado a las funciones nuevas",
  "Línea directa con el equipo que la construye",
  "Tu feedback decide hacia dónde va el producto",
];

const PASOS = [
  "Te registras (menos de 1 minuto)",
  "Confirmas tu cuenta desde el email que te enviamos",
  "La usas con tus pacientes y nos cuentas qué mejorar",
];

export default function ColaboradoresPage() {
  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-10 lg:grid-cols-2 lg:gap-16 lg:py-20">
        {/* Columna izquierda: propuesta */}
        <div className="flex flex-col justify-center">
          <div className="mb-6 flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Annonia</span>
          </div>

          <span className="mb-4 inline-flex w-fit items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-primary">
            Programa de colaboradores · Plazas limitadas
          </span>

          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Buscamos nutricionistas para nuestro programa de acceso anticipado
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Usa Annonia gratis para gestionar tus pacientes, dietas y agenda. A cambio,
            queremos tu opinión sincera para mejorarla. Es una colaboración, no un empleo
            remunerado.
          </p>

          <div className="mt-8">
            <h2 className="mb-3 font-semibold">Qué te llevas</h2>
            <ul className="space-y-2.5">
              {BENEFICIOS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-muted-foreground">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 font-semibold">Cómo funciona</h2>
            <ol className="space-y-2.5">
              {PASOS.map((p, i) => (
                <li key={p} className="flex items-start gap-3 text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Columna derecha: formulario */}
        <div className="flex flex-col justify-center">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <ColaboradoresForm />
          </div>
        </div>
      </div>
    </div>
  );
}
