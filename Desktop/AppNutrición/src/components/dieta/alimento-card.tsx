"use client";

import { Trash2, GripVertical, ListFilter } from "lucide-react";
import { useState, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface AlimentoCardProps {
  id: string;
  nombre: string;
  cantidad: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra?: number;
  esReceta?: boolean;
  onRemove: (id: string) => void;
  onCantidadChange: (id: string, cantidad: number) => void;
  onBuscarEquivalente?: (alimentoId: string, nombre: string, calorias: number, proteinas: number, carbohidratos: number, grasas: number, cantidad: number) => void;
}

export function AlimentoCard({
  id,
  nombre,
  cantidad,
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  fibra,
  esReceta,
  onRemove,
  onCantidadChange,
  onBuscarEquivalente,
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

  function handleCantidadChange(value: number) {
    setTempCantidad(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onCantidadChange(id, value);
    }, 500);
  }

  const unidadLabel = esReceta ? "porc." : "g";

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
      {/* Drag handle */}
      <button
        {...listeners}
        {...attributes}
        className="p-0.5 rounded cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground shrink-0"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Food description with inline editable quantity */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5 text-sm">
        <input
          type="number"
          value={tempCantidad}
          onChange={(e) => handleCantidadChange(parseFloat(e.target.value) || 0)}
          className="w-14 px-1.5 py-0.5 text-sm rounded border border-transparent hover:border-border focus:border-primary/50 bg-transparent text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/20"
          min={0}
          max={10000}
        />
        <span className="text-muted-foreground text-sm shrink-0">
          {unidadLabel} de
        </span>
        <span className="truncate font-medium text-foreground">{nombre}</span>
      </div>

      {/* Equivalente button */}
      {onBuscarEquivalente && !esReceta && (
        <button
          onClick={() => onBuscarEquivalente(id, nombre, calorias, proteinas, carbohidratos, grasas, cantidad)}
          className="p-1.5 rounded border border-border/60 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground/50 hover:text-primary transition-all shrink-0"
          title="Buscar alimento equivalente"
        >
          <ListFilter className="w-4 h-4" />
        </button>
      )}

      {/* Delete button */}
      <button
        onClick={() => onRemove(id)}
        className="p-1.5 rounded border border-border/60 hover:bg-red-50 hover:border-red-200 text-muted-foreground/50 hover:text-red-500 transition-all shrink-0"
        title="Eliminar"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
