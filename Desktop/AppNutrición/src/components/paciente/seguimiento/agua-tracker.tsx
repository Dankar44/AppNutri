"use client";

import { useEffect, useState } from "react";
import { Droplets, Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatMlCorto } from "@/lib/seguimiento";

interface Props {
  aguaML: number;
  objetivo: number;
  onChange: (ml: number) => void;
}

const QUICK_ADD = [
  { ml: 250, label: "250ml" },
  { ml: 500, label: "500ml" },
  { ml: 1000, label: "1L" },
];

export function AguaTracker({ aguaML, objetivo, onChange }: Props) {
  const t = useTranslations("patient-portal.seguimiento.aguaTracker");
  const pct = Math.min(100, Math.round((aguaML / objetivo) * 100));
  const superado = aguaML >= objetivo;
  const [ripple, setRipple] = useState(0);

  useEffect(() => {
    if (aguaML > 0) setRipple((r) => r + 1);
  }, [aguaML]);

  function add(ml: number) {
    const next = Math.max(0, Math.min(10000, aguaML + ml));
    onChange(next);
    if (ml > 0 && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(15);
      } catch {}
    }
  }

  return (
    <section
      aria-label={t("title")}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5"
    >
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground">
            <Droplets className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <h2 className="text-base font-semibold">{t("title")}</h2>
        </div>
        {superado && (
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 animate-in fade-in slide-in-from-top-1">
            {t("objetivoAlcanzado")}
          </span>
        )}
      </header>

      <div className="flex items-center gap-5 mb-5">
        {/* Jarra SVG */}
        <div className="relative shrink-0" aria-hidden>
          <svg width="86" height="110" viewBox="0 0 86 110" className="drop-shadow-sm">
            <defs>
              <clipPath id="jar-clip">
                <path d="M14 14 L72 14 L76 28 L76 98 Q76 106 68 106 L18 106 Q10 106 10 98 L10 28 Z" />
              </clipPath>
              <linearGradient id="water-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <path
              d="M14 14 L72 14 L76 28 L76 98 Q76 106 68 106 L18 106 Q10 106 10 98 L10 28 Z"
              fill="none"
              className="stroke-blue-400/70 dark:stroke-blue-500/60"
              strokeWidth="2.5"
            />
            <g clipPath="url(#jar-clip)">
              <rect
                x="0"
                y={110 - (pct / 100) * 96}
                width="86"
                height={(pct / 100) * 96}
                fill="url(#water-grad)"
                className="transition-[y,height] duration-700 ease-out"
              />
              {/* Ondas */}
              <path
                key={ripple}
                d={`M0 ${110 - (pct / 100) * 96} Q21 ${
                  110 - (pct / 100) * 96 - 4
                } 43 ${110 - (pct / 100) * 96} T86 ${110 - (pct / 100) * 96} V110 H0 Z`}
                fill="#fff"
                fillOpacity="0.3"
                className="animate-pulse"
              />
            </g>
            <rect x="14" y="10" width="58" height="6" rx="2" className="fill-blue-400/70 dark:fill-blue-500/50" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 tabular-nums">
            {formatMlCorto(aguaML)}
          </p>
          <p className="text-sm text-blue-700/70 dark:text-blue-400/70">
            de {formatMlCorto(objetivo)}
          </p>
          <div className="mt-2 h-2 rounded-full bg-blue-100 dark:bg-blue-500/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-blue-600 rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-blue-600/70 dark:text-blue-400/60 mt-1 tabular-nums">
            {pct}%
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => add(-250)}
          className="flex items-center gap-1 bg-white/70 dark:bg-blue-900/30 hover:bg-white dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-500/30 rounded-xl px-3 h-11 text-sm font-medium text-blue-700 dark:text-blue-300 transition-colors"
          aria-label={t("quitar250")}
        >
          <Minus className="w-3.5 h-3.5" />
          250ml
        </button>
        {QUICK_ADD.map((q) => (
          <button
            key={q.ml}
            onClick={() => add(q.ml)}
            className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 active:scale-[0.98] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 rounded-xl px-3 h-11 text-sm font-semibold transition-all"
            aria-label={t("anadir", { label: q.label })}
          >
            <Plus className="w-3.5 h-3.5" />
            {q.label}
          </button>
        ))}
      </div>
    </section>
  );
}
