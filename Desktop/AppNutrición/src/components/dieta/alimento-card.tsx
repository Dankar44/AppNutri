"use client";

import { useTranslations } from "next-intl";
import { Trash2, GripVertical, ListFilter, ExternalLink, Image as ImageLinkIcon } from "lucide-react";
import { useState, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { getUnidadLabel } from "@/lib/units";
import { convertirAGramos } from "@/lib/macros";
import { FoodHoverCard, type InteractionMode } from "@/components/food-hover-card";

interface AlimentoCardProps {
  id: string;
  alimentoRealId?: string | null;
  nombre: string;
  cantidad: number;
  unidad?: string;
  porcion?: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra?: number;
  esReceta?: boolean;
  esPropio?: boolean;
  enlaceProducto?: string | null;
  imagenUrl?: string | null;
  recetaIngredientes?: { nombre: string; cantidad: number; unidad: string }[];
  recetaDescripcion?: string | null;
  recetaPorciones?: number;
  readOnly?: boolean;
  interactionMode?: InteractionMode;
  ocultarCalorias?: boolean;
  onRemove: (id: string) => void;
  onCantidadChange: (id: string, cantidad: number) => void;
  onBuscarEquivalente?: (alimentoId: string, nombre: string, calorias: number, proteinas: number, carbohidratos: number, grasas: number, cantidad: number) => void;
}

export function AlimentoCard({
  id,
  alimentoRealId,
  nombre,
  cantidad,
  unidad,
  porcion,
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  fibra,
  esReceta,
  esPropio,
  enlaceProducto,
  imagenUrl,
  recetaIngredientes,
  recetaDescripcion,
  recetaPorciones,
  readOnly = false,
  interactionMode = "dashboard",
  ocultarCalorias = false,
  onRemove,
  onCantidadChange,
  onBuscarEquivalente,
}: AlimentoCardProps) {
  const t = useTranslations("diets");
  const [tempCantidad, setTempCantidad] = useState(cantidad);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data: { id, nombre, cantidad, unidad, porcion, calorias, proteinas, carbohidratos, grasas },
    });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  function handleCantidadChange(value: number) {
    setTempCantidad(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onCantidadChange(id, value);
    }, 500);
  }

  const unidadLabel = getUnidadLabel(unidad || "GRAMOS", esReceta);
  const realId = alimentoRealId || id;
  const href = interactionMode === "dashboard"
    ? (esReceta
      ? `/recetas/${realId}?porciones=${cantidad}`
      : `/alimentos/${realId}?cantidad=${Math.round(convertirAGramos(cantidad, unidad || "GRAMOS", porcion || 100))}`)
    : null;

  const nameColor = esReceta
    ? "text-purple-600 dark:text-purple-400"
    : esPropio
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-foreground";

  const foodHoverProps = {
    nombre,
    calorias,
    proteinas,
    carbohidratos,
    grasas,
    fibra: fibra ?? 0,
    cantidad,
    unidad: unidad || "GRAMOS",
    porcion,
    esReceta,
    esPropio,
    recetaIngredientes,
    recetaDescripcion,
    recetaPorciones,
    enlaceProducto,
    imagenUrl,
    href,
    interactionMode,
    ocultarCalorias,
  };

  if (readOnly) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50 last:border-b-0">
        <div className="flex-1 min-w-0 flex items-center gap-1.5 text-sm">
          <span className="w-16 sm:w-14 px-2 py-1 sm:px-1.5 sm:py-0.5 text-base sm:text-sm text-right tabular-nums font-medium">
            {cantidad}
          </span>
          <span className="text-muted-foreground text-sm shrink-0">
            {unidadLabel} {t("alimentoCard.unitConnector")}
          </span>
          <FoodHoverCard {...foodHoverProps}>
            <span className={cn("truncate font-medium", nameColor, interactionMode === "dashboard" && "hover:underline")}>{nombre}</span>
          </FoodHoverCard>
          {enlaceProducto && (
            <a href={enlaceProducto} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0">
              <ExternalLink className="w-3.5 h-3.5 text-primary/60 hover:text-primary" />
            </a>
          )}
          {imagenUrl && (
            <a href={imagenUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0">
              <ImageLinkIcon className="w-3.5 h-3.5 text-violet-400 hover:text-violet-600" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 touch-none",
        "border-b border-border/50 last:border-b-0",
        "hover:bg-muted/30 transition-colors",
        isDragging && "opacity-50 shadow-lg z-50 bg-card"
      )}
    >
      <button
        {...listeners}
        {...attributes}
        className="p-0.5 rounded cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0 flex items-center gap-1.5 text-sm">
        <input
          type="number"
          inputMode="decimal"
          value={tempCantidad}
          onChange={(e) => handleCantidadChange(parseFloat(e.target.value) || 0)}
          className="w-16 sm:w-14 px-2 py-1 sm:px-1.5 sm:py-0.5 text-base sm:text-sm rounded border border-transparent hover:border-border focus:border-primary/50 bg-transparent text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/20"
          min={0}
          max={10000}
        />
        <span className="text-muted-foreground text-sm shrink-0">
          {unidadLabel} {t("alimentoCard.unitConnector")}
        </span>
        <FoodHoverCard {...foodHoverProps}>
          <span className={cn("truncate font-medium", nameColor, interactionMode === "dashboard" && "hover:underline")}>{nombre}</span>
        </FoodHoverCard>
        {enlaceProducto && (
          <a href={enlaceProducto} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0">
            <ExternalLink className="w-3.5 h-3.5 text-primary/60 hover:text-primary" />
          </a>
        )}
        {imagenUrl && (
          <a href={imagenUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0">
            <ImageLinkIcon className="w-3.5 h-3.5 text-violet-400 hover:text-violet-600" />
          </a>
        )}
      </div>

      {onBuscarEquivalente && !esReceta && (
        <button
          onClick={() => onBuscarEquivalente(id, nombre, calorias, proteinas, carbohidratos, grasas, convertirAGramos(cantidad, unidad || "GRAMOS", porcion || 100))}
          className="p-1.5 rounded border border-border/60 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground/50 hover:text-primary transition-all shrink-0"
          title={t("alimentoCard.searchEquivalent")}
        >
          <ListFilter className="w-4 h-4" />
        </button>
      )}

      <button
        onClick={() => onRemove(id)}
        className="p-1.5 rounded border border-border/60 hover:bg-red-50 dark:hover:bg-red-500/15 hover:border-red-200 text-muted-foreground/50 hover:text-red-500 transition-all shrink-0"
        title={t("alimentoCard.delete")}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
