import Link from "next/link";
import { ArrowLeft, BookCopy } from "lucide-react";
import { getPlantillas } from "@/app/actions/plantillas";
import { PlantillaCard } from "./plantilla-card";
import { PlantillasFilter } from "./plantillas-filter";
import { getTranslations } from "next-intl/server";

interface Props {
  searchParams: Promise<{ busqueda?: string }>;
}

export default async function PlantillasPage({ searchParams }: Props) {
  const { busqueda } = await searchParams;
  const [plantillas, t] = await Promise.all([
    getPlantillas(busqueda),
    getTranslations("diets.plantillas"),
  ]);

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dietas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToPlans")}
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t("pageTitle")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("subtitle", { count: plantillas.length })}
            </p>
          </div>
        </div>
      </div>

      <PlantillasFilter />

      {plantillas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <BookCopy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">
            {busqueda ? t("noResultsTitle") : t("noTemplatesTitle")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {busqueda
              ? t("noResultsMessage", { query: busqueda })
              : t("emptyMessage")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plantillas.map((plantilla) => {
            const datos = (plantilla.datos as unknown as {
              dia: string;
              comidas: { tipo: string; alimentos: unknown[] }[];
            }[]) || [];
            const totalComidas = datos.reduce(
              (acc, dia) => acc + (dia.comidas ?? []).reduce((a, c) => a + (c.alimentos?.length ?? 0), 0),
              0
            );

            return (
              <PlantillaCard
                key={plantilla.id}
                id={plantilla.id}
                nombre={plantilla.nombre}
                createdAt={plantilla.createdAt}
                diasCount={datos.length}
                alimentosCount={totalComidas}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
