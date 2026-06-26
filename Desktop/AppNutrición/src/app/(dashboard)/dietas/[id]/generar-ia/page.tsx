import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { getPlan } from "@/app/actions/planes";
import { getObjetivosPlanificacionActiva } from "@/app/actions/planificaciones";
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

  // #78-A: si el plan aún no tiene objetivos propios, se heredan de la planificación del paciente.
  const objPlani = await getObjetivosPlanificacionActiva(plan.pacienteId);

  const aiConfigured = await checkAIConfigured();

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/dietas/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al plan
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
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
          planId={id}
          pacienteId={paciente.id}
          pacienteNombre={`${paciente.nombre} ${paciente.apellidos}`}
          pacienteInfo={{
            peso: paciente.peso,
            altura: paciente.altura,
            objetivo: paciente.objetivo,
            alergias: paciente.alergias,
            intolerancias: paciente.intolerancias,
            preferencias: paciente.preferencias,
          }}
          defaultObjetivos={{
            calorias: plan.caloriasObjetivo || objPlani?.kcal || 2000,
            proteinas: plan.proteinasObjetivo || objPlani?.proteinas || 120,
            carbohidratos: plan.carbohidratosObjetivo || objPlani?.carbohidratos || 250,
            grasas: plan.grasasObjetivo || objPlani?.grasas || 70,
          }}
        />
      )}
    </div>
  );
}
