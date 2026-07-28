"use client";

import { useTranslations } from "next-intl";
import { Trash2, GripVertical, Replace, ExternalLink, Image as ImageLinkIcon, Copy, CornerDownRight, X, Pencil, SlidersHorizontal, ChevronUp, ChevronDown, ArrowUpToLine } from "lucide-react";
import { RevisionEquivalenciasPanel } from "./revision-equivalencias-panel";
import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { getUnidadLabel, esUnidadDiscreta } from "@/lib/units";
import { convertirAGramos } from "@/lib/macros";
import { FoodHoverCard, type InteractionMode } from "@/components/food-hover-card";
import { CantidadInput } from "@/components/cantidad-input";

interface AlimentoCardProps {
  id: string;
  /** Comida a la que pertenece; permite distinguir reordenar-dentro de mover-entre al arrastrar. */
  comidaId: string;
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
  /** Reordenar dentro de la comida con flechas ↑/↓ (#27). */
  onReordenar?: (id: string, dir: "up" | "down") => void;
  esPrimero?: boolean;
  esUltimo?: boolean;
  onCantidadChange: (id: string, cantidad: number) => void;
  onBuscarEquivalente?: (alimentoId: string, nombre: string, calorias: number, proteinas: number, carbohidratos: number, grasas: number, cantidad: number, esReceta: boolean) => void;
  onCopiar?: (id: string) => void;
  /** Alternativas equivalentes ("o ...") de este ítem (#5). */
  alternativas?: AlternativaData[];
  onEliminarAlternativa?: (alternativaId: string) => void;
  /** Promueve una alternativa a alimento principal; las demás alternativas se conservan (#29). */
  onPromoverAlternativa?: (alternativaId: string) => void;
  /** Intercambia una alternativa con el principal (swap): la alt pasa a principal y el principal a alternativa (#29). */
  onConvertirAlternativaEnPrincipal?: (alternativaId: string) => void;
  /** Edita la cantidad de una alternativa ya añadida (#5). */
  onCantidadAlternativaChange?: (alternativaId: string, cantidad: number) => void;
  /** Alias visual de la línea o de una alternativa (solo presentación) (#5). */
  onRenombrar?: (id: string, nombre: string, esAlternativa: boolean) => void;
  /** Guarda la revisión de equivalencias (cantidad del principal + de cada alternativa) (#5). */
  onGuardarEquivalencias?: (id: string, cantidadPrincipal: number, cambios: { id: string; cantidad: number }[]) => void;
  /** UI optimista: alimento recién añadido, aún sin confirmar → aspecto final pero no interactivo (#5). */
  pendiente?: boolean;
}

interface AlternativaData {
  id: string;
  nombre: string;
  cantidad: number;
  unidad?: string;
  esReceta?: boolean;
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
}

