"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, useMemo, useEffect } from "react";
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
  sustituirAlimentoEnComida,
  agregarAlternativa,
  eliminarAlternativa,
  actualizarCantidadAlternativa,
  renombrarItemPlan,
  guardarEquivalenciasItem,
} from "@/app/actions/planes";
import type { UnidadMedida } from "@/generated/prisma/client";
import { cn, isNextNavigation } from "@/lib/utils";

const DIA_ORDER = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

interface AlimentoEnComidaData {
  id: string;
  cantidad: number;
  unidad: string;
  nombrePersonalizado?: string | null;
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
    imagenUrl?: string | null;
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
  alternativas?: {
    id: string;
    nombre: string;
    cantidad: number;
    unidad: string;
    esReceta: boolean;
    realId?: string | null;
    calorias?: number;
    proteinas?: number;
    carbohidratos?: number;
    grasas?: number;
    fibra?: number;
    porcion?: number;
    recetaPorciones?: number;
    recetaDescripcion?: string | null;
    recetaIngredientes?: { nombre: string; cantidad: number; unidad: string }[];
    /** UI optimista: aún sin confirmar por el servidor (#5). */
    pendiente?: boolean;
  }[];
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
  ocultarCalorias?: boolean;
  localCallbacks?: LocalMutationCallbacks;
  /** Reenviado a cada comida como botón "Copiar comida" (lo orquesta PlanVisual). */
  onCopiarComida?: (comidaId: string) => void;
  /** Reenviado a cada alimento como botón "Copiar alimento" (lo orquesta PlanVisual). */
  onCopiarAlimento?: (alimentoEnComidaId: string) => void;
  /** Nombre del alimento copiado al portapapeles (muestra "Pegar aquí" en cada comida). */
  pegarAlimentoLabel?: string | null;
  onPegarAlimento?: (comidaId: string) => void;
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
  ocultarCalorias = false,
  localCallbacks,
  onCopiarComida,
  onCopiarAlimento,
  pegarAlimentoLabel,
  onPegarAlimento,
}: PlanEditorProps) {
  const t = useTranslations("diets");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedComidaId, setSelectedComidaId] = useState<string | null>(null);
  // #5 — Si está, el selector de alimento añadirá lo elegido como ALTERNATIVA de este AlimentoEnComida.
  const [alternativaParaId, setAlternativaParaId] = useState<string | null>(null);
  // #5 — UI optimista: alternativas recién añadidas (visibles al instante, marcadas
  // "pendiente" hasta que el refresh trae la real) y eliminadas (ocultas al instante).
  type AltOptimista = { id: string; nombre: string; cantidad: number; unidad: string; esReceta: boolean; realId: string | null; pendiente: true };
  const [altsOptimistas, setAltsOptimistas] = useState<Record<string, AltOptimista[]>>({});
  const [altsEliminadas, setAltsEliminadas] = useState<Set<string>>(new Set());
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
              nombre: a.nombrePersonalizado || item?.nombre || t("editor.sinNombre"),
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
              imagenUrl: a.alimento?.imagenUrl || null,
              recetaIngredientes: a.receta?.ingredientes,
              recetaDescripcion: a.receta?.descripcion,
              recetaPorciones: a.receta?.porciones,
              // Merge optimista: servidor (sin las eliminadas) + pendientes aún no confirmadas.
              alternativas: [
                ...(a.alternativas ?? []).filter((s) => !altsEliminadas.has(s.id)),
                ...(altsOptimistas[a.id] ?? []).filter(
                  (o) => !(a.alternativas ?? []).some((s) => s.realId === o.realId && Math.abs(s.cantidad - o.cantidad) < 0.01),
                ),
              ],
            };
          }),
        })),
      })),
    [dias, altsOptimistas, altsEliminadas]
  );

  // Poda del estado optimista cuando el refresh trae los datos reales.
  useEffect(() => {
    const serverPorItem = new Map<string, { id: string; realId?: string | null; cantidad: number }[]>();
    const todosIds = new Set<string>();
    for (const d of dias) {
      for (const c of d.comidas) {
        for (const a of c.alimentos) {
          serverPorItem.set(a.id, a.alternativas ?? []);
          for (const s of a.alternativas ?? []) todosIds.add(s.id);
        }
      }
    }
    setAltsOptimistas((prev) => {
      let changed = false;
      const next: Record<string, AltOptimista[]> = {};
      for (const [itemId, list] of Object.entries(prev)) {
        const server = serverPorItem.get(itemId) ?? [];
        const rest = list.filter((o) => !server.some((s) => s.realId === o.realId && Math.abs(s.cantidad - o.cantidad) < 0.01));
        if (rest.length !== list.length) changed = true;
        if (rest.length > 0) next[itemId] = rest;
      }
      return changed || Object.keys(next).length !== Object.keys(prev).length ? next : prev;
    });
    setAltsEliminadas((prev) => {
      const next = new Set([...prev].filter((id) => todosIds.has(id)));
      return next.size !== prev.size ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias]);

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
        if (isNextNavigation(error)) throw error;
        toast.error(t("editor.toastMoveError"));
      }
    });
  }

  function handleAddAlimento(comidaId: string) {
    setAlternativaParaId(null);
    setSelectedComidaId(comidaId);
    setSelectorOpen(true);
  }

  // Abre el selector para añadir una alternativa (alimento o receta) a un ítem.
  function handleAbrirSelectorAlternativa(alimentoEnComidaId: string) {
    setAlternativaParaId(alimentoEnComidaId);
    setSelectedComidaId(null);
    setSelectorOpen(true);
  }

  function handleEliminarAlternativa(alternativaId: string) {
    // UI optimista: ocultar al instante; restaurar si el servidor falla.
    setAltsEliminadas((prev) => new Set(prev).add(alternativaId));
    startTransition(async () => {
      try {
        await eliminarAlternativa(alternativaId);
        router.refresh();
      } catch (error) {
        if (isNextNavigation(error)) throw error;
        setAltsEliminadas((prev) => {
          const next = new Set(prev);
          next.delete(alternativaId);
          return next;
        });
        toast.error(t("editor.toastDeleteError"));
      }
    });
  }

  /**
   * Añade una alternativa con UI optimista (#5): se pinta al instante como
   * "pendiente" y se consolida cuando el refresh trae la fila real; si el
   * servidor falla, se retira y se avisa.
   */
  function agregarAlternativaOptimista(
    alimentoEnComidaId: string,
    payload: { alimentoId: string | null; recetaId: string | null; nombre: string; cantidad: number; unidad: string },
  ) {
    const tempId = `opt-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const optimista: AltOptimista = {
      id: tempId,
      nombre: payload.nombre,
      cantidad: payload.cantidad,
      unidad: payload.unidad,
      esReceta: !!payload.recetaId,
      realId: payload.alimentoId || payload.recetaId,
      pendiente: true,
    };
    setAltsOptimistas((prev) => ({
      ...prev,
      [alimentoEnComidaId]: [...(prev[alimentoEnComidaId] ?? []), optimista],
    }));
    startTransition(async () => {
      try {
        await agregarAlternativa(alimentoEnComidaId, payload.alimentoId, payload.recetaId, payload.cantidad, payload.unidad as UnidadMedida);
        router.refresh();
      } catch (error) {
        if (isNextNavigation(error)) throw error;
        setAltsOptimistas((prev) => ({
          ...prev,
          [alimentoEnComidaId]: (prev[alimentoEnComidaId] ?? []).filter((o) => o.id !== tempId),
        }));
        toast.error(t("editor.toastAddError"));
      }
    });
  }

  // Desde el panel de "equivalente": añade el alimento equivalente como alternativa.
  function handleAgregarAlternativaDirecta(alimentoEnComidaId: string, alimentoId: string, nombre: string, cantidad: number, esReceta = false) {
    agregarAlternativaOptimista(alimentoEnComidaId, {
      alimentoId: esReceta ? null : alimentoId,
      recetaId: esReceta ? alimentoId : null,
      nombre,
      cantidad,
      unidad: "GRAMOS",
    });
  }

  // Desde el catálogo completo ("Más opciones"): sustituir el ítem por lo elegido.
  function handleSustituirDesdeSelector(item: { alimentoId: string | null; recetaId: string | null; cantidad: number; unidad: string }) {
    const id = alternativaParaId;
    const nuevoId = item.alimentoId || item.recetaId;
    if (!id || !nuevoId) return;
    startTransition(async () => {
      try {
        await sustituirAlimentoEnComida(id, nuevoId, item.cantidad, item.unidad as UnidadMedida, !!item.recetaId);
        router.refresh();
        toast.success(t("editor.toastReplaced"));
      } catch (error) {
        if (isNextNavigation(error)) throw error;
        toast.error(t("editor.toastReplaceError"));
      }
    });
  }

  // Desde el catálogo completo ("Más opciones"): añadir lo elegido como alternativa.
  function handleAlternativaDesdeSelector(item: { alimentoId: string | null; recetaId: string | null; nombre: string; cantidad: number; unidad: string }) {
    const id = alternativaParaId;
    if (!id) return;
    agregarAlternativaOptimista(id, item);
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
    // Modo alternativa (#5): lo elegido se añade como "o ..." del ítem, no como comida nueva.
    if (alternativaParaId) {
      agregarAlternativaOptimista(alternativaParaId, item);
      return;
    }
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
        if (isNextNavigation(error)) throw error;
        toast.error(t("editor.toastAddError"));
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
      if (isNextNavigation(error)) throw error;
      toast.error(t("editor.toastDeleteError"));
    }
    router.refresh();
  }

  async function handleReemplazar(alimentoEnComidaId: string, nuevoAlimentoId: string, _nombre: string, cantidad: number, esReceta = false) {
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
      toast.success(t("editor.toastReplaced"));
      return;
    }
    startTransition(async () => {
      try {
        // Sustituir = UPDATE de la línea (conserva sus alternativas), no borrar+crear.
        await sustituirAlimentoEnComida(alimentoEnComidaId, nuevoAlimentoId, cantidad, "GRAMOS", esReceta);
        router.refresh();
        toast.success(t("editor.toastReplaced"));
      } catch (error) {
        if (isNextNavigation(error)) throw error;
        toast.error(t("editor.toastReplaceError"));
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
        const res = await actualizarCantidadAlimento(alimentoEnComidaId, cantidad);
        router.refresh();
        if (res && res.alternativasRecalculadas > 0) {
          toast.success(t("editor.toastAlternativasRecalculadas", { n: res.alternativasRecalculadas }));
        }
      } catch (error) {
        if (isNextNavigation(error)) throw error;
        toast.error(t("editor.toastUpdateQuantityError"));
      }
    });
  }

  // #5 — Editar la cantidad de una alternativa ya añadida (inline en la línea "↳").
  function handleCantidadAlternativaChange(alternativaId: string, cantidad: number) {
    startTransition(async () => {
      try {
        await actualizarCantidadAlternativa(alternativaId, cantidad);
        router.refresh();
      } catch (error) {
        if (isNextNavigation(error)) throw error;
        toast.error(t("editor.toastUpdateQuantityError"));
      }
    });
  }

  // #5 — Guardar la revisión de equivalencias (principal + todas las alternativas a la vez).
  function handleGuardarEquivalencias(itemId: string, cantidadPrincipal: number, cambios: { id: string; cantidad: number }[]) {
    startTransition(async () => {
      try {
        await guardarEquivalenciasItem(itemId, cantidadPrincipal, cambios);
        router.refresh();
        toast.success(t("editor.toastEquivalenciasGuardadas"));
      } catch (error) {
        if (isNextNavigation(error)) throw error;
        toast.error(t("editor.toastUpdateQuantityError"));
      }
    });
  }

  // #5 — Alias visual de una línea o alternativa (solo presentación, no toca macros).
  function handleRenombrar(id: string, nombre: string, esAlternativa: boolean) {
    startTransition(async () => {
      try {
        await renombrarItemPlan(id, nombre, esAlternativa);
        router.refresh();
      } catch (error) {
        if (isNextNavigation(error)) throw error;
        toast.error(t("editor.toastUpdateQuantityError"));
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
                <p className="text-xs text-muted-foreground">{t("editor.saving")}</p>
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
                  {selectedDay === "TODOS" ? t("editor.allDays") : t(`editor.dayLabels.${selectedDay}` as any) || selectedDay}
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
                {t("editor.allDaysShort")}
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
                  {(t(`editor.dayLabels.${dia}` as any) || dia).slice(0, 3)}
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
                    {t(`editor.dayLabels.${dia.dia}` as any) || dia.dia}
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
                      onCopiar={onCopiarComida}
                      onCopiarAlimento={onCopiarAlimento}
                      pegarAlimentoLabel={pegarAlimentoLabel}
                      onPegarAlimento={onPegarAlimento}
                      onAbrirSelectorAlternativa={handleAbrirSelectorAlternativa}
                      onEliminarAlternativa={handleEliminarAlternativa}
                      onAgregarAlternativaDirecta={handleAgregarAlternativaDirecta}
                      onCantidadAlternativaChange={handleCantidadAlternativaChange}
                      onRenombrar={handleRenombrar}
                      onGuardarEquivalencias={handleGuardarEquivalencias}
                      readOnly={readOnly}
                      interactionMode={interactionMode}
                      ocultarCalorias={ocultarCalorias}
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
                {t("editor.showingDailyAvg")}
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
          onClose={() => { setSelectorOpen(false); setAlternativaParaId(null); }}
          onSelect={handleSelectAlimento}
          modoSustituirAlternativa={!!alternativaParaId}
          onSustituir={handleSustituirDesdeSelector}
          onAlternativa={handleAlternativaDesdeSelector}
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
