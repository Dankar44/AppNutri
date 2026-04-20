"use client";

import { StickyNote, Laugh, Smile, Meh, Frown, Angry, type LucideIcon } from "lucide-react";

interface Props {
  notas: string;
  onChange: (notas: string) => void;
  sensacion: string | null;
  onSensacion: (s: string | null) => void;
}

const SENSACIONES: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "genial", label: "Genial", Icon: Laugh },
  { value: "bien", label: "Bien", Icon: Smile },
  { value: "regular", label: "Regular", Icon: Meh },
  { value: "cansado", label: "Cansado", Icon: Frown },
  { value: "mal", label: "Mal", Icon: Angry },
];

export function NotasCard({ notas, onChange, sensacion, onSensacion }: Props) {
  return (
    <section
      aria-label="Notas del día"
      className="rounded-2xl border border-border bg-card p-5"
    >
      <header className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground">
          <StickyNote className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <h2 className="text-base font-semibold">¿Cómo te has sentido?</h2>
      </header>

      <div className="flex items-center justify-between gap-2 mb-3">
        {SENSACIONES.map(({ value, label, Icon }) => {
          const active = sensacion === value;
          return (
            <button
              key={value}
              onClick={() => onSensacion(active ? null : value)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 rounded-xl border transition-all ${
                active
                  ? "border-foreground bg-muted/60 shadow-sm"
                  : "border-border bg-card hover:bg-muted/40"
              }`}
              aria-pressed={active}
              aria-label={label}
            >
              <Icon className="w-6 h-6" strokeWidth={1.5} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <textarea
        value={notas}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cuenta cómo te ha ido el día, qué has comido fuera del plan, antojos..."
        rows={4}
        maxLength={2000}
        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20"
      />
      <div className="flex items-center justify-between mt-1">
        <p className="text-[11px] text-muted-foreground">
          Tu nutricionista podrá leer estas notas
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {notas.length}/2000
        </p>
      </div>
    </section>
  );
}
