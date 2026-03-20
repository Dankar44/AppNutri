"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { DiaColumna } from "./dia-columna";
import { SelectorAlimento } from "./selector-alimento";
import { MacroBadges } from "@/components/macro-badge";
import { calcularMacrosPorcion } from "@/lib/macros";
import {
  addAlimentoAComida,
  removeAlimentoDeComida,
  actualizarCantidadAlimento,
  moverAlimentoAComida,
} from "@/app/actions/planes";

interface AlimentoEnComidaData {
  id: string;
  cantidad: number;
  unidad: string;
  alimento: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
  } | null;
  receta: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
  } | null;
}

interface ComidaData {
  id: string;
  tipo: string;
  descripcion?: string | null;
  alimentos: AlimentoEnComidaData[];
}

interface DiaData {
  id: string;
  dia: string;
  comidas: ComidaData[];
}

interface PlanEditorProps {
  planId: string;
  planNombre: string;
  dias: DiaData[];
  objetivos: {
    calorias?: number | null;
    proteinas?: number | null;
    carbohidratos?: number | null;
    grasas?: number | null;
  };
}

interface DragItemData {
  id: string;
  nombre: string;
  cantidad: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

export function PlanEditor({ planId, planNombre, dias, objetivos }: PlanEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedComidaId, setSelectedComidaId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<DragItemData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragItemData | undefined;
    if (data) {
      setActiveDragItem(data);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragItem(null);
    const { active, over } = event;
    if (!over) return;

    const alimentoEnComidaId = active.id as string;
    const droppableData = over.data.current as { comidaId?: string } | undefined;
    if (!droppableData?.comidaId) return;

    startTransition(async () => {
      try {
        await moverAlimentoAComida(alimentoEnComidaId, droppableData.comidaId!);
        router.refresh();
      } catch {
        toast.error("Error al mover alimento");
      }
    });
  }

  function handleAddAlimento(comidaId: string) {
    setSelectedComidaId(comidaId);
    setSelectorOpen(true);
  }

  function handleSelectAlimento(item: {
    alimentoId: string | null;
    recetaId: string | null;
    nombre: string;
    cantidad: number;
  }) {
    if (!selectedComidaId) return;
    startTransition(async () => {
      try {
        await addAlimentoAComida(
          selectedComidaId,
          item.alimentoId,
          item.recetaId,
          item.cantidad
        );
        router.refresh();
      } catch {
        toast.error("Error al añadir alimento");
      }
    });
  }

  function handleRemoveAlimento(alimentoEnComidaId: string) {
    startTransition(async () => {
      try {
        await removeAlimentoDeComida(alimentoEnComidaId);
        router.refresh();
      } catch {
        toast.error("Error al eliminar");
      }
    });
  }

  function handleCantidadChange(alimentoEnComidaId: string, cantidad: number) {
    startTransition(async () => {
      try {
        await actualizarCantidadAlimento(alimentoEnComidaId, cantidad);
        router.refresh();
      } catch {
        toast.error("Error al actualizar cantidad");
      }
    });
  }



  const diasData = dias.map((dia) => ({
    dia: dia.dia,
    comidas: dia.comidas.map((comida) => ({
      id: comida.id,
      tipo: comida.tipo,
      descripcion: comida.descripcion,
      alimentos: comida.alimentos.map((a) => {
        const item = a.alimento || a.receta;
        return {
          id: a.id,
          nombre: item?.nombre || "Sin nombre",
          cantidad: a.cantidad,
          calorias: item?.calorias || 0,
          proteinas: item?.proteinas || 0,
          carbohidratos: item?.carbohidratos || 0,
          grasas: item?.grasas || 0,
          esReceta: !!a.receta,
        };
      }),
    })),
  }));

  const dragMacros = activeDragItem
    ? calcularMacrosPorcion(
        {
          calorias: activeDragItem.calorias,
          proteinas: activeDragItem.proteinas,
          carbohidratos: activeDragItem.carbohidratos,
          grasas: activeDragItem.grasas,
          fibra: 0,
        },
        activeDragItem.cantidad
      )
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{planNombre}</h1>
            {isPending && (
              <p className="text-xs text-muted-foreground">Guardando...</p>
            )}
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {diasData.map((dia) => (
              <DiaColumna
                key={dia.dia}
                dia={dia.dia}
                comidas={dia.comidas}
                objetivos={{
                  calorias: objetivos.calorias ?? undefined,
                  proteinas: objetivos.proteinas ?? undefined,
                  carbohidratos: objetivos.carbohidratos ?? undefined,
                  grasas: objetivos.grasas ?? undefined,
                }}
                onAddAlimento={handleAddAlimento}
                onRemoveAlimento={handleRemoveAlimento}
                onCantidadChange={handleCantidadChange}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeDragItem && dragMacros ? (
            <div className="p-2 rounded-lg border-2 border-primary bg-card shadow-xl text-xs w-[200px] rotate-2">
              <p className="font-medium truncate">{activeDragItem.nombre}</p>
              <div className="mt-1">
                <MacroBadges
                  calorias={dragMacros.calorias}
                  proteinas={dragMacros.proteinas}
                  carbohidratos={dragMacros.carbohidratos}
                  grasas={dragMacros.grasas}
                />
              </div>
            </div>
          ) : null}
        </DragOverlay>

        <SelectorAlimento
          open={selectorOpen}
          onClose={() => setSelectorOpen(false)}
          onSelect={handleSelectAlimento}
          comidaId={selectedComidaId || undefined}
          macrosObjetivo={objetivos.calorias != null ? {
            calorias: objetivos.calorias ?? 2000,
            proteinas: objetivos.proteinas ?? 120,
            carbohidratos: objetivos.carbohidratos ?? 250,
            grasas: objetivos.grasas ?? 70,
          } : undefined}
        />

      </div>
    </DndContext>
  );
}
