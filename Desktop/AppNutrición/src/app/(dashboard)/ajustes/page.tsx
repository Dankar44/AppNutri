import { Settings } from "lucide-react";

export default function AjustesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground mt-1">
          Configura tu perfil y preferencias
        </p>
      </div>
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-medium text-lg mb-1">Próximamente</h3>
        <p className="text-muted-foreground">
          Esta sección estará disponible pronto.
        </p>
      </div>
    </div>
  );
}
