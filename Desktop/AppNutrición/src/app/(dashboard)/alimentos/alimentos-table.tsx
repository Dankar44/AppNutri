"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MacroBadges } from "@/components/macro-badge";
import { cargarMasAlimentos } from "@/app/actions/alimentos";
import { UNIDAD_LABELS } from "@/lib/units";
import { StockBadge } from "@/components/alimento/stock-badge";

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
  stock?: number | null;
  stockMinimo?: number | null;
  compartido?: boolean;
  dietistaId?: string | null;
  dietista?: { email: string } | null;
};

const CATEGORIA_KEY_MAP: Record<string, string> = {
  FRUTAS: "frutas",
  VERDURAS: "verduras",
  CEREALES: "cereales",
  LEGUMBRES: "legumbres",
  CARNES: "carnes",
  PESCADOS: "pescados",
  LACTEOS: "lacteos",
  HUEVOS: "huevos",
  FRUTOS_SECOS: "frutosSecos",
  ACEITES: "aceites",
  BEBIDAS: "bebidas",
  CONDIMENTOS: "condimentos",
  DULCES: "dulces",
  OTROS: "otros",
};

interface Props {
  initial: Alimento[];
  initialCursor: string | null;
  busqueda?: string;
  categoria?: string;
  propios?: boolean;
  fuenteCentro?: boolean;
  currentDietistaId?: string;
}

export function AlimentosTable({ initial, initialCursor, busqueda, categoria, propios, fuenteCentro, currentDietistaId }: Props) {
  const t = useTranslations("foods");
  const router = useRouter();
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
      const res = await cargarMasAlimentos(cursor, busqueda, categoria, propios, fuenteCentro ? "centro" : undefined);
      setAlimentos((prev) => [...prev, ...res.alimentos]);
      setCursor(res.nextCursor);
    });
  }, [cursor, isPending, busqueda, categoria, propios, fuenteCentro]);

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
      {/* Mobile: cards */}
      <div className="sm:hidden divide-y divide-border">
        {alimentos.map((alimento) => {
          const isFromOther = currentDietistaId && alimento.dietistaId && alimento.dietistaId !== currentDietistaId;
          return (
            <Link
              key={alimento.id}
              href={`/alimentos/${alimento.id}`}
              className={`flex items-center justify-between gap-3 px-3 py-3 hover:bg-muted/50 transition-colors ${isFromOther ? "border-l-2 border-l-purple-400" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium truncate">{alimento.nombre}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-medium shrink-0">
                    {CATEGORIA_KEY_MAP[alimento.categoria] ? t(`categorias.${CATEGORIA_KEY_MAP[alimento.categoria]}`) : alimento.categoria}
                  </span>
                  {isFromOther && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 shrink-0">
                      {t("table.deCentro")}
                    </span>
                  )}
                  {alimento.compartido && !isFromOther && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 shrink-0">
                      {t("table.compartido")}
                    </span>
                  )}
                </div>
                {isFromOther && alimento.dietista?.email && (
                  <span className="text-[11px] text-muted-foreground">{alimento.dietista.email}</span>
                )}
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  <MacroBadges
                    calorias={alimento.calorias}
                    proteinas={alimento.proteinas}
                    carbohidratos={alimento.carbohidratos}
                    grasas={alimento.grasas}
                  />
                  {alimento.stock !== null && alimento.stock !== undefined && (
                    <StockBadge stock={alimento.stock} stockMinimo={alimento.stockMinimo ?? null} />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Desktop: table */}
      <table className="w-full hidden sm:table">
        <thead>
          <tr className="border-b border-border text-left text-sm text-muted-foreground">
            <th className="px-4 py-3 font-medium">{t("table.headerNombre")}</th>
            <th className="px-4 py-3 font-medium">{t("table.headerCategoria")}</th>
            <th className="px-4 py-3 font-medium hidden md:table-cell">{t("table.headerPorcion")}</th>
            <th className="px-4 py-3 font-medium">{t("table.headerMacros")}</th>
            <th className="px-4 py-3 font-medium hidden lg:table-cell">{t("table.headerOrigen")}</th>
          </tr>
        </thead>
        <tbody>
          {alimentos.map((alimento) => {
            const isFromOther = currentDietistaId && alimento.dietistaId && alimento.dietistaId !== currentDietistaId;
            return (
            <tr
              key={alimento.id}
              onClick={() => router.push(`/alimentos/${alimento.id}`)}
              className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer ${isFromOther ? "border-l-2 border-l-purple-400" : ""}`}
            >
              <td className="px-4 py-3">
                <span className="text-sm font-medium">
                  {alimento.nombre}
                </span>
                {isFromOther && alimento.dietista?.email && (
                  <span className="block text-[11px] text-muted-foreground mt-0.5">{alimento.dietista.email}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                  {CATEGORIA_KEY_MAP[alimento.categoria] ? t(`categorias.${CATEGORIA_KEY_MAP[alimento.categoria]}`) : alimento.categoria}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                {alimento.unidad === "GRAMOS" || alimento.unidad === "MILILITROS"
                  ? `${alimento.porcion}${UNIDAD_LABELS[alimento.unidad]}`
                  : `1 ${UNIDAD_LABELS[alimento.unidad] || alimento.unidad} (${alimento.porcion}g)`}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <MacroBadges
                    calorias={alimento.calorias}
                    proteinas={alimento.proteinas}
                    carbohidratos={alimento.carbohidratos}
                    grasas={alimento.grasas}
                  />
                  {alimento.stock !== null && alimento.stock !== undefined && (
                    <StockBadge stock={alimento.stock} stockMinimo={alimento.stockMinimo ?? null} />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      alimento.origen === "API"
                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        : "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                    }`}
                  >
                    {alimento.origen === "API" ? t("table.importado") : t("table.personalizado")}
                  </span>
                  {isFromOther && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400">
                      {t("table.deCentro")}
                    </span>
                  )}
                  {alimento.compartido && !isFromOther && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400">
                      {t("table.compartido")}
                    </span>
                  )}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>

      {/* Sentinel para infinite scroll */}
      <div ref={sentinelRef} className="h-1" />

      {isPending && (
        <div className="flex items-center justify-center py-4 text-muted-foreground text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t("list.cargandoMas")}
        </div>
      )}

      {!cursor && alimentos.length > 0 && (
        <div className="text-center py-3 text-xs text-muted-foreground">
          {t("list.alimentosMostrados", { count: alimentos.length })}
        </div>
      )}
    </div>
  );
}
