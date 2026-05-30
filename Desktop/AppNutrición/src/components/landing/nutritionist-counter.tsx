"use client";

import { useEffect, useRef, useState } from "react";

const TARGET = 500;
const DURATION = 2200; // ms

export function NutritionistCounter() {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        observer.disconnect();

        if (prefersReduced) {
          setValue(TARGET);
          return;
        }

        let start = 0;
        const tick = (ts: number) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / DURATION, 1);
          // ease-out quint: arranca muy rápido y se va frenando al acercarse al final
          const eased = 1 - Math.pow(1 - p, 5);
          setValue(Math.round(eased * TARGET));
          if (p < 1) requestAnimationFrame(tick);
          else setValue(TARGET);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="text-center">
      <p className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
        Ya somos más de
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 leading-none">
        <span className="bg-[#9bc4a8] dark:bg-[#2a5e3a] text-white dark:text-green-100 px-3 -mx-1 text-6xl sm:text-7xl lg:text-8xl font-black tabular-nums tracking-tight">
          {value.toLocaleString("es-ES")}+
        </span>
        <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-gray-100">
          nutricionistas
        </span>
      </div>
      <p className="mt-6 max-w-2xl mx-auto text-gray-700 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
        Profesionales de España, Portugal, Estados Unidos y toda Latinoamérica ya
        confían en Annonia.
      </p>
    </div>
  );
}
