import Link from "next/link";
import { Plus, CookingPot, Search } from "lucide-react";
import { getRecetas } from "@/app/actions/recetas";
import { MacroBadges } from "@/components/macro-badge";
import { RecetasFilter } from "./recetas-filter";

interface Props {
  searchParams: Promise<{ busqueda?: string }>;
}

export default async function RecetasPage({ searchParams }: Props) {
  const { busqueda } = await searchParams;
  const recetas = await getRecetas(busqueda);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Recetas</h1>
          <p className="text-muted-foreground mt-1">
            {recetas.length} receta{recetas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/recetas/nueva"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva receta
        </Link>
      </div>

      <RecetasFilter />

      {recetas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CookingPot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">Sin recetas</h3>
          <p className="text-muted-foreground mb-4">
            {busqueda
              ? "No se encontraron recetas con ese nombre"
              : "Crea tu primera receta con ingredientes y macros calculados"}
          </p>
          {!busqueda && (
            <Link
              href="/recetas/nueva"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Crear receta
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recetas.map((receta) => (
            <Link
              key={receta.id}
              href={`/recetas/${receta.id}`}
              className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <h3 className="font-semibold mb-1">{receta.nombre}</h3>
              {receta.descripcion && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {receta.descripcion}
                </p>
              )}
              <div className="flex items-center justify-between mt-3">
                <MacroBadges
                  calorias={receta.calorias}
                  proteinas={receta.proteinas}
                  carbohidratos={receta.carbohidratos}
                  grasas={receta.grasas}
                />
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {receta.porciones} porc.
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
