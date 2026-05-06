"use client";

import { useState, useRef, useLayoutEffect, useEffect, useCallback, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { CookingPot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { calcularMacrosPorcion, convertirAGramos } from "@/lib/macros";
import { formatQuantity } from "@/lib/units";

export type InteractionMode = "dashboard" | "patient" | "shared";

interface Ingrediente {
  nombre: string;
  cantidad: number;
  unidad: string;
}

interface FoodHoverCardProps {
  children: ReactNode;
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  cantidad: number;
  unidad: string;
  porcion?: number;
  esReceta?: boolean;
  esPropio?: boolean;
  recetaIngredientes?: Ingrediente[];
  recetaDescripcion?: string | null;
  recetaPorciones?: number;
  enlaceProducto?: string | null;
  href?: string | null;
  interactionMode: InteractionMode;
}

const MAX_INGREDIENTES = 6;

export function FoodHoverCard({
  children,
  nombre,
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  fibra,
  cantidad,
  unidad,
  porcion,
  esReceta,
  esPropio,
  recetaIngredientes,
  recetaDescripcion,
  recetaPorciones,
  href,
  interactionMode,
}: FoodHoverCardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const id = useId();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  const show = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), 250);
  }, []);
  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 150);
  }, []);
  const keepOpen = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const recalc = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const cardEl = cardRef.current;
      const cw = cardEl?.offsetWidth ?? 288;
      const ch = cardEl?.offsetHeight ?? 200;
      const gap = 6;

      let top = rect.bottom + gap;
      let left = rect.left + rect.width / 2 - cw / 2;

      if (top + ch > window.innerHeight - 8) {
        top = rect.top - ch - gap;
      }
      left = Math.max(8, Math.min(left, window.innerWidth - cw - 8));
      top = Math.max(8, top);

      setCoords({ top, left });
    };
    recalc();
    requestAnimationFrame(recalc);
  }, [open]);

  const clickable = interactionMode === "dashboard" && !!href;

  function handleClick(e: React.MouseEvent) {
    if (!clickable || !href) return;
    e.stopPropagation();
    router.push(href);
  }

  const macros = (() => {
    if (esReceta) {
      return {
        calorias: Math.round(calorias * cantidad * 10) / 10,
        proteinas: Math.round(proteinas * cantidad * 10) / 10,
        carbohidratos: Math.round(carbohidratos * cantidad * 10) / 10,
        grasas: Math.round(grasas * cantidad * 10) / 10,
        fibra: Math.round(fibra * cantidad * 10) / 10,
      };
    }
    const gramos = convertirAGramos(cantidad, unidad, porcion || 100);
    return calcularMacrosPorcion(
      { calorias, proteinas, carbohidratos, grasas, fibra },
      gramos,
    );
  })();

  const ingredienteFactor = esReceta ? cantidad / (recetaPorciones || 1) : 1;
  const ingredientesVisibles = recetaIngredientes?.slice(0, MAX_INGREDIENTES);
  const ingredientesRestantes = (recetaIngredientes?.length ?? 0) - MAX_INGREDIENTES;

  return (
    <span
      ref={triggerRef}
      className={cn("inline-flex items-center min-w-0 max-w-full overflow-hidden", clickable && "cursor-pointer")}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Escape") { hide(); setOpen(false); }
        if (e.key === "Enter" && clickable && href) { e.stopPropagation(); router.push(href); }
      }}
      tabIndex={0}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {mounted && open &&
        createPortal(
          <div
            ref={cardRef}
            id={id}
            role="tooltip"
            onMouseEnter={keepOpen}
            onMouseLeave={hide}
            style={{
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              visibility: coords ? "visible" : "hidden",
            }}
            className="pointer-events-auto fixed z-[100] w-72 rounded-lg bg-card border border-border shadow-xl text-sm cursor-default print:hidden"
          >
            <div className="p-3 space-y-2.5">
              <div className="flex items-center gap-1.5">
                {esReceta && <CookingPot className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                {!esReceta && esPropio && <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                <span className={cn(
                  "font-semibold text-sm leading-tight line-clamp-2",
                  esReceta ? "text-purple-600 dark:text-purple-400" : esPropio ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
                )}>
                  {nombre || "Sin nombre"}
                </span>
              </div>

              <div className="border-t border-border/50 pt-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Energía</span>
                    <span className="font-semibold tabular-nums text-purple-500">{Math.round(macros.calorias)} kcal</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Proteínas</span>
                    <span className="font-semibold tabular-nums text-blue-500">{macros.proteinas.toFixed(1)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">H. Carbono</span>
                    <span className="font-semibold tabular-nums text-orange-500">{macros.carbohidratos.toFixed(1)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grasas</span>
                    <span className="font-semibold tabular-nums text-yellow-500">{macros.grasas.toFixed(1)}g</span>
                  </div>
                  {macros.fibra > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fibra</span>
                      <span className="font-semibold tabular-nums text-emerald-500">{macros.fibra.toFixed(1)}g</span>
                    </div>
                  )}
                </div>
              </div>

              {esReceta && ingredientesVisibles && ingredientesVisibles.length > 0 && (
                <div className="border-t border-border/50 pt-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Ingredientes</p>
                  <ul className="space-y-0.5 text-xs text-muted-foreground">
                    {ingredientesVisibles.map((ing, i) => (
                      <li key={i} className="truncate">
                        {formatQuantity(ing.cantidad * ingredienteFactor, ing.unidad)} {ing.nombre}
                      </li>
                    ))}
                    {ingredientesRestantes > 0 && (
                      <li className="text-muted-foreground/60 italic">+{ingredientesRestantes} más</li>
                    )}
                  </ul>
                </div>
              )}

              {esReceta && recetaDescripcion && (
                <p className="text-xs text-muted-foreground line-clamp-2 border-t border-border/50 pt-2">
                  {recetaDescripcion}
                </p>
              )}

              {clickable && (
                <p className="text-xs text-primary font-medium border-t border-border/50 pt-2 cursor-pointer">
                  Clic para ver detalle →
                </p>
              )}
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
