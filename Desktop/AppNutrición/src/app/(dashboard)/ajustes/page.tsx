import { Settings, Sparkles, Check, X } from "lucide-react";
import { getCurrentDietista } from "@/app/actions/auth";
import { checkAIConfigured } from "@/app/actions/ai";
import { redirect } from "next/navigation";
import { PerfilForm } from "./perfil-form";
import { FotoPerfil } from "./foto-perfil";

export default async function AjustesPage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const aiConfigured = await checkAIConfigured();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground mt-1">
          Configura tu perfil y preferencias
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Foto de perfil</h2>
          <FotoPerfil
            nombre={dietista.nombre}
            apellidos={dietista.apellidos}
            fotoUrl={dietista.logoUrl}
          />
        </section>

        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Perfil profesional</h2>
          <p className="text-sm text-muted-foreground mb-4">Email: {dietista.email}</p>
          <PerfilForm
            defaultValues={{
              nombre: dietista.nombre,
              apellidos: dietista.apellidos,
              telefono: dietista.telefono || undefined,
              especialidad: dietista.especialidad || undefined,
              numColegiado: dietista.numColegiado || undefined,
              clinica: dietista.clinica || undefined,
            }}
          />
        </section>

        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Inteligencia Artificial
          </h2>
          <div className="flex items-center gap-3 mb-4">
            {aiConfigured ? (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">IA configurada (Groq)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">IA no configurada</span>
              </div>
            )}
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
            <p>Para activar la generación de dietas con IA:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Obtén API keys en <code className="bg-muted px-1 rounded">console.groq.com</code></li>
              <li>Añade al archivo <code className="bg-muted px-1 rounded">.env.local</code>:</li>
            </ol>
            <pre className="bg-muted rounded p-2 text-xs mt-2">{`GROQ_API_KEY_1=gsk_...
GROQ_API_KEY_2=gsk_...`}</pre>
            <p className="text-xs">Se rotan automáticamente para evitar rate limits.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
