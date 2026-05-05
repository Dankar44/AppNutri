"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { MacroBadges } from "@/components/macro-badge";
import { cargarMasAlimentos } from "@/app/actions/alimentos";
import { UNIDAD_LABELS } from "@/lib/units";

type Alimento = {
  id: string;
  nombre: string;
  categoria: string;
  porcion: number;
  unidad: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  origen: string;
};

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

interface Props {
  initial: Alimento[];
  initialCursor: string | null;
  busqueda?: string;
  categoria?: string;
}

export function AlimentosTable({ initial, initialCursor, busqueda, categoria }: Props) {
  const [alimentos, setAlimentos] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset cuando cambian los filtros
  useEffect(() => {
    setAlimentos(initial);
    setCursor(initialCursor);
  }, [initial, initialCursor]);

  const loadMore = useCallback(() => {
    if (!cursor || isPending) return;
    startTransition(async () => {
      const res = await cargarMasAlimentos(cursor, busqueda, categoria);
      setAlimentos((prev) => [...prev, ...res.alimentos]);
      setCursor(res.nextCursor);
    });
  }, [cursor, isPending, busqueda, categoria]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
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
                {alimento.unidad === "GRAMOS" || alimento.unidad === "MILILITROS"
                  ? `${alimento.porcion}${UNIDAD_LABELS[alimento.unidad]}`
                  : `1 ${UNIDAD_LABELS[alimento.unidad] || alimento.unidad} (${alimento.porcion}g)`}
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
                      ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      : "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                  }`}
                >
                  {alimento.origen === "API" ? "Importado" : "Personalizado"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Sentinel para infinite scroll */}
      <div ref={sentinelRef} className="h-1" />

      {isPending && (
        <div className="flex items-center justify-center py-4 text-muted-foreground text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Cargando más alimentos...
        </div>
      )}

      {!cursor && alimentos.length > 0 && (
        <div className="text-center py-3 text-xs text-muted-foreground">
          {alimentos.length} alimentos mostrados
        </div>
      )}
    </div>
  );
}
