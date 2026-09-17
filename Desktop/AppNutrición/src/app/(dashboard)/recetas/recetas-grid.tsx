"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Carrot, Check, Clock, Sparkles, Share2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { MacroBadges } from "@/components/macro-badge";
import { FavoritoButton } from "./favorito-button";
import { MAX_RECETAS_RECETARIO } from "@/lib/pdf/generate-recetario-pdf";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 30;
const RECETARIO_SELECTION_STORAGE_KEY = "annonia-recetario-seleccionadas";

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
  compartida?: boolean;
  ajena?: boolean;
};

export function RecetasGrid({ recetas }: { recetas: Receta[] }) {
  const t = useTranslations("recipes");
  const router = useRouter();
  const total = recetas.length;
  const [visibles, setVisibles] = useState(Math.min(PAGE_SIZE, total));
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [seleccionCargada, setSeleccionCargada] = useState(false);

  // Al cambiar el listado (tras aplicar filtros/búsqueda) reiniciamos al top
  useEffect(() => {
    setVisibles(Math.min(PAGE_SIZE, total));
  }, [total, recetas]);

  // La selección debe sobrevivir al cambio entre "Mis recetas" y "Recetas de la app" para poder
  // crear un recetario mixto. Se guarda solo durante esta sesión/pestaña: no es persistencia de la app.
  useEffect(() => {
    try {
      const guardadas = JSON.parse(sessionStorage.getItem(RECETARIO_SELECTION_STORAGE_KEY) || "[]");
      if (Array.isArray(guardadas)) {
        setSeleccionadas(guardadas.filter((id): id is string => typeof id === "string"));
      }
    } catch {
      // Si el navegador no permite almacenamiento, la selección funciona igualmente en la vista actual.
    } finally {
      setSeleccionCargada(true);
    }
  }, []);

  useEffect(() => {
    if (!seleccionCargada) return;
    try {
      sessionStorage.setItem(RECETARIO_SELECTION_STORAGE_KEY, JSON.stringify(seleccionadas));
    } catch {
      // La selección en memoria sigue disponible aunque el almacenamiento esté bloqueado.
    }
  }, [seleccionadas, seleccionCargada]);

  const items = useMemo(() => recetas.slice(0, visibles), [recetas, visibles]);
  const quedan = total - visibles;

  function alternarSeleccion(id: string) {
    setSeleccionadas((previas) => {
      if (previas.includes(id)) return previas.filter((actual) => actual !== id);
      if (previas.length >= MAX_RECETAS_RECETARIO) {
        toast.error(t("recetario.errorDemasiadas", { max: MAX_RECETAS_RECETARIO }));
        return previas;
      }
      return [...previas, id];
    });
  }

  function limpiarSeleccion() {
    setSeleccionadas([]);
  }

  function abrirRecetario() {
    if (seleccionadas.length === 0) {
      toast.error(t("recetario.errorSinSeleccion"));
      return;
    }
    router.push(`/recetas/recetario?ids=${encodeURIComponent(seleccionadas.join(","))}`);
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{t("recetario.seleccionTitulo")}</p>
            <p className="text-xs text-muted-foreground">
              {seleccionadas.length > 0
                ? t("recetario.seleccionadas", { count: seleccionadas.length, max: MAX_RECETAS_RECETARIO })
                : t("recetario.seleccionAyuda", { max: MAX_RECETAS_RECETARIO })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          {seleccionadas.length > 0 && (
            <button
              type="button"
              onClick={limpiarSeleccion}
              aria-label={t("recetario.limpiar")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              <X className="h-4 w-4" />
              <span className="hidden xs:inline">{t("recetario.limpiar")}</span>
            </button>
          )}
          <button
            type="button"
            onClick={abrirRecetario}
            disabled={seleccionadas.length === 0}
            className={cn(
              "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors sm:flex-none",
              seleccionadas.length > 0
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            <BookOpen className="h-4 w-4" />
            {t("recetario.generar", { count: seleccionadas.length })}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((receta) => {
          const seleccionada = seleccionadas.includes(receta.id);
          return (
            <div
              key={receta.id}
              className={cn(
                "relative rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-sm",
                seleccionada && "border-primary ring-2 ring-primary/15",
              )}
            >
              <label
                className="absolute left-1.5 top-1.5 z-10 flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-muted"
                aria-label={t("recetario.seleccionarReceta", { nombre: receta.nombre })}
              >
                <input
                  type="checkbox"
                  checked={seleccionada}
                  onChange={() => alternarSeleccion(receta.id)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded border-2 transition-colors",
                    seleccionada
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background",
                  )}
                  aria-hidden="true"
                >
                  {seleccionada && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
              </label>
              {receta.esGlobal && (
                <div className="absolute top-3 right-3">
                  <FavoritoButton recetaId={receta.id} inicial={receta.favorito} size="sm" />
                </div>
              )}
              <Link href={`/recetas/${receta.id}`} className="block">
                <div className="flex items-center gap-2 mb-1 pl-8 pr-8">
                  <h3 className="font-semibold truncate">{receta.nombre}</h3>
                  {receta.esGlobal && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                      <Sparkles className="w-2.5 h-2.5" />
                      App
                    </span>
                  )}
                  {/* Lo mismo que ya hacía la lista de alimentos: se ve de un vistazo qué está
                      compartido y qué es de otro, sin tener que abrirlo. */}
                  {receta.ajena && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 shrink-0">
                      <Share2 className="w-2.5 h-2.5" />
                      {t("list.meLaComparten")}
                    </span>
                  )}
                  {receta.compartida && !receta.ajena && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 shrink-0">
                      <Share2 className="w-2.5 h-2.5" />
                      {t("list.compartida")}
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
                  {/* Casi todas las recetas son de 1 ración (= 1 persona): decirlo en cada
                      tarjeta es ruido. Solo se marca la tanda, que sí es información. */}
                  {receta.porciones > 1 && (
                    <>
                      <span>·</span>
                      <span>{t("grid.rinde", { n: receta.porciones })}</span>
                    </>
                  )}
                </div>
                <MacroBadges
                  calorias={receta.calorias}
                  proteinas={receta.proteinas}
                  carbohidratos={receta.carbohidratos}
                  grasas={receta.grasas}
                />
              </Link>
            </div>
          );
        })}
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
