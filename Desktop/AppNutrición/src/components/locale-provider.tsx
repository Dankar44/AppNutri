"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/i18n/config";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
};

const STORAGE_KEY = "annonia-locale";

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initial,
  children,
}: {
  initial: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initial);
  const localeRef = useRef<Locale>(initial);
  const router = useRouter();

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, initial);
    } catch {}
  }, [initial]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      const next = e.newValue as Locale;
      if (next !== localeRef.current) {
        setLocaleState(next);
        localeRef.current = next;
        router.refresh();
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [router]);

  const abortRef = useRef<AbortController | null>(null);

  const setLocale = useCallback(
    async (l: Locale) => {
      setLocaleState(l);
      localeRef.current = l;
      try {
        window.localStorage.setItem(STORAGE_KEY, l);
      } catch {}
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await fetch("/api/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: l }),
          signal: controller.signal,
        });
        if (!controller.signal.aborted) router.refresh();
      } catch {
        // aborted or network error — ignore
      }
    },
    [router],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return { locale: "es", setLocale: () => {} };
  }
  return ctx;
}
