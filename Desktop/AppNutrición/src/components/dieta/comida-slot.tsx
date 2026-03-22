"use client";

import { useState, useRef } from "react";
import { Plus, Clock } from "lucide-react";
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

const HORA_DEFAULT: Record<string, string> = {
  DESAYUNO: "08:00",
  MEDIA_MANANA: "11:00",
  ALMUERZO: "14:00",
  MERIENDA: "17:30",
  CENA: "21:00",
  RECENA: "23:00",
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
  const [hora, setHora] = useState(HORA_DEFAULT[tipo] || "");
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
      <div className="flex items-center justify-between gap-1">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {TIPO_LABELS[tipo] || tipo}
        </h4>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="text-[10px] bg-transparent border-none outline-none w-[52px] text-muted-foreground focus:text-foreground"
            />
          </div>
          <button
            onClick={() => onAdd(comidaId)}
            className="p-0.5 rounded hover:bg-primary/10 text-primary transition-colors"
            title="Añadir alimento"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
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
