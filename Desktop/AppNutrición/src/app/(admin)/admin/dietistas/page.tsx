import { Users } from "lucide-react";
import { getDietistasAdmin } from "@/app/actions/admin";
import { DietistasFilter } from "./dietistas-filter";
import { DietistasList } from "./dietistas-list";

interface Props {
  searchParams: Promise<{ busqueda?: string }>;
}

export default async function DietistasAdminPage({ searchParams }: Props) {
  const { busqueda } = await searchParams;
  const dietistas = await getDietistasAdmin(busqueda);

  const totalPacientes = dietistas.reduce((sum, d) => sum + d._count.pacientes, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dietistas registrados</h1>
          <p className="text-muted-foreground mt-1">
            {dietistas.length} dietista{dietistas.length !== 1 ? "s" : ""} · {totalPacientes} paciente{totalPacientes !== 1 ? "s" : ""} en total
          </p>
        </div>
      </div>

      <DietistasFilter />

      {dietistas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">
            {busqueda ? "Sin resultados" : "Sin dietistas"}
          </h3>
          <p className="text-muted-foreground">
            {busqueda
              ? `No se encontraron dietistas para "${busqueda}"`
              : "No hay dietistas registrados en la plataforma"}
          </p>
        </div>
      ) : (
        <DietistasList dietistas={dietistas} />
      )}
    </div>
  );
}
