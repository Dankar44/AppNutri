import { Apple } from "lucide-react";

export default function AlimentosPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Alimentos</h1>
        <p className="text-muted-foreground mt-1">
          Base de datos de alimentos y recetas
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <Apple className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-lg mb-1">Próximamente</h3>
        <p className="text-muted-foreground">
          Esta sección estará disponible pronto.
        </p>
      </div>
    </div>
  );
}
