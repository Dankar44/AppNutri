import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getReceta } from "@/app/actions/recetas";
import { RecetaForm } from "@/components/receta-form";
import type { IngredienteItem } from "@/components/ingrediente-list";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarRecetaPage({ params }: Props) {
  const { id } = await params;
  const receta = await getReceta(id);
  if (!receta) notFound();

  const ingredientes: IngredienteItem[] = receta.ingredientes.map((ing) => ({
    alimentoId: ing.alimentoId,
    nombre: ing.alimento.nombre,
    cantidad: ing.cantidad,
    unidad: ing.unidad,
    macrosPor100g: {
      calorias: ing.alimento.calorias,
      proteinas: ing.alimento.proteinas,
      carbohidratos: ing.alimento.carbohidratos,
      grasas: ing.alimento.grasas,
      fibra: ing.alimento.fibra,
    },
  }));

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/recetas/${receta.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la receta
        </Link>
        <h1 className="text-2xl font-bold">Editar {receta.nombre}</h1>
      </div>
      <RecetaForm
        recetaId={receta.id}
        defaultValues={{
          nombre: receta.nombre,
          descripcion: receta.descripcion || undefined,
          instrucciones: receta.instrucciones || undefined,
          porciones: receta.porciones,
        }}
        defaultIngredientes={ingredientes}
      />
    </div>
  );
}
