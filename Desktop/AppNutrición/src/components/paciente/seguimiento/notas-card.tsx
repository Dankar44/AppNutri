"use client";

import { StickyNote, Laugh, Smile, Meh, Frown, Angry, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  notas: string;
  onChange: (notas: string) => void;
  sensacion: string | null;
  onSensacion: (s: string | null) => void;
}

const SENSACIONES: { value: string; labelKey: string; Icon: LucideIcon }[] = [
  { value: "genial", labelKey: "genial", Icon: Laugh },
  { value: "bien", labelKey: "bien", Icon: Smile },
  { value: "regular", labelKey: "regular", Icon: Meh },
  { value: "cansado", labelKey: "cansado", Icon: Frown },
  { value: "mal", labelKey: "mal", Icon: Angry },
];

export function NotasCard({ notas, onChange, sensacion, onSensacion }: Props) {
  const t = useTranslations("patient-portal.seguimiento.notasCard");
  return (
    <section
      aria-label={t("title")}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <header className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground">
          <StickyNote className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <h2 className="text-base font-semibold">{t("title")}</h2>
      </header>

      <div className="flex items-center justify-between gap-2 mb-3">
        {SENSACIONES.map(({ value, labelKey, Icon }) => {
          const active = sensacion === value;
          const label = t(`sensaciones.${labelKey}`);
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
        placeholder={t("placeholder")}
        rows={4}
        maxLength={2000}
        className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20"
      />
      <div className="flex items-center justify-between mt-1">
        <p className="text-[11px] text-muted-foreground">
          {t("nutricionistaLeera")}
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          {notas.length}/2000
        </p>
      </div>
    </section>
  );
}
