import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RecetaForm } from "@/components/receta-form";

export default function NuevaRecetaPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/recetas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a recetas
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Nueva receta</h1>
        <p className="text-muted-foreground mt-1">
          Crea una receta con ingredientes y cálculo automático de macros
        </p>
      </div>
      <RecetaForm />
    </div>
  );
}
