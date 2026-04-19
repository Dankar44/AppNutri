import Link from "next/link";
import { Plus, Download, Apple } from "lucide-react";
import { getAlimentosPaginados } from "@/app/actions/alimentos";
import { AlimentosFilter } from "./alimentos-filter";
import { AlimentosTable } from "./alimentos-table";
import { PageHeader } from "@/components/page-header";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AlimentosPage({ searchParams }: Props) {
  const params = await searchParams;
  const { busqueda, categoria, origen, calMin, calMax, protMin, protMax, carbMin, carbMax, grasaMin, grasaMax } = params;

  const MICRO_KEYS = [
    "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
    "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
    "folato","acidoPantotenico","colina","calcio","hierro",
    "magnesio","fosforo","potasio","sodio","cinc",
    "cobre","manganeso","selenio","fluor",
  ];
  const microMin: Record<string, number> = {};
  for (const k of MICRO_KEYS) {
    const v = params[`m_${k}`];
    if (v) {
      const n = parseFloat(v);
      if (!isNaN(n) && n > 0) microMin[k] = n;
    }
  }

  const { alimentos, total, nextCursor } = await getAlimentosPaginados(
    busqueda,
    categoria as Parameters<typeof getAlimentosPaginados>[1],
    undefined,
    {
      origen,
      calMin: calMin ? parseFloat(calMin) : undefined,
      calMax: calMax ? parseFloat(calMax) : undefined,
      protMin: protMin ? parseFloat(protMin) : undefined,
      protMax: protMax ? parseFloat(protMax) : undefined,
      carbMin: carbMin ? parseFloat(carbMin) : undefined,
      carbMax: carbMax ? parseFloat(carbMax) : undefined,
      grasaMin: grasaMin ? parseFloat(grasaMin) : undefined,
      grasaMax: grasaMax ? parseFloat(grasaMax) : undefined,
      microMin: Object.keys(microMin).length ? microMin : undefined,
    }
  );

  return (
    <div>
      <PageHeader
        icon={Apple}
        title="Alimentos"
        subtitle={`${total} alimento${total !== 1 ? "s" : ""} en tu base de datos`}
        action={
          <div className="flex gap-2">
            <Link
              href="/alimentos/importar"
              data-tour="import-btn"
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
        }
      />

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
