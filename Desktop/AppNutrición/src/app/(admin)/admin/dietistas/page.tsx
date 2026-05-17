import { Users } from "lucide-react";
import { getDietistasAdmin } from "@/app/actions/admin";
import { DietistasFilter } from "./dietistas-filter";
import { DietistasList } from "./dietistas-list";
import { getTranslations } from "next-intl/server";

interface Props {
  searchParams: Promise<{ busqueda?: string }>;
}

export default async function DietistasAdminPage({ searchParams }: Props) {
  const t = await getTranslations("admin.dietistas");
  const { busqueda } = await searchParams;
  const dietistas = await getDietistasAdmin(busqueda);

  const totalPacientes = dietistas.reduce((sum, d) => sum + d._count.pacientes, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle", {
              count: dietistas.length,
              countPlural: dietistas.length !== 1 ? "s" : "",
              totalPacientes,
              pacientesPlural: totalPacientes !== 1 ? "s" : "",
            })}
          </p>
        </div>
      </div>

      <DietistasFilter />

      {dietistas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">
            {busqueda ? t("empty.sinResultados") : t("empty.sinDietistas")}
          </h3>
          <p className="text-muted-foreground">
            {busqueda
              ? t("empty.noEncontrados", { query: busqueda })
              : t("empty.noRegistrados")}
          </p>
        </div>
      ) : (
        <DietistasList dietistas={dietistas} />
      )}
    </div>
  );
}
