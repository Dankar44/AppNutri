"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { AlimentoCard } from "./alimento-card";
import { cn } from "@/lib/utils";
import { actualizarDescripcionComida } from "@/app/actions/planes";

const TIPO_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno",
  MEDIA_MANANA: "Media mañana",
  ALMUERZO: "Almuerzo",
  MERIENDA: "Merienda",
  CENA: "Cena",
  RECENA: "Recena",
};

interface AlimentoEnSlot {
  id: string;
  nombre: string;
  cantidad: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  esReceta?: boolean;
}

interface ComidaSlotProps {
  comidaId: string;
  tipo: string;
  descripcion?: string | null;
  alimentos: AlimentoEnSlot[];
  onAdd: (comidaId: string) => void;
  onRemove: (alimentoEnComidaId: string) => void;
  onCantidadChange: (alimentoEnComidaId: string, cantidad: number) => void;
}

export function ComidaSlot({
  comidaId,
  tipo,
  descripcion,
  alimentos,
  onAdd,
  onRemove,
  onCantidadChange,
}: ComidaSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `comida-${comidaId}`,
    data: { comidaId },
  });

  const [desc, setDesc] = useState(descripcion || "");
  const debounceRef = useRef<NodeJS.Timeout>(null);

  function handleDescChange(value: string) {
    setDesc(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      actualizarDescripcionComida(comidaId, value);
    }, 800);
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "space-y-1.5 p-1.5 rounded-lg transition-colors min-h-[60px]",
        isOver && "bg-primary/10 ring-2 ring-primary/30"
      )}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {TIPO_LABELS[tipo] || tipo}
        </h4>
        <button
          onClick={() => onAdd(comidaId)}
          className="p-0.5 rounded hover:bg-primary/10 text-primary transition-colors"
          title="Añadir alimento"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <input
        type="text"
        value={desc}
        onChange={(e) => handleDescChange(e.target.value)}
        placeholder="Descripción del plato..."
        maxLength={500}
        className="w-full px-2 py-1 text-[11px] rounded border border-border bg-background text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:text-foreground placeholder:italic"
      />

      {alimentos.length === 0 ? (
        <button
          onClick={() => onAdd(comidaId)}
          className={cn(
            "w-full p-2 rounded-lg border border-dashed text-xs text-muted-foreground transition-colors",
            isOver
              ? "border-primary text-primary bg-primary/5"
              : "border-border hover:border-primary/30 hover:text-primary"
          )}
        >
          {isOver ? "Soltar aquí" : "+ Añadir"}
        </button>
      ) : (
        <div className="space-y-1">
          {alimentos.map((a) => (
            <AlimentoCard
              key={a.id}
              id={a.id}
              nombre={a.nombre}
              cantidad={a.cantidad}
              calorias={a.calorias}
              proteinas={a.proteinas}
              carbohidratos={a.carbohidratos}
              grasas={a.grasas}
              esReceta={a.esReceta}
              onRemove={onRemove}
              onCantidadChange={onCantidadChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
