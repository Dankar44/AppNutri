"use client";

import { Trash2, GripVertical, CookingPot } from "lucide-react";
import { useState, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { MacroBadges } from "@/components/macro-badge";
import { calcularMacrosPorcion } from "@/lib/macros";
import { cn } from "@/lib/utils";

interface AlimentoCardProps {
  id: string;
  nombre: string;
  cantidad: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  esReceta?: boolean;
  onRemove: (id: string) => void;
  onCantidadChange: (id: string, cantidad: number) => void;
}

export function AlimentoCard({
  id,
  nombre,
  cantidad,
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  esReceta,
  onRemove,
  onCantidadChange,
}: AlimentoCardProps) {
  const [tempCantidad, setTempCantidad] = useState(cantidad);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      data: { id, nombre, cantidad, calorias, proteinas, carbohidratos, grasas },
    });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const macros = esReceta
    ? {
        calorias: Math.round(calorias * cantidad * 10) / 10,
        proteinas: Math.round(proteinas * cantidad * 10) / 10,
        carbohidratos: Math.round(carbohidratos * cantidad * 10) / 10,
        grasas: Math.round(grasas * cantidad * 10) / 10,
        fibra: 0,
      }
    : calcularMacrosPorcion(
        { calorias, proteinas, carbohidratos, grasas, fibra: 0 },
        cantidad
      );

  function handleCantidadChange(value: number) {
    setTempCantidad(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onCantidadChange(id, value);
    }, 500);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 p-2 rounded-lg border bg-background text-xs group touch-none",
        esReceta ? "border-purple-200 bg-purple-50/30" : "border-border",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
    >
      <button
        {...listeners}
        {...attributes}
        className="p-0.5 rounded cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
      >
        <GripVertical className="w-3 h-3" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          {esReceta && <CookingPot className="w-3 h-3 text-purple-500 shrink-0" />}
          <p className={cn("font-medium truncate", esReceta && "text-purple-900")}>{nombre}</p>
        </div>
        <div className="mt-0.5">
          <MacroBadges
            calorias={macros.calorias}
            proteinas={macros.proteinas}
            carbohidratos={macros.carbohidratos}
            grasas={macros.grasas}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <input
          type="number"
          value={tempCantidad}
          onChange={(e) => handleCantidadChange(parseFloat(e.target.value) || 0)}
          className="w-14 px-1 py-0.5 text-xs rounded border border-border bg-background text-center"
          min={0}
          max={10000}
        />
        <span className="text-muted-foreground">{esReceta ? "porc" : "g"}</span>
        <button
          onClick={() => onRemove(id)}
          className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
