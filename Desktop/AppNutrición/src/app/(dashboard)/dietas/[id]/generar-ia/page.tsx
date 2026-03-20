import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getPlan } from "@/app/actions/planes";
import { getPaciente } from "@/app/actions/pacientes";
import { checkAIConfigured } from "@/app/actions/ai";
import { AIConfigBanner } from "@/components/ai/ai-config-banner";
import { IAGenerationForm } from "./ia-generation-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GenerarIAPage({ params }: Props) {
  const { id } = await params;
  const plan = await getPlan(id);
  if (!plan) notFound();

  const paciente = await getPaciente(plan.pacienteId);
  if (!paciente) notFound();

  const aiConfigured = await checkAIConfigured();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dietas/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al plan
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-amber-500" />
          Generar dieta con IA
        </h1>
        <p className="text-muted-foreground mt-1">
          Para {paciente.nombre} {paciente.apellidos}
        </p>
      </div>

      {!aiConfigured ? (
        <AIConfigBanner />
      ) : (
        <IAGenerationForm
          pacienteId={paciente.id}
          pacienteNombre={`${paciente.nombre} ${paciente.apellidos}`}
          defaultObjetivos={{
            calorias: plan.caloriasObjetivo || 2000,
            proteinas: plan.proteinasObjetivo || 120,
            carbohidratos: plan.carbohidratosObjetivo || 250,
            grasas: plan.grasasObjetivo || 70,
          }}
        />
      )}
    </div>
  );
}
