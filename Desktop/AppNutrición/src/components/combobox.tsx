"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

const DEFAULT_INPUT_CLS =
  "w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";

/**
 * Desplegable propio (no nativo): se abre SIEMPRE hacia abajo, con altura fija +
 * scroll y buscador. Evita el problema del <select> nativo con listas largas, que
 * el navegador abre hacia arriba y puede ocupar toda la pantalla.
 *
 * `inputClassName` controla el estilo del botón para que combine con el formulario
 * donde se use (cada form de la app tiene su propio estilo de input).
 */
export function Combobox({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  compact = false,
  className = "",
  inputClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  ariaLabel: string;
  compact?: boolean;
  className?: string;
  inputClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  const buttonText = compact ? value || placeholder : selected ? selected.label : placeholder;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className={`${inputClassName ?? DEFAULT_INPUT_CLS} flex items-center justify-between gap-1 text-left`}
      >
        <span className={selected || (compact && value) ? "" : "text-muted-foreground"}>{buttonText}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-1 min-w-full w-max max-w-[min(20rem,80vw)] rounded-lg border border-border bg-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.map((o) => (
              <li key={`${o.value}-${o.label}`}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                >
                  <span>{o.label}</span>
                  {o.value === value && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
