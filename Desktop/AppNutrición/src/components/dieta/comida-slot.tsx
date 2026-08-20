"use client";

import { useTranslations } from "next-intl";
import { useState, useRef, useEffect } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Copy, ClipboardPaste, Pencil, Trash2 } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AlimentoCard } from "./alimento-card";
import { EquivalentePanel } from "./equivalente-panel";
import { HoraSelect } from "./hora-select";
import { cn } from "@/lib/utils";
import { actualizarDescripcionComida, actualizarMetaComida } from "@/app/actions/planes";
import { calcularMacrosPorcion, convertirAGramos } from "@/lib/macros";
import type { InteractionMode } from "@/components/food-hover-card";
import type { ObjetivoComida } from "@/lib/reparto-comidas";

interface AlimentoEnSlot {
  id: string;
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
  /** UI optimista: alimento recién añadido aún sin confirmar (#5). */
  pendiente?: boolean;
  alternativas?: {
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
  }[];
}

interface ComidaSlotProps {
  comidaId: string;
  tipo: string;
  descripcion?: string | null;
  /** Alias visible de la comida (#104): si está, sustituye la etiqueta del tipo. */
  nombre?: string | null;
  /** Hora "HH:MM" de la comida (#104). */
  hora?: string | null;
  /** Notifica el cambio de hora al padre para reordenar en vivo (#104). */
  onHoraChange?: (comidaId: string, hora: string) => void;
  alimentos: AlimentoEnSlot[];
  onAdd: (comidaId: string) => void;
  onRemove: (alimentoEnComidaId: string) => void;
  /** Reordenar un alimento dentro de la comida con flechas ↑/↓ (#27). */
  onReordenar?: (alimentoEnComidaId: string, dir: "up" | "down") => void;
  onCantidadChange: (alimentoEnComidaId: string, cantidad: number) => void;
  onReemplazar?: (alimentoEnComidaId: string, nuevoAlimentoId: string, nombre: string, cantidad: number, esReceta?: boolean) => void;
  onCopiar?: (comidaId: string) => void;
  /** Elimina toda la comida del día (#104 Fase 2). */
  onEliminarComida?: () => void;
  onCopiarAlimento?: (alimentoEnComidaId: string) => void;
  /** Nombre del alimento en el "portapapeles" (si hay uno copiado); muestra el botón Pegar. */
  pegarAlimentoLabel?: string | null;
  onPegarAlimento?: (comidaId: string) => void;
  /** Abre el selector para añadir una alternativa a un ítem (#5). */
  onAbrirSelectorAlternativa?: (alimentoEnComidaId: string) => void;
  onEliminarAlternativa?: (alternativaId: string) => void;
  /** Promueve una alternativa a alimento principal (#29). */
  onPromoverAlternativa?: (alternativaId: string) => void;
  /** Intercambia una alternativa con el principal (swap) (#29). */
  onConvertirAlternativaEnPrincipal?: (alternativaId: string) => void;
  /** Añade el equivalente elegido como alternativa (desde el panel de equivalente). */
  onAgregarAlternativaDirecta?: (alimentoEnComidaId: string, alimentoId: string, nombre: string, cantidad: number, esReceta?: boolean) => void;
  /** Edita la cantidad de una alternativa ya añadida (#5). */
  onCantidadAlternativaChange?: (alternativaId: string, cantidad: number) => void;
  /** Alias visual de una línea o alternativa (#5). */
  onRenombrar?: (id: string, nombre: string, esAlternativa: boolean) => void;
  /** Guarda la revisión de equivalencias de un ítem (#5). */
  onGuardarEquivalencias?: (id: string, cantidadPrincipal: number, cambios: { id: string; cantidad: number }[]) => void;
  compactHeader?: boolean;
  readOnly?: boolean;
  interactionMode?: InteractionMode;
  ocultarCalorias?: boolean;
  /** #78-C — objetivo de esta comida según el reparto de la planificación aplicado al día.
   *  "sinReparto" = hay reparto activo pero esta comida quedó fuera (se avisa y se ofrece añadirla).
   *  null/ausente = no hay reparto activo: la comida se ve como siempre. */
  objetivo?: ObjetivoComida | "sinReparto" | null;
  /** Añade ESTA comida al reparto de la dieta (solo se ofrece si `objetivo` es "sinReparto"). */
  onAnadirAlReparto?: () => void;
}

