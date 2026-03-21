import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Share2, Sparkles } from "lucide-react";
import { getPlan } from "@/app/actions/planes";
import { capitalizarNombre } from "@/lib/utils";
import { PlanEditor } from "@/components/dieta/plan-editor";
import { PlanActions } from "./plan-actions";
import { PlantillaButton } from "./plantilla-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: Props) {
  const { id } = await params;
  const plan = await getPlan(id);
  if (!plan) notFound();

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/dietas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a planes
        </Link>
        <div className="space-y-3">
          <p className="text-sm sm:text-base font-medium">
            Paciente: {capitalizarNombre(plan.paciente.nombre)} {capitalizarNombre(plan.paciente.apellidos)}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/dietas/${plan.id}/generar-ia`}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors text-xs sm:text-sm font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              IA
            </Link>
            <PlantillaButton planId={plan.id} />
            <Link
              href={`/dietas/${plan.id}/compartir`}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs sm:text-sm font-medium"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartir</span>
            </Link>
            <Link
              href={`/dietas/${plan.id}/editar`}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs sm:text-sm font-medium"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </Link>
            <PlanActions planId={plan.id} />
          </div>
        </div>
      </div>

      <PlanEditor
        planId={plan.id}
        planNombre={plan.nombre}
        dias={plan.dias.map((dia) => ({
          id: dia.id,
          dia: dia.dia,
          comidas: dia.comidas.map((comida) => ({
            id: comida.id,
            tipo: comida.tipo,
            descripcion: comida.descripcion,
            alimentos: comida.alimentos.map((a) => ({
              id: a.id,
              cantidad: a.cantidad,
              unidad: a.unidad,
              alimento: a.alimento
                ? {
                    id: a.alimento.id,
                    nombre: a.alimento.nombre,
                    calorias: a.alimento.calorias,
                    proteinas: a.alimento.proteinas,
                    carbohidratos: a.alimento.carbohidratos,
                    grasas: a.alimento.grasas,
                  }
                : null,
              receta: a.receta
                ? {
                    id: a.receta.id,
                    nombre: a.receta.nombre,
                    calorias: a.receta.calorias,
                    proteinas: a.receta.proteinas,
                    carbohidratos: a.receta.carbohidratos,
                    grasas: a.receta.grasas,
                  }
                : null,
            })),
          })),
        }))}
        objetivos={{
          calorias: plan.caloriasObjetivo,
          proteinas: plan.proteinasObjetivo,
          carbohidratos: plan.carbohidratosObjetivo,
          grasas: plan.grasasObjetivo,
        }}
      />
    </div>
  );
}
