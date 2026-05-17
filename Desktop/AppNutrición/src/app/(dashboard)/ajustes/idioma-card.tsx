"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "@/components/locale-provider";
import { useLocale as useNextIntlLocale } from "next-intl";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";
import { ChevronDown, Check } from "lucide-react";

const LOCALE_META: Record<Locale, { flag: string; label: string }> = {
  es: { flag: "\u{1F1EA}\u{1F1F8}", label: "Español" },
  pt: { flag: "\u{1F1E7}\u{1F1F7}", label: "Português" },
};

export function IdiomaCard() {
  const intlLocale = useNextIntlLocale() as Locale;
  const { setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALE_META[intlLocale];

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function select(l: Locale) {
    setLocale(l);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative w-full sm:w-72">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-border bg-background text-left transition-colors hover:bg-muted/50",
          open && "ring-2 ring-primary/20 border-primary",
        )}
      >
        <span className="text-xl leading-none">{current.flag}</span>
        <span className="text-sm font-medium flex-1">{current.label}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-gray-900 border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {locales.map((l) => {
            const meta = LOCALE_META[l];
            const active = l === intlLocale;
            return (
              <button
                key={l}
                type="button"
                onClick={() => select(l)}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 text-left text-sm transition-colors",
                  active
                    ? "bg-primary/5 text-primary font-medium"
                    : "text-foreground hover:bg-muted/50",
                )}
              >
                <span className="text-xl leading-none">{meta.flag}</span>
                <span className="flex-1">{meta.label}</span>
                {active && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
