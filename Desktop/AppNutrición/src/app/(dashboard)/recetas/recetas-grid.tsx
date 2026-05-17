"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Carrot, Clock, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { MacroBadges } from "@/components/macro-badge";
import { FavoritoButton } from "./favorito-button";

const PAGE_SIZE = 30;

type Receta = {
  id: string;
  nombre: string;
  descripcion: string | null;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  porciones: number;
  numIngredientes: number;
  tiempoPreparacion: number | null;
  esGlobal: boolean;
  favorito: boolean;
};

export function RecetasGrid({ recetas }: { recetas: Receta[] }) {
  const t = useTranslations("recipes");
  const total = recetas.length;
  const [visibles, setVisibles] = useState(Math.min(PAGE_SIZE, total));

  // Al cambiar el listado (tras aplicar filtros/búsqueda) reiniciamos al top
  useEffect(() => {
    setVisibles(Math.min(PAGE_SIZE, total));
  }, [total, recetas]);

  const items = useMemo(() => recetas.slice(0, visibles), [recetas, visibles]);
  const quedan = total - visibles;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((receta) => (
          <div
            key={receta.id}
            className="relative bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            {receta.esGlobal && (
              <div className="absolute top-3 right-3">
                <FavoritoButton recetaId={receta.id} inicial={receta.favorito} size="sm" />
              </div>
            )}
            <Link href={`/recetas/${receta.id}`} className="block">
              <div className="flex items-center gap-2 mb-1 pr-8">
                <h3 className="font-semibold truncate">{receta.nombre}</h3>
                {receta.esGlobal && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                    <Sparkles className="w-2.5 h-2.5" />
                    App
                  </span>
                )}
              </div>
              {receta.descripcion && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {receta.descripcion}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="inline-flex items-center gap-1">
                  <Carrot className="w-3.5 h-3.5" />
                  {receta.numIngredientes} {t("grid.ing")}
                </span>
                {receta.tiempoPreparacion !== null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {receta.tiempoPreparacion} min
                  </span>
                )}
                <span>·</span>
                <span>{receta.porciones} {t("grid.porc")}</span>
              </div>
              <MacroBadges
                calorias={receta.calorias}
                proteinas={receta.proteinas}
                carbohidratos={receta.carbohidratos}
                grasas={receta.grasas}
              />
            </Link>
          </div>
        ))}
      </div>

      {quedan > 0 && (
        <div className="flex flex-col items-center gap-2 mt-6">
          <p className="text-xs text-muted-foreground">
            {t("list.mostrandoDe", { visibles, total })}
          </p>
          <div className="flex flex-col xs:flex-row gap-2 w-full xs:w-auto">
            <button
              type="button"
              onClick={() => setVisibles((v) => Math.min(v + PAGE_SIZE, total))}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium min-h-11"
            >
              {t("list.verMas", { count: Math.min(PAGE_SIZE, quedan) })}
            </button>
            {quedan > PAGE_SIZE && (
              <button
                type="button"
                onClick={() => setVisibles(total)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium min-h-11"
              >
                {t("list.verTodas", { count: quedan })}
              </button>
            )}
          </div>
        </div>
      )}

      {quedan === 0 && total > PAGE_SIZE && (
        <p className="text-center text-xs text-muted-foreground mt-6">
          {t("list.mostrandoTodas", { total })}
        </p>
      )}
    </>
  );
}
