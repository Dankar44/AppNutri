"use client";

import { useLocale } from "./locale-provider";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const LOCALE_META: Record<Locale, { flag: string; label: string; short: string }> = {
  es: { flag: "🇪🇸", label: "Español", short: "ES" },
  pt: { flag: "🇧🇷", label: "Português", short: "PT" },
};

type Props = {
  variant?: "compact" | "inline";
  dropDirection?: "up" | "down";
  className?: string;
};

export function LanguageSwitcher({ variant = "compact", dropDirection = "down", className }: Props) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALE_META[locale];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function select(l: Locale) {
    setLocale(l);
    setOpen(false);
  }

  if (variant === "inline") {
    return (
      <div ref={ref} className={cn("relative", className)}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm transition-colors"
        >
          <span className="text-base leading-none">{current.flag}</span>
          <span>{current.label}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className={cn(
            "absolute left-0 min-w-[160px] bg-white dark:bg-gray-900 border border-border rounded-xl shadow-lg overflow-hidden z-50",
            dropDirection === "up" ? "bottom-full mb-2" : "top-full mt-2",
          )}>
            {locales.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => select(l)}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 text-sm w-full transition-colors",
                  l === locale ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <span className="text-base">{LOCALE_META[l].flag}</span>
                <span>{LOCALE_META[l].label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-colors",
          "hover:bg-muted/80",
          className,
        )}
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span>{current.short}</span>
        <ChevronDown className={cn("w-3 h-3 opacity-50 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className={cn(
          "absolute right-0 min-w-[150px] bg-white dark:bg-gray-900 border border-border rounded-xl shadow-lg overflow-hidden z-50",
          dropDirection === "up" ? "bottom-full mb-2" : "top-full mt-2",
        )}>
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => select(l)}
              className={cn(
                "flex items-center gap-2.5 px-3.5 py-2.5 text-sm w-full transition-colors",
                l === locale ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span className="text-base">{LOCALE_META[l].flag}</span>
              <span>{LOCALE_META[l].label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
