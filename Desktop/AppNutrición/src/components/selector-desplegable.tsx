"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type OpcionSelectorDesplegable = {
  value: string;
  label: string;
  insignia?: string;
  insigniaClassName?: string;
};

export function SelectorDesplegable({
  value,
  onChange,
  options,
  ariaLabel,
  menuLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: OpcionSelectorDesplegable[];
  ariaLabel: string;
  menuLabel?: string;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const opcionSeleccionada = options.find((opcion) => opcion.value === value);

  useEffect(() => {
    if (!abierto) return;

    function cerrarAlHacerClickFuera(evento: MouseEvent) {
      if (ref.current && evento.target instanceof Node && !ref.current.contains(evento.target)) {
        setAbierto(false);
      }
    }

    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }

    document.addEventListener("mousedown", cerrarAlHacerClickFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarAlHacerClickFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        onClick={() => setAbierto((actual) => !actual)}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="min-w-0 truncate">{opcionSeleccionada?.label ?? "—"}</span>
          {opcionSeleccionada?.insignia && (
            <span
              className={cn(
                "inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
                opcionSeleccionada.insigniaClassName,
              )}
            >
              {opcionSeleccionada.insignia}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", abierto && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {abierto && (
        <div
          role="listbox"
          aria-label={menuLabel ?? ariaLabel}
          className="absolute left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
        >
          {menuLabel && (
            <div className="border-b border-border px-3 py-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              {menuLabel}
            </div>
          )}
          {options.map((opcion) => {
            const seleccionada = opcion.value === value;
            return (
              <button
                key={opcion.value}
                type="button"
                role="option"
                aria-selected={seleccionada}
                onClick={() => {
                  onChange(opcion.value);
                  setAbierto(false);
                }}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60",
                  seleccionada && "bg-primary/5",
                )}
              >
                <span className="min-w-0 truncate font-medium">{opcion.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {opcion.insignia && (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
                        opcion.insigniaClassName,
                      )}
                    >
                      {opcion.insignia}
                    </span>
                  )}
                  {seleccionada && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
