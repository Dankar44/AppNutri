import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Clock, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getReceta } from "@/app/actions/recetas";
import { convertirAGramos } from "@/lib/macros";
import { MacroAnalysisCard } from "@/components/alimento/macro-analysis-card";
import { MicronutrientesCard } from "@/components/alimento/micronutrientes-card";
import { PorcionesCalculadora } from "@/components/receta/porciones-calculadora";
import { RecetaPesoBadges } from "@/components/receta/receta-peso-badges";
import { IngredientesLista } from "@/components/receta/ingredientes-lista";
import { RecetaActions } from "./receta-actions";
import { FavoritoButton } from "../favorito-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecetaDetailPage({ params }: Props) {
  const { id } = await params;
  const [receta, t] = await Promise.all([getReceta(id), getTranslations("recipes")]);
  if (!receta) notFound();

  // Peso real en gramos: convertir cada ingrediente según su unidad (ud, ml…) y la porción
  // del alimento — sumar la cantidad cruda daba "100 g" para "100 ud" (bug).
  const pesoTotal = receta.ingredientes.reduce(
    (acc, ing) => acc + convertirAGramos(ing.cantidad || 0, ing.unidad || "GRAMOS", ing.alimento?.porcion || 100),
    0,
  );
  const pesoPorPorcion = receta.porciones > 0 ? pesoTotal / receta.porciones : pesoTotal;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/recetas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("detail.volverARecetas")}
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">{receta.nombre}</h1>
              <RecetaPesoBadges pesoTotal={pesoTotal} pesoPorPorcion={pesoPorPorcion} porciones={receta.porciones} />
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {receta.esGlobal ? (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-primary/10 text-primary inline-flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t("detail.recetaApp")}
                </span>
              ) : (
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400">
                  {t("detail.recetaPropia")}
                </span>
              )}
              {receta.tiempoPreparacion !== null && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-muted font-medium inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {receta.tiempoPreparacion} min
                </span>
              )}
            </div>
            {receta.descripcion && (
              <p className="text-muted-foreground mt-3 max-w-2xl">{receta.descripcion}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {receta.esGlobal && (
              <FavoritoButton recetaId={receta.id} inicial={receta.favorito} />
            )}
            {!receta.esGlobal && (
              <>
                <Link
                  href={`/recetas/${receta.id}/editar`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
                >
                  <Pencil className="w-4 h-4" />
                  {t("detail.editar")}
                </Link>
                <RecetaActions recetaId={receta.id} />
              </>
            )}
          </div>
        </div>
      </div>

      <IngredientesLista
        ingredientes={receta.ingredientes.map((ing) => ({
          id: ing.id,
          cantidad: ing.cantidad,
          unidad: ing.unidad,
          alimento: {
            id: ing.alimento.id,
            nombre: ing.alimento.nombre,
            calorias: ing.alimento.calorias,
            proteinas: ing.alimento.proteinas,
            carbohidratos: ing.alimento.carbohidratos,
            grasas: ing.alimento.grasas,
            fibra: ing.alimento.fibra,
            porcion: ing.alimento.porcion,
          },
        }))}
        porciones={receta.porciones}
        instrucciones={receta.instrucciones}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mt-6">
        <div className="lg:col-span-2 flex">
          <MacroAnalysisCard
            title={t("detail.macrosPorPorcion")}
            proteinas={receta.proteinas}
            carbohidratos={receta.carbohidratos}
            grasas={receta.grasas}
            fibra={receta.fibra}
          />
        </div>
        <PorcionesCalculadora
          calorias={receta.calorias}
          proteinas={receta.proteinas}
          carbohidratos={receta.carbohidratos}
          grasas={receta.grasas}
          fibra={receta.fibra}
          porcionesReceta={receta.porciones}
        />
      </div>

      <div className="mt-6">
        <MicronutrientesCard
          values={receta.micros}
          title={t("detail.micronutrientesPorPorcion")}
          subtitleSuffix={t("detail.subtituloDdrPorPorcion")}
        />
      </div>
    </div>
  );
}
