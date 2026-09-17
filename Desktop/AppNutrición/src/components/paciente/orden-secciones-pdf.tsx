"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { PDFSectionKey } from "@/lib/pdf/generate-plan-pdf";

const TEXTOS_SECCIONES: Record<PDFSectionKey, { titulo: string }> = {
  planSemanal: { titulo: "planSemanalCompleto" },
  detalleDiario: { titulo: "detalleDiarioComidas" },
  recomendaciones: { titulo: "recomendaciones" },
  listaCompra: { titulo: "listaCompra" },
  recetasDelPlan: { titulo: "recetasDelPlan" },
};

type Props = {
  orden: PDFSectionKey[];
  recetasDisponibles: boolean;
  recetasCount: number;
  onChange: (orden: PDFSectionKey[]) => void;
};

type Traducir = (clave: string, valores?: Record<string, string | number>) => string;

const BOTON_ICONO =
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30";

function nombreSeccion(id: PDFSectionKey, t: Traducir, recetasCount: number): string {
  return id === "recetasDelPlan"
    ? t(TEXTOS_SECCIONES[id].titulo, { count: recetasCount })
    : t(TEXTOS_SECCIONES[id].titulo);
}

function SeccionFija({ nombre, t }: { nombre: string; t: Traducir }) {
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground/50">
        <Lock className="h-4 w-4" aria-hidden="true" />
      </div>
      <span className="text-sm font-medium text-muted-foreground">{t(nombre)}</span>
      <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground/70">{t("ordenFija")}</span>
    </div>
  );
}

function FilaSeccion({
  id,
  indice,
  total,
  t,
  recetasCount,
  onMover,
}: {
  id: PDFSectionKey;
  indice: number;
  total: number;
  t: Traducir;
  recetasCount: number;
  onMover: (desde: number, hasta: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const nombre = nombreSeccion(id, t, recetasCount);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex min-h-12 items-center gap-2 rounded-lg border bg-card px-2",
        isDragging ? "z-10 border-primary shadow-lg ring-2 ring-primary/20" : "border-border",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="inline-flex h-10 w-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
        aria-label={t("ordenArrastrar", { seccion: nombre })}
        title={t("ordenArrastrar", { seccion: nombre })}
      >
        <GripVertical className="h-5 w-5" aria-hidden="true" />
      </button>

      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{nombre}</span>

      <div className="flex shrink-0">
        <button
          type="button"
          className={BOTON_ICONO}
          onClick={() => onMover(indice, indice - 1)}
          disabled={indice === 0}
          aria-label={t("ordenSubir", { seccion: nombre })}
          title={t("ordenSubir", { seccion: nombre })}
        >
          <ChevronUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          className={BOTON_ICONO}
          onClick={() => onMover(indice, indice + 1)}
          disabled={indice === total - 1}
          aria-label={t("ordenBajar", { seccion: nombre })}
          title={t("ordenBajar", { seccion: nombre })}
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function OrdenSeccionesPdf({ orden, recetasDisponibles, recetasCount, onChange }: Props) {
  const t = useTranslations("patients.entregables");
  const [arrastrando, setArrastrando] = useState<PDFSectionKey | null>(null);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const visibles = orden.filter((seccion) => seccion !== "recetasDelPlan" || recetasDisponibles);

  function mover(desde: number, hasta: number) {
    if (hasta < 0 || hasta >= visibles.length) return;
    onChange(arrayMove(orden, orden.indexOf(visibles[desde]), orden.indexOf(visibles[hasta])));
  }

  function alSoltar(evento: DragEndEvent) {
    setArrastrando(null);
    if (!evento.over || evento.active.id === evento.over.id) return;
    const desde = visibles.indexOf(evento.active.id as PDFSectionKey);
    const hasta = visibles.indexOf(evento.over.id as PDFSectionKey);
    if (desde >= 0 && hasta >= 0) mover(desde, hasta);
  }

  return (
    <div className="space-y-1" aria-label={t("ordenListaAria")}>
      <SeccionFija nombre="portada" t={t} />
      <DndContext
        sensors={sensores}
        collisionDetection={closestCenter}
        onDragStart={(evento) => setArrastrando(evento.active.id as PDFSectionKey)}
        onDragCancel={() => setArrastrando(null)}
        onDragEnd={alSoltar}
      >
        <SortableContext items={visibles} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {visibles.map((id, indice) => (
              <FilaSeccion
                key={id}
                id={id}
                indice={indice}
                total={visibles.length}
                t={t}
                recetasCount={recetasCount}
                onMover={mover}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <SeccionFija nombre="contraportada" t={t} />
      <span className="sr-only" role="status" aria-live="polite">
        {arrastrando ? t("ordenArrastrando", { seccion: nombreSeccion(arrastrando, t, recetasCount) }) : ""}
      </span>
    </div>
  );
}
