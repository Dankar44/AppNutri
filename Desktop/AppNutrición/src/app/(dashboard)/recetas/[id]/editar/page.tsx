import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getReceta } from "@/app/actions/recetas";
import { RecetaForm } from "@/components/receta-form";
import { getCurrentDietista } from "@/app/actions/auth";
import type { IngredienteItem } from "@/components/ingrediente-list";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarRecetaPage({ params }: Props) {
  const { id } = await params;
  const [receta, t, dietista] = await Promise.all([
    getReceta(id), getTranslations("recipes"), getCurrentDietista(),
  ]);
  if (!receta) notFound();
  // Las recetas del catálogo no son editables: se comparten con todos los nutricionistas.
  // `getReceta` sí las devuelve (hay que poder verlas), así que sin esto el formulario se
  // abría con una receta de la app dentro a quien escribiese la URL a mano.
  if (receta.esGlobal) notFound();
  // Y solo se edita lo propio: lo que le comparten se ve y se copia, pero no se toca.
  if (receta.dietistaId !== dietista?.id) notFound();

  const compartirCon = dietista?.empresaId
    ? ("centro" as const)
    : dietista?.rolDocente === "PROFESOR"
      ? ("clase" as const)
      : null;

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
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("editar.volverAReceta")}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("editar.titulo", { nombre: receta.nombre })}</h1>
      </div>
      <RecetaForm
        recetaId={receta.id}
        defaultValues={{
          nombre: receta.nombre,
          descripcion: receta.descripcion || undefined,
          instrucciones: receta.instrucciones || undefined,
          porciones: receta.porciones,
          tiempoPreparacion: receta.tiempoPreparacion,
          compartido: receta.compartido,
        }}
        defaultIngredientes={ingredientes}
        compartirCon={compartirCon}
      />
    </div>
  );
}
