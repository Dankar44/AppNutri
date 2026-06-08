"use client";

import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

const HORAS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const DEFAULT_INPUT_CLS =
  "w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow";

/** "1430" → "14:30" mientras se escribe (pone los ":" automáticamente). */
function formatTyped(raw: string): string {
  const d = raw.replace(/[^\d]/g, "").slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** Valida lo tecleado y devuelve "HH:MM" normalizado, o null si no es una hora válida. */
function parseTyped(input: string): string | null {
  const d = input.replace(/[^\d]/g, "");
  let hh: number;
  let mm: number;
  if (d.length === 4) {
    hh = parseInt(d.slice(0, 2));
    mm = parseInt(d.slice(2, 4));
  } else if (d.length === 3) {
    hh = parseInt(d.slice(0, 1));
    mm = parseInt(d.slice(1, 3));
  } else {
    return null;
  }
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/**
 * Selector de hora: se puede ESCRIBIR directamente (HH:MM) o elegir en las dos
 * ruedas (hora y minutos) tipo alarma de reloj. value/onChange en formato "HH:MM".
 */
export function TimePicker({
  value,
  onChange,
  inputClassName,
  ariaLabel = "Hora",
  fecha,
}: {
  value: string;
  onChange: (v: string) => void;
  inputClassName?: string;
  ariaLabel?: string;
  /** Fecha de la cita (YYYY-MM-DD). Si es hoy, las horas/minutos pasados salen en gris. */
  fecha?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState(value || "");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const horaRef = useRef<HTMLButtonElement>(null);
  const minRef = useRef<HTMLButtonElement>(null);

  // Sincroniza el texto con el valor (cuando se elige en las ruedas o cambia fuera).
  useEffect(() => {
    setTyped(value || "");
  }, [value]);

  const [hh, mm] = (value && /^\d{1,2}:\d{1,2}$/.test(value) ? value : "10:00")
    .split(":")
    .map((p) => p.padStart(2, "0"));

  // Si la cita es para hoy, las horas/minutos ya pasados se muestran en gris.
  const ahora = new Date();
  const esHoy = !!fecha && fecha === ahora.toLocaleDateString("sv-SE");
  const ahoraH = ahora.getHours();
  const ahoraM = ahora.getMinutes();
  const horaDeshabilitada = (h: string) => esHoy && parseInt(h) < ahoraH;
  const minDeshabilitado = (m: string) => esHoy && parseInt(hh) === ahoraH && parseInt(m) < ahoraM;

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
    requestAnimationFrame(() => {
      horaRef.current?.scrollIntoView({ block: "center" });
      minRef.current?.scrollIntoView({ block: "center" });
    });
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(nuevaHora: string, nuevoMin: string) {
    onChange(`${nuevaHora}:${nuevoMin}`);
  }

  return (
    <div ref={ref} className="relative">
      <div className={`${inputClassName ?? DEFAULT_INPUT_CLS} flex items-center gap-2`}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          aria-label={ariaLabel}
          placeholder="HH:MM"
          value={typed}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const formatted = formatTyped(e.target.value);
            setTyped(formatted);
            const parsed = parseTyped(formatted);
            if (parsed) onChange(parsed);
          }}
          onBlur={() => {
            const parsed = parseTyped(typed);
            if (parsed) {
              onChange(parsed);
              setTyped(parsed);
            } else {
              setTyped(value || "");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              inputRef.current?.blur();
            }
          }}
          className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground min-w-0"
        />
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
        >
          <Clock className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 z-50 mt-1 flex rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          <div className="flex flex-col">
            <span className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground text-center">Hora</span>
            <ul className="h-44 w-16 overflow-y-auto py-1">
              {HORAS.map((h) => {
                const sel = h === hh;
                const dis = horaDeshabilitada(h);
                return (
                  <li key={h}>
                    <button
                      ref={sel ? horaRef : undefined}
                      type="button"
                      disabled={dis}
                      onClick={() => pick(h, mm)}
                      className={`block w-full py-1.5 text-center text-sm rounded-md transition-colors ${
                        dis
                          ? "text-muted-foreground/30 cursor-not-allowed"
                          : sel
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "hover:bg-primary/10 text-foreground"
                      }`}
                    >
                      {h}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="flex items-center text-muted-foreground font-semibold">:</div>
          <div className="flex flex-col">
            <span className="px-3 pt-2 pb-1 text-[11px] font-medium text-muted-foreground text-center">Min</span>
            <ul className="h-44 w-16 overflow-y-auto py-1">
              {MINUTOS.map((m) => {
                const sel = m === mm;
                const dis = minDeshabilitado(m);
                return (
                  <li key={m}>
                    <button
                      ref={sel ? minRef : undefined}
                      type="button"
                      disabled={dis}
                      onClick={() => pick(hh, m)}
                      className={`block w-full py-1.5 text-center text-sm rounded-md transition-colors ${
                        dis
                          ? "text-muted-foreground/30 cursor-not-allowed"
                          : sel
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "hover:bg-primary/10 text-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
