import Link from "next/link";
import { Leaf, Lock, ArrowRight } from "lucide-react";
import RegistroForm from "./registro-form";

export default function RegistroPage() {
  const abierto = process.env.REGISTRATION_OPEN === "true";

  if (abierto) return <RegistroForm />;

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-muted/40">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-10">
          <Leaf className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold">Annonia</span>
        </div>

        <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-6 flex items-center justify-center">
          <Lock className="w-7 h-7 text-muted-foreground" strokeWidth={1.75} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3">
          Registros cerrados
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Annonia se encuentra actualmente en fase privada. De momento no
          aceptamos nuevos registros. Si ya tienes cuenta, inicia sesión.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          Ir al login
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-xs text-muted-foreground mt-10">
          ¿Eres nutricionista interesado en probar Annonia? Escríbenos a{" "}
          <a
            href="mailto:hola@annonia.com"
            className="underline hover:text-foreground"
          >
            hola@annonia.com
          </a>
        </p>
      </div>
    </div>
  );
}
