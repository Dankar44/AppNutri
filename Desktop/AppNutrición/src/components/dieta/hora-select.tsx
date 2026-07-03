"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// Sugerencias cada 15 min como atajo; escribir a mano permite cualquier hora/minuto.
const HORAS: string[] = (() => {
  const arr: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      arr.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return arr;
})();

function parseHora(raw: string): string | null {
  const m = raw.trim().replace(/\s/g, "").match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mi = parseInt(m[2], 10);
  if (h > 23 || mi > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

/**
 * Selector de hora propio (#104), con la estética de la app (verde): campo editable
 * (cualquier hora/minuto) + lista de sugerencias cada 15 min. Sin picker nativo.
 */
export function HoraSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState(value || "");
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTexto(value || "");
  }, [value]);

  useEffect(() => {
    if (open) selectedRef.current?.scrollIntoView({ block: "center" });
  }, [open]);

  function commit(raw: string) {
    const parsed = parseHora(raw);
    if (parsed) {
      setTexto(parsed);
      if (parsed !== value) onChange(parsed);
    } else {
      setTexto(value || ""); // inválido → revertir a lo último válido
    }
  }

  function handleInput(raw: string) {
    let v = raw.replace(/[^\d:]/g, "");
    const dig = v.replace(/:/g, "");
    // Auto-insertar ":" al llegar al 3er dígito para escribir cómodo (09 → 09:2 → 09:23).
    if (!v.includes(":") && dig.length > 2) v = `${dig.slice(0, 2)}:${dig.slice(2, 4)}`;
    setTexto(v.slice(0, 5));
  }

  // Solo se filtra mientras se teclea parcialmente (1-3 dígitos); con la hora completa
  // (o el campo vacío) se muestra la lista entera y se hace scroll a la seleccionada.
  const soloDig = texto.replace(/\D/g, "");
  const filtradas = soloDig.length >= 1 && soloDig.length <= 3
    ? HORAS.filter((h) => h.replace(":", "").startsWith(soloDig))
    : HORAS;
  const lista = filtradas.length > 0 ? filtradas : HORAS;

  return (
    <div className="relative shrink-0">
      <input
        value={texto}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => commit(texto)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { commit(texto); setOpen(false); e.currentTarget.blur(); }
          else if (e.key === "Escape") { setTexto(value || ""); setOpen(false); e.currentTarget.blur(); }
        }}
        placeholder="--:--"
        inputMode="numeric"
        maxLength={5}
        className="w-[5rem] rounded-lg border border-transparent hover:border-border focus:border-primary/50 px-2 py-0.5 text-sm sm:text-base font-medium text-primary tabular-nums text-center focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
      />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-50 w-24 max-h-64 overflow-y-auto rounded-lg border border-border bg-card shadow-lg p-1">
            {lista.map((h) => (
              <button
                key={h}
                ref={h === value ? selectedRef : undefined}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setTexto(h); if (h !== value) onChange(h); setOpen(false); }}
                className={cn(
                  "w-full text-center px-2 py-1.5 rounded-md text-sm tabular-nums transition-colors",
                  h === value
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-foreground hover:bg-primary/10",
                )}
              >
                {h}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
