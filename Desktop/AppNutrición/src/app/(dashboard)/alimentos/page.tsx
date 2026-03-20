import Link from "next/link";
import { Plus, Download, Apple } from "lucide-react";
import { getAlimentos } from "@/app/actions/alimentos";
import { MacroBadges } from "@/components/macro-badge";
import { AlimentosFilter } from "./alimentos-filter";

interface Props {
  searchParams: Promise<{ busqueda?: string; categoria?: string }>;
}

const CATEGORIA_LABELS: Record<string, string> = {
  FRUTAS: "Frutas",
  VERDURAS: "Verduras",
  CEREALES: "Cereales",
  LEGUMBRES: "Legumbres",
  CARNES: "Carnes",
  PESCADOS: "Pescados",
  LACTEOS: "Lácteos",
  HUEVOS: "Huevos",
  FRUTOS_SECOS: "Frutos secos",
  ACEITES: "Aceites",
  BEBIDAS: "Bebidas",
  CONDIMENTOS: "Condimentos",
  DULCES: "Dulces",
  OTROS: "Otros",
};

export default async function AlimentosPage({ searchParams }: Props) {
  const { busqueda, categoria } = await searchParams;
  const alimentos = await getAlimentos(
    busqueda,
    categoria as Parameters<typeof getAlimentos>[1]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Alimentos</h1>
          <p className="text-muted-foreground mt-1">
            {alimentos.length} alimento{alimentos.length !== 1 ? "s" : ""} en tu
            base de datos
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
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Categoría</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Porción</th>
                <th className="px-4 py-3 font-medium">Macros / 100g</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Origen</th>
              </tr>
            </thead>
            <tbody>
              {alimentos.map((alimento) => (
                <tr
                  key={alimento.id}
                  className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/alimentos/${alimento.id}`}
                      className="text-sm font-medium hover:text-primary transition-colors"
                    >
                      {alimento.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                      {CATEGORIA_LABELS[alimento.categoria] || alimento.categoria}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {alimento.porcion}g
                  </td>
                  <td className="px-4 py-3">
                    <MacroBadges
                      calorias={alimento.calorias}
                      proteinas={alimento.proteinas}
                      carbohidratos={alimento.carbohidratos}
                      grasas={alimento.grasas}
                    />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        alimento.origen === "API"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {alimento.origen === "API" ? "Importado" : "Personalizado"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
