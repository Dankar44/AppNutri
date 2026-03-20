import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { getReceta } from "@/app/actions/recetas";
import { MacroBadges } from "@/components/macro-badge";
import { MacroResumen } from "@/components/macro-resumen";
import { calcularMacrosPorcion } from "@/lib/macros";
import { RecetaActions } from "./receta-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RecetaDetailPage({ params }: Props) {
  const { id } = await params;
  const receta = await getReceta(id);
  if (!receta) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/recetas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a recetas
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{receta.nombre}</h1>
            {receta.descripcion && (
              <p className="text-muted-foreground mt-1">{receta.descripcion}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {receta.porciones} porcion{receta.porciones !== 1 ? "es" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/recetas/${receta.id}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Link>
            <RecetaActions recetaId={receta.id} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4">
              Ingredientes ({receta.ingredientes.length})
            </h2>
            <div className="space-y-2">
              {receta.ingredientes.map((ing) => {
                const macros = calcularMacrosPorcion(
                  {
                    calorias: ing.alimento.calorias,
                    proteinas: ing.alimento.proteinas,
                    carbohidratos: ing.alimento.carbohidratos,
                    grasas: ing.alimento.grasas,
                    fibra: ing.alimento.fibra,
                  },
                  ing.cantidad
                );
                return (
                  <div
                    key={ing.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ing.alimento.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {ing.cantidad}g
                      </p>
                    </div>
                    <MacroBadges
                      calorias={macros.calorias}
                      proteinas={macros.proteinas}
                      carbohidratos={macros.carbohidratos}
                      grasas={macros.grasas}
                    />
                  </div>
                );
              })}
            </div>
          </section>

          {receta.instrucciones && (
            <section className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-3">Instrucciones</h2>
              <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                {receta.instrucciones}
              </p>
            </section>
          )}
        </div>

        <div>
          <section className="bg-card rounded-xl border border-border p-6">
            <MacroResumen
              label="Macros por porción"
              calorias={receta.calorias}
              proteinas={receta.proteinas}
              carbohidratos={receta.carbohidratos}
              grasas={receta.grasas}
              fibra={receta.fibra}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
