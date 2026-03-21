import Link from "next/link";
import { Plus, Download, Apple } from "lucide-react";
import { getAlimentosPaginados } from "@/app/actions/alimentos";
import { AlimentosFilter } from "./alimentos-filter";
import { AlimentosTable } from "./alimentos-table";

interface Props {
  searchParams: Promise<{ busqueda?: string; categoria?: string }>;
}

export default async function AlimentosPage({ searchParams }: Props) {
  const { busqueda, categoria } = await searchParams;
  const { alimentos, total, nextCursor } = await getAlimentosPaginados(
    busqueda,
    categoria as Parameters<typeof getAlimentosPaginados>[1]
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Alimentos</h1>
          <p className="text-muted-foreground mt-1">
            {total} alimento{total !== 1 ? "s" : ""} en tu base de datos
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/alimentos/importar"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Importar
          </Link>
          <Link
            href="/alimentos/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo alimento
          </Link>
        </div>
      </div>

      <AlimentosFilter />

      {alimentos.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Apple className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">Sin alimentos</h3>
          <p className="text-muted-foreground mb-4">
            {busqueda || categoria
              ? "No se encontraron alimentos con esos filtros"
              : "Empieza añadiendo alimentos a tu base de datos"}
          </p>
          {!busqueda && !categoria && (
            <Link
              href="/alimentos/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Crear alimento
            </Link>
          )}
        </div>
      ) : (
        <AlimentosTable
          initial={alimentos}
          initialCursor={nextCursor}
          busqueda={busqueda}
          categoria={categoria}
        />
      )}
    </div>
  );
}