export function ComidaSlot({
  comidaId,
  tipo,
  descripcion,
  nombre: nombreInicial,
  hora: horaInicial,
  onHoraChange,
  alimentos,
  onAdd,
  onRemove,
  onReordenar,
  onCantidadChange,
  onReemplazar,
  onCopiar,
  onEliminarComida,
  onCopiarAlimento,
  pegarAlimentoLabel,
  onPegarAlimento,
  onAbrirSelectorAlternativa,
  onEliminarAlternativa,
  onPromoverAlternativa,
  onConvertirAlternativaEnPrincipal,
  onAgregarAlternativaDirecta,
  onCantidadAlternativaChange,
  onRenombrar,
  onGuardarEquivalencias,
  readOnly = false,
  interactionMode = "dashboard",
  ocultarCalorias = false,
  objetivo = null,
  onAnadirAlReparto,
}: ComidaSlotProps) {
  const t = useTranslations("diets");

  const { setNodeRef, isOver } = useDroppable({
    id: `comida-${comidaId}`,
    data: { comidaId },
  });

  const [desc, setDesc] = useState(descripcion || "");
  const horaDefault = (t(`comidaSlot.horaDefault.${tipo}` as any) as string) || "";
  // #104 — nombre (alias) y hora editables/persistidos. Si no hay hora propia, se muestra la del tipo.
  const [hora, setHora] = useState(horaInicial || horaDefault);
  const [nombreComida, setNombreComida] = useState(nombreInicial || "");
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const metaDebounceRef = useRef<NodeJS.Timeout>(null);

  // Sincronizar la nota cuando cambia desde fuera (p. ej. al copiar una comida
  // en modo "Reemplazar", que clona también su descripción).
  useEffect(() => {
    setDesc(descripcion || "");
  }, [descripcion]);
  useEffect(() => {
    setNombreComida(nombreInicial || "");
  }, [nombreInicial]);
  useEffect(() => {
    setHora(horaInicial || horaDefault);
  }, [horaInicial, horaDefault]);

  function handleHoraChange(value: string) {
    setHora(value);
    onHoraChange?.(comidaId, value); // reordena en vivo por hora
    if (metaDebounceRef.current) clearTimeout(metaDebounceRef.current);
    metaDebounceRef.current = setTimeout(() => {
      actualizarMetaComida(comidaId, { hora: value });
    }, 500);
  }

  function handleNombreChange(value: string) {
    setNombreComida(value);
    if (metaDebounceRef.current) clearTimeout(metaDebounceRef.current);
    metaDebounceRef.current = setTimeout(() => {
      actualizarMetaComida(comidaId, { nombre: value });
    }, 700);
  }
  const [collapsed, setCollapsed] = useState(false);
  const [equivalenteOpen, setEquivalenteOpen] = useState<{
    alimentoEnComidaId: string;
    alimentoRealId: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    cantidad: number;
    esReceta: boolean;
  } | null>(null);
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
    let fibra = 0;

    for (const a of alimentos) {
      if (a.esReceta) {
        calorias += Math.round(a.calorias * a.cantidad * 10) / 10;
        proteinas += Math.round(a.proteinas * a.cantidad * 10) / 10;
        carbohidratos += Math.round(a.carbohidratos * a.cantidad * 10) / 10;
        grasas += Math.round(a.grasas * a.cantidad * 10) / 10;
        fibra += Math.round((a.fibra || 0) * a.cantidad * 10) / 10;
      } else {
        const gramos = convertirAGramos(a.cantidad, a.unidad || "GRAMOS", a.porcion || 100);
        const m = calcularMacrosPorcion(
          {
            calorias: a.calorias,
            proteinas: a.proteinas,
            carbohidratos: a.carbohidratos,
            grasas: a.grasas,
            fibra: a.fibra || 0,
          },
          gramos
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

  // #78-C Fase 2 — cumplimiento del objetivo por comida (reparto de la planificación).
  const objetivoComida =
    objetivo && objetivo !== "sinReparto" ? objetivo : null;
  // Color de la pill de kcal según el desvío: verde dentro de ±5%, ámbar hasta ±15%, rojo más.
  // Con la comida vacía se queda neutra (mostrar "0 / 400" en rojo de salida no ayuda).
  const kcalStatus = (() => {
    if (!objetivoComida || objetivoComida.kcal <= 0 || alimentos.length === 0) return null;
    const desvio = Math.abs(mealTotals.calorias - objetivoComida.kcal) / objetivoComida.kcal;
    return desvio <= 0.05 ? "ok" : desvio <= 0.15 ? "aviso" : "desvio";
  })();

  return (
    <div
      ref={setNodeRef}
      id={`comida-slot-${comidaId}`}
      className={cn(
        "rounded-2xl border border-border/60 bg-card shadow-md overflow-hidden transition-colors",
        isOver && "ring-2 ring-primary/30 border-primary/30"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4">
        {readOnly ? (
          hora ? (
            <span className="text-sm sm:text-base text-muted-foreground tabular-nums shrink-0">{hora}</span>
          ) : null
        ) : (
          <HoraSelect value={hora} onChange={handleHoraChange} />
        )}
        {!readOnly && editandoTitulo ? (
          <input
            autoFocus
            value={nombreComida}
            onChange={(e) => handleNombreChange(e.target.value)}
            onBlur={() => setEditandoTitulo(false)}
            onKeyDown={(e) => { if (e.key === "Enter") setEditandoTitulo(false); }}
            placeholder={(t(`comidaSlot.tipoLabels.${tipo}` as any) as string) || tipo}
            maxLength={60}
            className="text-base sm:text-lg font-bold text-foreground flex-1 min-w-0 bg-transparent border-b border-primary/50 focus:outline-none"
          />
        ) : (
          <h4
            className={cn(
              "text-base sm:text-lg font-bold text-foreground flex-1 min-w-0 truncate flex items-center gap-1.5",
              !readOnly && "cursor-text",
            )}
            onClick={() => { if (!readOnly) setEditandoTitulo(true); }}
          >
            <span className="truncate">{nombreComida || (t(`comidaSlot.tipoLabels.${tipo}` as any) || tipo)}</span>
            {!readOnly && <Pencil className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
          </h4>
        )}
        {!readOnly && onCopiar && (
          <button
            onClick={() => onCopiar(comidaId)}
            title={t("copiar.copiarComida")}
            aria-label={t("copiar.copiarComida")}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors shrink-0"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
        {!readOnly && onEliminarComida && (
          <button
            onClick={onEliminarComida}
            title={t("editor.eliminarComida")}
            aria-label={t("editor.eliminarComida")}
            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/15 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Collapsible content */}
      {!collapsed && (
        <>
          {/* Food items */}
          <div className="divide-y divide-border/30">
            {alimentos.length === 0 ? (
              <div className="px-4 py-3 text-xs text-muted-foreground italic">
                {t("comidaSlot.noFoods")}
              </div>
            ) : (
              <SortableContext items={alimentos.map((a) => a.id)} strategy={verticalListSortingStrategy}>
              {alimentos.map((a, idx) => (
                <div key={a.id}>
                  <AlimentoCard
                    id={a.id}
                    comidaId={comidaId}
                    alimentoRealId={a.alimentoRealId}
                    nombre={a.nombre}
                    cantidad={a.cantidad}
                    unidad={a.unidad}
                    porcion={a.porcion}
                    calorias={a.calorias}
                    proteinas={a.proteinas}
                    carbohidratos={a.carbohidratos}
                    grasas={a.grasas}
                    fibra={a.fibra}
                    esReceta={a.esReceta}
                    esPropio={a.esPropio}
                    enlaceProducto={a.enlaceProducto}
                    imagenUrl={a.imagenUrl}
                    recetaIngredientes={a.recetaIngredientes}
                    recetaDescripcion={a.recetaDescripcion}
                    recetaPorciones={a.recetaPorciones}
                    pendiente={a.pendiente}
                    readOnly={readOnly}
                    interactionMode={interactionMode}
                    ocultarCalorias={ocultarCalorias}
                    onRemove={onRemove}
                    onReordenar={readOnly ? undefined : onReordenar}
                    esPrimero={idx === 0}
                    esUltimo={idx === alimentos.length - 1}
                    onCantidadChange={onCantidadChange}
                    onCopiar={onCopiarAlimento}
                    alternativas={a.alternativas}
                    onEliminarAlternativa={readOnly ? undefined : onEliminarAlternativa}
                    onPromoverAlternativa={readOnly ? undefined : onPromoverAlternativa}
                    onConvertirAlternativaEnPrincipal={readOnly ? undefined : onConvertirAlternativaEnPrincipal}
                    onCantidadAlternativaChange={readOnly ? undefined : onCantidadAlternativaChange}
                    onRenombrar={readOnly ? undefined : onRenombrar}
                    onGuardarEquivalencias={readOnly ? undefined : onGuardarEquivalencias}
                    onBuscarEquivalente={readOnly ? undefined : (_id, nombre, cal, prot, carb, gras, cant, esRec) => {
                      setEquivalenteOpen(
                        equivalenteOpen?.alimentoEnComidaId === a.id
                          ? null
                          : { alimentoEnComidaId: a.id, alimentoRealId: a.alimentoRealId || a.id, nombre, calorias: cal, proteinas: prot, carbohidratos: carb, grasas: gras, cantidad: cant, esReceta: esRec }
                      );
                    }}
                  />
                  {equivalenteOpen?.alimentoEnComidaId === a.id && (
                    <EquivalentePanel
                      alimentoId={equivalenteOpen.alimentoRealId}
                      nombre={equivalenteOpen.nombre}
                      calorias={equivalenteOpen.calorias}
                      proteinas={equivalenteOpen.proteinas}
                      carbohidratos={equivalenteOpen.carbohidratos}
                      grasas={equivalenteOpen.grasas}
                      cantidad={equivalenteOpen.cantidad}
                      esReceta={equivalenteOpen.esReceta}
                      onSelect={(nuevoId, nombre, cantidad) => {
                        if (onReemplazar) onReemplazar(a.id, nuevoId, nombre, cantidad, equivalenteOpen?.esReceta ?? false);
                        setEquivalenteOpen(null);
                      }}
                      onAgregarAlternativa={
                        onAgregarAlternativaDirecta
                          ? (nuevoId, nombre, cantidad) => {
                              // El panel NO se cierra: el nutri puede añadir varias alternativas seguidas.
                              onAgregarAlternativaDirecta(a.id, nuevoId, nombre, cantidad, equivalenteOpen?.esReceta ?? false);
                            }
                          : undefined
                      }
                      onMasOpciones={
                        onAbrirSelectorAlternativa
                          ? () => { onAbrirSelectorAlternativa(a.id); setEquivalenteOpen(null); }
                          : undefined
                      }
                      onClose={() => setEquivalenteOpen(null)}
                    />
                  )}
                </div>
              ))}
              </SortableContext>
            )}
          </div>

          {/* Add food + paste bar */}
          {!readOnly && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onAdd(comidaId)}
                className={cn(
                  "w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  isOver
                    ? "bg-primary/20 text-primary"
                    : "bg-primary/10 text-primary hover:bg-primary/15"
                )}
              >
                {t("comidaSlot.addFood")}
              </button>
              {pegarAlimentoLabel && onPegarAlimento && (
                <button
                  type="button"
                  onClick={() => onPegarAlimento(comidaId)}
                  title={pegarAlimentoLabel}
                  className="w-full px-4 py-2.5 text-sm font-medium rounded-lg border border-dashed border-primary/50 text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ClipboardPaste className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t("copiar.pegarAqui")}</span>
                </button>
              )}
            </div>
          )}

          {/* Notes */}
          {readOnly ? (
            desc.trim() ? (
              <div className="px-4 py-3 border-t border-border/50">
                <div className="text-sm font-semibold text-foreground mb-1.5">{t("comidaSlot.notes")}</div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{desc}</p>
              </div>
            ) : null
          ) : (
            <div className="px-4 py-3 border-t border-border/50">
              <div className="text-sm font-semibold text-foreground mb-1.5">{t("comidaSlot.notes")}</div>
              <textarea
                value={desc}
                onChange={(e) => handleDescChange(e.target.value)}
                placeholder={t("comidaSlot.notesPlaceholder")}
                maxLength={500}
                rows={2}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-muted/30 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:text-foreground placeholder:italic resize-none"
              />
            </div>
          )}

          {/* Macro pills — totales por comida, ocultos si ocultarCalorias */}
          {!ocultarCalorias && (
          <div className="px-2 sm:px-4 py-2 sm:py-3 border-t border-border/50 bg-muted/10">
            {/* Con objetivo por comida las pastillas ponen "X / Y": sin esta leyenda no se entiende
                que el primer número es lo que llevas y el segundo el objetivo de ESA comida. */}
            {objetivoComida && (
              <p className="mb-1.5 text-center text-[10px] sm:text-xs text-muted-foreground">
                {t("comidaSlot.leyendaObjetivo")}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
              {/* Con objetivo del reparto (#78-C): "total / objetivo" y color según desvío. */}
              <span
                title={
                  objetivoComida
                    ? t("comidaSlot.tooltipObjetivo", {
                        actual: Math.round(mealTotals.calorias),
                        objetivo: objetivoComida.kcal,
                      })
                    : undefined
                }
                className={cn(
                  "inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full text-[10px] sm:text-sm font-medium",
                  kcalStatus === "ok" && "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400",
                  kcalStatus === "aviso" && "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
                  kcalStatus === "desvio" && "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
                  kcalStatus === null && "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                )}
              >
                {Math.round(mealTotals.calorias)}{objetivoComida ? ` / ${objetivoComida.kcal}` : ""} kcal
              </span>
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-[10px] sm:text-sm font-medium">
                G {mealTotals.grasas.toFixed(1)}{objetivoComida?.grasaG != null ? ` / ${objetivoComida.grasaG}` : ""}g
              </span>
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-[10px] sm:text-sm font-medium">
                C {mealTotals.carbohidratos.toFixed(1)}{objetivoComida?.carbG != null ? ` / ${objetivoComida.carbG}` : ""}g
              </span>
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] sm:text-sm font-medium">
                P {mealTotals.proteinas.toFixed(1)}{objetivoComida?.protG != null ? ` / ${objetivoComida.protG}` : ""}g
              </span>
              <span className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3.5 py-0.5 sm:py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-sm font-medium">
                F {mealTotals.fibra.toFixed(1)}g
              </span>
            </div>
            {/* Comida fuera del reparto: se avisa Y se ofrece añadirla de un clic (#78-C). */}
            {objetivo === "sinReparto" && alimentos.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[10px] sm:text-xs text-amber-600 dark:text-amber-400">
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  {t("comidaSlot.sinObjetivoReparto")}
                </span>
                {onAnadirAlReparto && !readOnly && (
                  <button type="button" onClick={onAnadirAlReparto} className="font-medium text-primary hover:underline">
                    {t("comidaSlot.anadirAlReparto")}
                  </button>
                )}
              </div>
            )}
          </div>
          )}
        </>
      )}
    </div>
  );
}
