"use client";

import { useState, useTransition, useMemo } from "react";
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
import { ComidaSlot } from "./comida-slot";
import { AnalisisSidebar } from "./analisis-sidebar";
import { SelectorAlimento } from "./selector-alimento";
import { MacroBadges } from "@/components/macro-badge";
import { calcularMacrosPorcion, sumarMacros, convertirAGramos } from "@/lib/macros";
import {
  addAlimentoAComida,
  removeAlimentoDeComida,
  actualizarCantidadAlimento,
  moverAlimentoAComida,
} from "@/app/actions/planes";
import type { UnidadMedida } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";

const DIA_LABELS: Record<string, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const DIA_ORDER = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

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
    fibra?: number;
    porcion?: number;
    enlaceProducto?: string | null;
    esPropio?: boolean;
  } | null;
  receta: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    fibra?: number;
    porciones?: number;
    descripcion?: string | null;
    ingredientes?: { nombre: string; cantidad: number; unidad: string }[];
    esPropio?: boolean;
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

interface LocalMutationCallbacks {
  onAdd: (comidaId: string, item: { alimentoId: string | null; recetaId: string | null; nombre: string; cantidad: number; unidad: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number; fibra?: number; porcion?: number }) => void;
  onRemove: (alimentoEnComidaId: string) => void;
  onCantidadChange: (alimentoEnComidaId: string, cantidad: number) => void;
  onMove: (alimentoEnComidaId: string, comidaId: string) => void;
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
  showHeader?: boolean;
  compactHeader?: boolean;
  showDayHeader?: boolean;
  showAnalisis?: boolean;
  readOnly?: boolean;
  interactionMode?: "dashboard" | "patient" | "shared";
  localCallbacks?: LocalMutationCallbacks;
}

interface DragItemData {
  id: string;
  nombre: string;
  cantidad: number;
  unidad?: string;
  porcion?: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

type DayTab = "TODOS" | string;

export function PlanEditor({
  planId: _planId,
  planNombre,
  dias,
  objetivos,
  showHeader = true,
  compactHeader: _compactHeader = false,
  showDayHeader: _showDayHeader = true,
  showAnalisis = true,
  readOnly = false,
  interactionMode = "dashboard",
  localCallbacks,
}: PlanEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedComidaId, setSelectedComidaId] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<DragItemData | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayTab>("TODOS");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Transform raw data into usable format
  const diasData = useMemo(
    () =>
      dias.map((dia) => ({
        dia: dia.dia,
        comidas: dia.comidas.map((comida) => ({
          id: comida.id,
          tipo: comida.tipo,
          descripcion: comida.descripcion,
          alimentos: comida.alimentos.map((a) => {
            const item = a.alimento || a.receta;
            return {
              id: a.id,
              alimentoRealId: a.alimento?.id || a.receta?.id || null,
              nombre: item?.nombre || "Sin nombre",
              cantidad: a.cantidad,
              unidad: a.unidad || "GRAMOS",
              porcion: a.alimento?.porcion || 100,
              calorias: item?.calorias || 0,
              proteinas: item?.proteinas || 0,
              carbohidratos: item?.carbohidratos || 0,
              grasas: item?.grasas || 0,
              fibra: item?.fibra || 0,
              esReceta: !!a.receta,
              esPropio: a.alimento?.esPropio || a.receta?.esPropio,
              enlaceProducto: a.alimento?.enlaceProducto || null,
              recetaIngredientes: a.receta?.ingredientes,
              recetaDescripcion: a.receta?.descripcion,
              recetaPorciones: a.receta?.porciones,
            };
          }),
        })),
      })),
    [dias]
  );

  // Get available day keys from the data
  const availableDays = useMemo(
    () => diasData.map((d) => d.dia).sort((a, b) => DIA_ORDER.indexOf(a) - DIA_ORDER.indexOf(b)),
    [diasData]
  );

  // Filter days based on selected tab
  const visibleDias = useMemo(
    () =>
      selectedDay === "TODOS"
        ? diasData.sort(
            (a, b) => DIA_ORDER.indexOf(a.dia) - DIA_ORDER.indexOf(b.dia)
          )
        : diasData.filter((d) => d.dia === selectedDay),
    [diasData, selectedDay]
  );

