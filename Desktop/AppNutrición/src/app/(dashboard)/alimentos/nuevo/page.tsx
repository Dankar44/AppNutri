import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AlimentoForm } from "@/components/alimento-form";

export default function NuevoAlimentoPage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/alimentos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a alimentos
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Nuevo alimento</h1>
        <p className="text-muted-foreground mt-1">
          Añade un alimento personalizado a tu base de datos
        </p>
      </div>
      <AlimentoForm />
    </div>
  );
}