/** Línea "↳" de una alternativa: cantidad editable inline + alias + hover/clic con macros + quitar (#5). */
function AlternativaRow({
  alt,
  interactionMode = "dashboard",
  ocultarCalorias = false,
  onCantidadChange,
  onRenombrar,
  onEliminar,
  onConvertirEnPrincipal,
}: {
  alt: AlternativaData;
  interactionMode?: InteractionMode;
  ocultarCalorias?: boolean;
  onCantidadChange?: (alternativaId: string, cantidad: number) => void;
  onRenombrar?: (id: string, nombre: string, esAlternativa: boolean) => void;
  onEliminar?: (alternativaId: string) => void;
  onConvertirEnPrincipal?: (alternativaId: string) => void;
}) {
  const t = useTranslations("diets");
  const [tempCantidad, setTempCantidad] = useState(alt.cantidad);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [tempNombre, setTempNombre] = useState(alt.nombre);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    setTempCantidad(alt.cantidad);
  }, [alt.cantidad]);
  useEffect(() => {
    setTempNombre(alt.nombre);
  }, [alt.nombre]);

  function handleCantidad(value: number) {
    setTempCantidad(value);
    if (!onCantidadChange) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (value > 0) onCantidadChange(alt.id, value);
    }, 500);
  }

  function guardarNombre() {
    setEditandoNombre(false);
    if (onRenombrar && tempNombre.trim() && tempNombre.trim() !== alt.nombre) {
      onRenombrar(alt.id, tempNombre.trim(), true);
    } else {
      setTempNombre(alt.nombre);
    }
  }

  // Hover/clic con macros, igual que el alimento principal (si tenemos los datos).
  const tieneMacros = alt.calorias != null && alt.realId;
  const altHref =
    tieneMacros && interactionMode === "dashboard"
      ? (alt.esReceta
        ? `/recetas/${alt.realId}?porciones=${alt.cantidad}`
        : `/alimentos/${alt.realId}?cantidad=${Math.round(convertirAGramos(alt.cantidad, alt.unidad || "GRAMOS", alt.porcion || 100))}`)
      : null;

  // Recién añadida (UI optimista): aparece al instante con su aspecto DEFINITIVO
  // (sin gris ni spinner); solo que aún no es editable hasta que el servidor
  // confirme. Si falla, el padre la retira y muestra el error.
  if (alt.pendiente) {
    return (
      <div className="flex items-center gap-1.5 text-xs rounded-md bg-muted/40 px-2 py-1">
        <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
        <span className="w-14 px-1 py-0.5 inline-block text-right tabular-nums">{alt.cantidad}</span>
        <span className="text-muted-foreground shrink-0">{getUnidadLabel(alt.unidad || "GRAMOS", alt.esReceta, alt.cantidad)} {t("alimentoCard.unitConnector")}</span>
        <span className={cn("font-medium truncate", alt.esReceta ? "text-purple-600 dark:text-purple-400" : "text-foreground/80")}>{alt.nombre}</span>
      </div>
    );
  }

  return (
    <div className="group/alt flex items-center gap-1.5 text-xs rounded-md bg-muted/40 px-2 py-1">
      <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
      {onCantidadChange ? (
        <CantidadInput
          value={tempCantidad}
          onChange={handleCantidad}
          className="w-14 px-1 py-0.5 text-xs rounded border border-transparent hover:border-border focus:border-primary/50 bg-transparent text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/20"
          min={0}
          max={10000}
          step={alt.esReceta ? 0.5 : 1}
          redondearA={alt.esReceta || esUnidadDiscreta(alt.unidad) ? 0.5 : undefined}
        />
      ) : (
        <span className="tabular-nums text-muted-foreground">{alt.cantidad}</span>
      )}
      <span className="text-muted-foreground shrink-0">{getUnidadLabel(alt.unidad || "GRAMOS", alt.esReceta, alt.cantidad)} {t("alimentoCard.unitConnector")}</span>
      {editandoNombre ? (
        <input
          type="text"
          value={tempNombre}
          autoFocus
          maxLength={200}
          onChange={(e) => setTempNombre(e.target.value)}
          onBlur={guardarNombre}
          onKeyDown={(e) => {
            if (e.key === "Enter") guardarNombre();
            if (e.key === "Escape") { setTempNombre(alt.nombre); setEditandoNombre(false); }
          }}
          className="flex-1 min-w-0 px-1 py-0.5 text-xs rounded border border-primary/40 bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      ) : tieneMacros ? (
        <FoodHoverCard
          nombre={alt.nombre}
          calorias={alt.calorias ?? 0}
          proteinas={alt.proteinas ?? 0}
          carbohidratos={alt.carbohidratos ?? 0}
          grasas={alt.grasas ?? 0}
          fibra={alt.fibra ?? 0}
          cantidad={alt.cantidad}
          unidad={alt.unidad || "GRAMOS"}
          porcion={alt.porcion}
          esReceta={alt.esReceta}
          recetaIngredientes={alt.recetaIngredientes}
          recetaDescripcion={alt.recetaDescripcion}
          recetaPorciones={alt.recetaPorciones}
          href={altHref}
          interactionMode={interactionMode}
          ocultarCalorias={ocultarCalorias}
        >
          <span className={cn("font-medium truncate", alt.esReceta ? "text-purple-600 dark:text-purple-400" : "text-foreground/80", interactionMode === "dashboard" && "hover:underline")}>{alt.nombre}</span>
        </FoodHoverCard>
      ) : (
        <span className={cn("font-medium truncate", alt.esReceta ? "text-purple-600 dark:text-purple-400" : "text-foreground/80")}>{alt.nombre}</span>
      )}
      {onRenombrar && !editandoNombre && (
        <button
          onClick={() => setEditandoNombre(true)}
          title={t("alimentoCard.renombrar")}
          className="p-0.5 rounded text-muted-foreground/40 hover:text-primary opacity-0 group-hover/alt:opacity-100 focus:opacity-100 transition-opacity shrink-0"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
      {onConvertirEnPrincipal && (
        <button
          onClick={() => onConvertirEnPrincipal(alt.id)}
          title={t("alimentoCard.convertirEnPrincipal")}
          className="ml-auto p-0.5 rounded hover:bg-primary/10 text-muted-foreground/50 hover:text-primary transition-colors shrink-0"
        >
          <ArrowUpToLine className="w-3 h-3" />
        </button>
      )}
      {onEliminar && (
        <button
          onClick={() => onEliminar(alt.id)}
          title={t("alimentoCard.removeAlternativa")}
          className={cn(
            "p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-muted-foreground/50 hover:text-red-500 transition-colors shrink-0",
            !onConvertirEnPrincipal && "ml-auto",
          )}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function AlimentoCard({
  id,
  comidaId,
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
  onReordenar,
  esPrimero = false,
  esUltimo = false,
  onCantidadChange,
  onBuscarEquivalente,
  onCopiar,
  alternativas,
  onEliminarAlternativa,
  onPromoverAlternativa,
  onConvertirAlternativaEnPrincipal,
  onCantidadAlternativaChange,
  onRenombrar,
  onGuardarEquivalencias,
  pendiente = false,
}: AlimentoCardProps) {
  const t = useTranslations("diets");
  const [tempCantidad, setTempCantidad] = useState(cantidad);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [tempNombre, setTempNombre] = useState(nombre);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [menuEliminarOpen, setMenuEliminarOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    setTempNombre(nombre);
  }, [nombre]);

  function guardarNombre() {
    setEditandoNombre(false);
    if (onRenombrar && tempNombre.trim() && tempNombre.trim() !== nombre) {
      onRenombrar(id, tempNombre.trim(), false);
    } else {
      setTempNombre(nombre);
    }
  }

  // Sincronizar la cantidad mostrada cuando cambia desde fuera (p. ej. al pegar
  // un alimento que ya existe en la comida y se SUMA su cantidad), no solo en
  // el primer render.
  useEffect(() => {
    setTempCantidad(cantidad);
  }, [cantidad]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id,
      data: { id, comidaId, nombre, cantidad, unidad, porcion, calorias, proteinas, carbohidratos, grasas },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  function handleCantidadChange(value: number) {
    setTempCantidad(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onCantidadChange(id, value);
    }, 500);
  }

  const unidadLabel = getUnidadLabel(unidad || "GRAMOS", esReceta, cantidad);
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
      <div className="border-b border-border/50 last:border-b-0">
        <div className="flex items-center gap-2 px-3 py-2.5">
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

        {/* Alternativas "o ..." visibles también para el paciente (#5, solo lectura) */}
        {alternativas && alternativas.length > 0 && (
          <div className="pl-9 pr-3 pb-2 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
              {t("alimentoCard.alternativasLabel")}
            </p>
            {alternativas.map((alt) => (
              <AlternativaRow
                key={alt.id}
                alt={alt}
                interactionMode={interactionMode}
                ocultarCalorias={ocultarCalorias}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("border-b border-border/50 last:border-b-0", pendiente && "pointer-events-none")}>
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 touch-none",
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
        <CantidadInput
          value={tempCantidad}
          onChange={handleCantidadChange}
          // Con equivalencias, guardar solo al confirmar (blur/Enter): así el reescalado de
          // las alternativas ocurre una vez con el valor final y no se encadena sobre los
          // valores intermedios del tecleo, que las dejaba todas iguales al principal (#126).
          commitOnly={!!(alternativas && alternativas.length > 0)}
          className="w-16 sm:w-14 px-2 py-1 sm:px-1.5 sm:py-0.5 text-base sm:text-sm rounded border border-transparent hover:border-border focus:border-primary/50 bg-transparent text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/20"
          min={0}
          max={10000}
          redondearA={esReceta || esUnidadDiscreta(unidad) ? 0.5 : undefined}
        />
        <span className="text-muted-foreground text-sm shrink-0">
          {unidadLabel} {t("alimentoCard.unitConnector")}
        </span>
        {editandoNombre ? (
          <input
            type="text"
            value={tempNombre}
            autoFocus
            maxLength={200}
            onChange={(e) => setTempNombre(e.target.value)}
            onBlur={guardarNombre}
            onKeyDown={(e) => {
              if (e.key === "Enter") guardarNombre();
              if (e.key === "Escape") { setTempNombre(nombre); setEditandoNombre(false); }
            }}
            className="flex-1 min-w-0 px-1.5 py-0.5 text-sm rounded border border-primary/40 bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        ) : (
          <FoodHoverCard {...foodHoverProps}>
            <span className={cn("truncate font-medium", nameColor, interactionMode === "dashboard" && "hover:underline")}>{nombre}</span>
          </FoodHoverCard>
        )}
        {onRenombrar && !editandoNombre && (
          <button
            onClick={() => setEditandoNombre(true)}
            title={t("alimentoCard.renombrar")}
            className="p-0.5 rounded text-muted-foreground/40 hover:text-primary transition-colors shrink-0"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
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

      {onReordenar && (
        <div className="flex flex-col shrink-0">
          <button
            onClick={() => onReordenar(id, "up")}
            disabled={esPrimero}
            className="px-1 rounded border border-border/60 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground/50 hover:text-primary transition-all disabled:opacity-25 disabled:pointer-events-none"
            title={t("alimentoCard.moverArriba")}
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onReordenar(id, "down")}
            disabled={esUltimo}
            className="px-1 rounded border border-border/60 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground/50 hover:text-primary transition-all disabled:opacity-25 disabled:pointer-events-none"
            title={t("alimentoCard.moverAbajo")}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {onBuscarEquivalente && (
        <button
          onClick={() => onBuscarEquivalente(
            realId,
            nombre, calorias, proteinas, carbohidratos, grasas,
            esReceta ? cantidad : convertirAGramos(cantidad, unidad || "GRAMOS", porcion || 100),
            !!esReceta,
          )}
          className="p-1.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary/80 hover:text-primary transition-all shrink-0"
          title={t("alimentoCard.searchEquivalent")}
        >
          <Replace className="w-4 h-4" />
        </button>
      )}

      {onCopiar && (
        <button
          onClick={() => onCopiar(id)}
          className="p-1.5 rounded border border-border/60 hover:bg-primary/10 hover:border-primary/30 text-muted-foreground/50 hover:text-primary transition-all shrink-0"
          title={t("copiar.copiarAlimento")}
        >
          <Copy className="w-4 h-4" />
        </button>
      )}

      {alternativas && alternativas.length > 0 ? (
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuEliminarOpen((v) => !v)}
            className="p-1.5 rounded border border-border/60 hover:bg-red-50 dark:hover:bg-red-500/15 hover:border-red-200 text-muted-foreground/50 hover:text-red-500 transition-all"
            title={t("alimentoCard.delete")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {menuEliminarOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuEliminarOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-border bg-card shadow-lg p-1 text-sm">
                <button
                  onClick={() => { setMenuEliminarOpen(false); onRemove(id); }}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-500/15 text-red-600 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  {t("alimentoCard.eliminarTodo")}
                </button>
                {onPromoverAlternativa && (
                  <>
                    <div className="px-3 pt-2 pb-1 text-xs text-muted-foreground">
                      {t("alimentoCard.dejarComoPrincipal")}
                    </div>
                    {alternativas.map((alt) => (
                      <button
                        key={alt.id}
                        onClick={() => { setMenuEliminarOpen(false); onPromoverAlternativa(alt.id); }}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-primary/10 flex items-center gap-2"
                      >
                        <CornerDownRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60" />
                        <span className="truncate">{alt.nombre}</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => onRemove(id)}
          className="p-1.5 rounded border border-border/60 hover:bg-red-50 dark:hover:bg-red-500/15 hover:border-red-200 text-muted-foreground/50 hover:text-red-500 transition-all shrink-0"
          title={t("alimentoCard.delete")}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      </div>

      {alternativas && alternativas.length > 0 && (
        <div className="pl-9 pr-3 pb-2 space-y-1">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("alimentoCard.alternativasLabel")}
            </p>
            {onGuardarEquivalencias && !revisionOpen && (
              <button
                type="button"
                onClick={() => setRevisionOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary/70 hover:text-primary transition-colors"
                title={t("alimentoCard.revisarEquivalencias")}
              >
                <SlidersHorizontal className="w-3 h-3" />
                {t("alimentoCard.revisarEquivalencias")}
              </button>
            )}
          </div>
          {alternativas.map((alt) => (
            <AlternativaRow
              key={alt.id}
              alt={alt}
              interactionMode={interactionMode}
              ocultarCalorias={ocultarCalorias}
              onCantidadChange={onCantidadAlternativaChange}
              onRenombrar={onRenombrar}
              onEliminar={onEliminarAlternativa}
              onConvertirEnPrincipal={onConvertirAlternativaEnPrincipal}
            />
          ))}
          {revisionOpen && onGuardarEquivalencias && (
            <RevisionEquivalenciasPanel
              principal={{
                nombre,
                cantidad,
                unidad: unidad || "GRAMOS",
                esReceta: !!esReceta,
                calorias,
                proteinas,
                carbohidratos,
                grasas,
                porcion: porcion ?? 100,
              }}
              alternativas={alternativas.filter((a) => !a.pendiente)}
              onGuardar={(cantidadPrincipal, cambios) => {
                onGuardarEquivalencias(id, cantidadPrincipal, cambios);
                setRevisionOpen(false);
              }}
              onClose={() => setRevisionOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