  // Calculate macros for sidebar based on visible days
  const sidebarMacros = useMemo(() => {
    const allAlimentos = visibleDias.flatMap((d) =>
      d.comidas.flatMap((c) => c.alimentos)
    );
    const macrosList = allAlimentos.map((a) => {
      if (a.esReceta) {
        return {
          calorias: Math.round(a.calorias * a.cantidad * 10) / 10,
          proteinas: Math.round(a.proteinas * a.cantidad * 10) / 10,
          carbohidratos: Math.round(a.carbohidratos * a.cantidad * 10) / 10,
          grasas: Math.round(a.grasas * a.cantidad * 10) / 10,
          fibra: Math.round((a.fibra || 0) * a.cantidad * 10) / 10,
        };
      }
      return calcularMacrosPorcion(
        {
          calorias: a.calorias,
          proteinas: a.proteinas,
          carbohidratos: a.carbohidratos,
          grasas: a.grasas,
          fibra: a.fibra || 0,
        },
        convertirAGramos(a.cantidad, a.unidad || "GRAMOS", a.porcion || 100)
      );
    });
    const total = sumarMacros(macrosList);

    // If "TODOS" selected, show average per day
    const dayCount =
      selectedDay === "TODOS" ? Math.max(visibleDias.length, 1) : 1;
    return {
      calorias: total.calorias / dayCount,
      proteinas: total.proteinas / dayCount,
      carbohidratos: total.carbohidratos / dayCount,
      grasas: total.grasas / dayCount,
      fibra: total.fibra / dayCount,
    };
  }, [visibleDias, selectedDay]);

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragItemData | undefined;
    if (data) {
      setActiveDragItem(data);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragItem(null);
    if (readOnly) return;
    const { active, over } = event;
    if (!over) return;

    const alimentoEnComidaId = active.id as string;
    const droppableData = over.data.current as { comidaId?: string } | undefined;
    if (!droppableData?.comidaId) return;

    if (localCallbacks) {
      localCallbacks.onMove(alimentoEnComidaId, droppableData.comidaId!);
      return;
    }

    startTransition(async () => {
      try {
        await moverAlimentoAComida(alimentoEnComidaId, droppableData.comidaId!);
        router.refresh();
      } catch (error) {
        if (error && typeof error === "object" && "digest" in error) throw error;
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
    unidad: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
  }) {
    if (!selectedComidaId) return;
    if (localCallbacks) {
      localCallbacks.onAdd(selectedComidaId, item);
      return;
    }
    startTransition(async () => {
      try {
        await addAlimentoAComida(
          selectedComidaId,
          item.alimentoId,
          item.recetaId,
          item.cantidad,
          item.unidad as UnidadMedida
        );
        router.refresh();
      } catch (error) {
        if (error && typeof error === "object" && "digest" in error) throw error;
        toast.error("Error al añadir alimento");
      }
    });
  }

  async function handleRemoveAlimento(alimentoEnComidaId: string) {
    if (localCallbacks) {
      localCallbacks.onRemove(alimentoEnComidaId);
      return;
    }
    try {
      await removeAlimentoDeComida(alimentoEnComidaId);
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al eliminar");
    }
    router.refresh();
  }

  async function handleReemplazar(alimentoEnComidaId: string, nuevoAlimentoId: string, _nombre: string, cantidad: number) {
    if (localCallbacks) {
      let comidaId: string | null = null;
      for (const dia of dias) {
        for (const comida of dia.comidas) {
          for (const a of comida.alimentos) {
            if (a.id === alimentoEnComidaId) comidaId = comida.id;
          }
        }
      }
      if (!comidaId) return;
      localCallbacks.onRemove(alimentoEnComidaId);
      localCallbacks.onAdd(comidaId, { alimentoId: nuevoAlimentoId, recetaId: null, nombre: _nombre, cantidad, unidad: "GRAMOS", calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 });
      toast.success("Alimento reemplazado");
      return;
    }
    startTransition(async () => {
      try {
        let comidaId: string | null = null;
        for (const dia of dias) {
          for (const comida of dia.comidas) {
            for (const a of comida.alimentos) {
              if (a.id === alimentoEnComidaId) comidaId = comida.id;
            }
          }
        }
        if (!comidaId) return;
        await removeAlimentoDeComida(alimentoEnComidaId);
        await addAlimentoAComida(comidaId, nuevoAlimentoId, null, cantidad);
        router.refresh();
        toast.success("Alimento reemplazado");
      } catch (error) {
        if (error && typeof error === "object" && "digest" in error) throw error;
        toast.error("Error al reemplazar");
      }
    });
  }

  function handleCantidadChange(alimentoEnComidaId: string, cantidad: number) {
    if (localCallbacks) {
      localCallbacks.onCantidadChange(alimentoEnComidaId, cantidad);
      return;
    }
    startTransition(async () => {
      try {
        await actualizarCantidadAlimento(alimentoEnComidaId, cantidad);
        router.refresh();
      } catch (error) {
        if (error && typeof error === "object" && "digest" in error) throw error;
        toast.error("Error al actualizar cantidad");
      }
    });
  }

  const dragMacros = activeDragItem
    ? calcularMacrosPorcion(
        {
          calorias: activeDragItem.calorias,
          proteinas: activeDragItem.proteinas,
          carbohidratos: activeDragItem.carbohidratos,
          grasas: activeDragItem.grasas,
          fibra: 0,
        },
        convertirAGramos(activeDragItem.cantidad, activeDragItem.unidad || "GRAMOS", activeDragItem.porcion || 100)
      )
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        {showHeader && (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold">{planNombre}</h1>
              {isPending && (
                <p className="text-xs text-muted-foreground">Guardando...</p>
              )}
            </div>
          </div>
        )}

        {/* Day selector — barra verde + pills */}
        {availableDays.length > 1 && (
          <div className="mb-6 space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (selectedDay === "TODOS") { setSelectedDay(availableDays[availableDays.length - 1]); return; }
                  const idx = availableDays.indexOf(selectedDay);
                  setSelectedDay(idx <= 0 ? "TODOS" : availableDays[idx - 1]);
                }}
                className="p-2 rounded-lg border border-border hover:bg-muted transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex-1 bg-primary rounded-xl py-3 text-center">
                <span className="text-primary-foreground font-semibold">
                  {selectedDay === "TODOS" ? "Todos los días" : DIA_LABELS[selectedDay] || selectedDay}
                </span>
              </div>
              <button
                onClick={() => {
                  if (selectedDay === "TODOS") { setSelectedDay(availableDays[0]); return; }
                  const idx = availableDays.indexOf(selectedDay);
                  setSelectedDay(idx >= availableDays.length - 1 ? "TODOS" : availableDays[idx + 1]);
                }}
                className="p-2 rounded-lg border border-border hover:bg-muted transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              <button
                onClick={() => setSelectedDay("TODOS")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  selectedDay === "TODOS" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                Todos
              </button>
              {availableDays.map((dia) => (
                <button
                  key={dia}
                  onClick={() => setSelectedDay(dia)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                    selectedDay === dia ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {DIA_LABELS[dia]?.slice(0, 3) || dia.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main layout: meals + sidebar */}
        <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
          {/* Main content - meal cards */}
          <div className="flex-1 min-w-0 space-y-4 sm:space-y-6">
            {visibleDias.map((dia) => (
              <div key={dia.dia}>
                {/* Day heading (show when viewing all days) */}
                {selectedDay === "TODOS" && availableDays.length > 1 && (
                  <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {DIA_LABELS[dia.dia] || dia.dia}
                  </h2>
                )}

                {/* Meal cards for this day */}
                <div className="space-y-4 mb-6">
                  {dia.comidas.map((comida) => (
                    <ComidaSlot
                      key={comida.id}
                      comidaId={comida.id}
                      tipo={comida.tipo}
                      descripcion={comida.descripcion}
                      alimentos={comida.alimentos}
                      onAdd={handleAddAlimento}
                      onRemove={handleRemoveAlimento}
                      onCantidadChange={handleCantidadChange}
                      onReemplazar={handleReemplazar}
                      readOnly={readOnly}
                      interactionMode={interactionMode}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Analysis sidebar — solo en desktop grande y si showAnalisis */}
          {showAnalisis && <div className="hidden xl:block w-[340px] xl:sticky xl:top-4 xl:self-start shrink-0">
            <AnalisisSidebar
              calorias={sidebarMacros.calorias}
              proteinas={sidebarMacros.proteinas}
              carbohidratos={sidebarMacros.carbohidratos}
              grasas={sidebarMacros.grasas}
              fibra={sidebarMacros.fibra}
              caloriasObj={objetivos.calorias ?? undefined}
              proteinasObj={objetivos.proteinas ?? undefined}
              carbohidratosObj={objetivos.carbohidratos ?? undefined}
              grasasObj={objetivos.grasas ?? undefined}
            />
            {selectedDay === "TODOS" && availableDays.length > 1 && (
              <p className="text-xs text-muted-foreground mt-2 text-center italic">
                Mostrando media diaria
              </p>
            )}
          </div>}
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
          open={selectorOpen && !readOnly}
          onClose={() => setSelectorOpen(false)}
          onSelect={handleSelectAlimento}
          comidaId={selectedComidaId || undefined}
          macrosObjetivo={
            objetivos.calorias != null
              ? {
                  calorias: objetivos.calorias ?? 2000,
                  proteinas: objetivos.proteinas ?? 120,
                  carbohidratos: objetivos.carbohidratos ?? 250,
                  grasas: objetivos.grasas ?? 70,
                }
              : undefined
          }
        />
      </div>
    </DndContext>
  );
}
