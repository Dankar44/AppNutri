"use client";

import { useState, useRef } from "react";
import { Plus, Clock } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { AlimentoCard } from "./alimento-card";
import { cn } from "@/lib/utils";
import { actualizarDescripcionComida } from "@/app/actions/planes";
import { calcularMacrosPorcion } from "@/lib/macros";

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
  compactHeader?: boolean;
}

export function ComidaSlot({
  comidaId,
  tipo,
  descripcion,
  alimentos,
  onAdd,
  onRemove,
  onCantidadChange,
  compactHeader = false,
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

  const mealTotals = (() => {
    let calorias = 0;
    let proteinas = 0;
    let carbohidratos = 0;
    let grasas = 0;
    // A día de hoy en este modo no tenemos fibra en los items,
    // así que se muestra como 0 para mantener el layout.
    let fibra = 0;

    for (const a of alimentos) {
      if (a.esReceta) {
        // Recetas: macros por porción y cantidad = nº porciones
        calorias += Math.round(a.calorias * a.cantidad * 10) / 10;
        proteinas += Math.round(a.proteinas * a.cantidad * 10) / 10;
        carbohidratos += Math.round(a.carbohidratos * a.cantidad * 10) / 10;
        grasas += Math.round(a.grasas * a.cantidad * 10) / 10;
        fibra += 0;
      } else {
        const m = calcularMacrosPorcion(
          {
            calorias: a.calorias,
            proteinas: a.proteinas,
            carbohidratos: a.carbohidratos,
            grasas: a.grasas,
            fibra: 0,
          },
          a.cantidad
        );
        calorias += m.calorias;
        proteinas += m.proteinas;
        carbohidratos += m.carbohidratos;
        grasas += m.grasas;
      }
    }

    return {
      calorias: Math.round(calorias * 10) / 10,
      proteinas: Math.round(proteinas * 10) / 10,
      carbohidratos: Math.round(carbohidratos * 10) / 10,
      grasas: Math.round(grasas * 10) / 10,
      fibra: Math.round(fibra * 10) / 10,
    };
  })();

  return (
    <div
      ref={setNodeRef}
      className={cn(
        compactHeader
          ? "space-y-3 p-3 rounded-xl border border-border/70 bg-background min-h-[92px]"
          : "space-y-1.5 p-1.5 rounded-lg transition-colors min-h-[60px]",
        isOver && "bg-primary/10 ring-2 ring-primary/30"
      )}
    >
      {/* Cabecera tipo tarjeta (modo paciente) */}
      {compactHeader ? (
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="text-sm text-muted-foreground inline-flex items-center gap-1 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              {hora}
            </div>
            <h4 className="text-base font-semibold text-muted-foreground tracking-wide truncate">
              {TIPO_LABELS[tipo] || tipo}
            </h4>
          </div>

          <button
            onClick={() => onAdd(comidaId)}
            className="p-0.5 rounded hover:bg-primary/10 text-primary transition-colors shrink-0 mt-0.5"
            title="Añadir alimento"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-xs font-semibold text-muted-foreground tracking-wider">
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
      )}

      {compactHeader ? (
        <>
          {/* Platos */}
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
              {isOver ? "Soltar aquí" : "Agregar nuevo alimento +"}
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

          {/* Barra de “Agregar nuevo alimento” (si ya hay platos también) */}
          <button
            type="button"
            onClick={() => onAdd(comidaId)}
            className={cn(
              "w-full p-2 rounded-lg border border-dashed text-xs transition-colors mt-1",
              isOver ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground hover:border-primary/30 hover:text-primary"
            )}
          >
            Agregar nuevo alimento +
          </button>

          {/* Notas */}
          <div className="pt-1">
            <div className="text-[11px] font-semibold text-muted-foreground mb-1">Notas</div>
            <textarea
              value={desc}
              onChange={(e) => handleDescChange(e.target.value)}
              placeholder="Descripción del plato..."
              maxLength={500}
              rows={3}
              className="w-full px-2 py-1.5 text-[11px] rounded border border-border bg-background text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:text-foreground placeholder:italic resize-none"
            />
          </div>

          {/* Totales nutricionales de la comida */}
          <div className="pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                Energía {Math.round(mealTotals.calorias)} kcal
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">
                Grasa {mealTotals.grasas.toFixed(1)} g
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                H. Carbono {mealTotals.carbohidratos.toFixed(1)} g
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                Proteína {mealTotals.proteinas.toFixed(1)} g
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                Fibra alimentaria {mealTotals.fibra.toFixed(1)} g
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Notas en modo normal */}
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
        </>
      )}
    </div>
  );
}
