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

export type Theme = "light" | "dark";

type SetThemeOptions = {
  /** Punto de origen para la animación de revelado (click del usuario). */
  origin?: { x: number; y: number };
};

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme, opts?: SetThemeOptions) => void;
  toggleTheme: (opts?: SetThemeOptions) => void;
};

const STORAGE_KEY = "annonia-theme";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.style.colorScheme = t;
  const color = t === "dark" ? "#101117" : "#fafafa";
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // El script inline en <head> aplicó la clase antes de la hidratación.
  // Aquí sincronizamos el estado de React con el DOM real.
  const [theme, setThemeState] = useState<Theme>("light");
  const themeRef = useRef<Theme>("light");

  useEffect(() => {
    const initial = readStoredTheme();
    setThemeState(initial);
    themeRef.current = initial;
    applyTheme(initial);

    const observer = new MutationObserver(() => {
      const expected = themeRef.current === "dark" ? "#101117" : "#fafafa";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta && meta.getAttribute("content") !== expected) {
        meta.setAttribute("content", expected);
      }
    });
    observer.observe(document.head, { childList: true, subtree: true, attributes: true, attributeFilter: ["content"] });
    return () => observer.disconnect();
  }, []);

  // Cross-tab sync
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      const next: Theme = e.newValue === "dark" ? "dark" : "light";
      setThemeState(next);
      themeRef.current = next;
      applyTheme(next);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = useCallback((t: Theme, opts?: SetThemeOptions) => {
    const apply = () => {
      setThemeState(t);
      themeRef.current = t;
      try {
        window.localStorage.setItem(STORAGE_KEY, t);
      } catch {
        // ignore
      }
      applyTheme(t);
    };

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      apply();
      return;
    }

    const root = document.documentElement;

    // Coordenadas del origen del cambio → centro del viewport por defecto.
    const x = opts?.origin?.x ?? window.innerWidth / 2;
    const y = opts?.origin?.y ?? window.innerHeight / 2;
    // Radio máximo: esquina más lejana del viewport desde (x, y).
    const maxR = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    root.style.setProperty("--vt-x", `${x}px`);
    root.style.setProperty("--vt-y", `${y}px`);
    root.style.setProperty("--vt-r", `${maxR}px`);

    // 1. Preferimos la View Transitions API (un único crossfade uniforme).
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(apply);
      return;
    }

    // 2. Fallback: activamos transiciones CSS solo durante 240ms, luego las quitamos.
    root.classList.add("theme-transitioning");
    apply();
    window.setTimeout(() => {
      root.classList.remove("theme-transitioning");
    }, 260);
  }, []);

  const toggleTheme = useCallback(
    (opts?: SetThemeOptions) => {
      setTheme(theme === "dark" ? "light" : "dark", opts);
    },
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback seguro para cuando se usa fuera de provider (SSR, algún componente aislado).
    return {
      theme: "light",
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
