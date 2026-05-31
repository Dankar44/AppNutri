"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const STEP_MS = 8000;

const HITOS = [
  {
    titulo: "Hola, soy Annonia",
    desc: "Nací con una idea sencilla: hacer que la nutrición personalizada esté al alcance de todos, no sólo de unos pocos.",
    image: "/images/landing/historia/historia-1.png",
  },
  {
    titulo: "Entrenada por nutricionistas",
    desc: "He crecido rodeada de nutricionistas colegiados que han compartido su experiencia para que cada recomendación tenga base profesional.",
    image: "/images/landing/historia/historia-2.png",
  },
  {
    titulo: "Impulsada por Claude",
    desc: "Claude nos ha acompañado durante todo el camino: nos ha dado ideas, nos ha ayudado a tomar decisiones y nos ha impulsado a llegar más lejos.",
    image: "/images/landing/historia/historia-3.png",
  },
  {
    titulo: "Todavía estamos creciendo",
    desc: "Seguimos entrenando cada día. Nuestro plan es escuchar al resto, recoger feedback y mejorar con cada conversación.",
    image: "/images/landing/historia/historia-4.png",
  },
  {
    titulo: "Hacia todo el mundo",
    desc: "Miramos al futuro con un objetivo claro: llegar a todas las personas. Una nutrición personalizada de verdad, sin fronteras.",
    image: "/images/landing/historia/historia-5.png",
  },
];

export function NuestraHistoria() {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Pausar el auto-avance cuando la sección no está visible.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.2,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Auto-avance cada STEP_MS (solo en vista). Se rearma al cambiar de paso.
  useEffect(() => {
    if (!inView) return;
    const id = setTimeout(() => setActive((a) => (a + 1) % HITOS.length), STEP_MS);
    return () => clearTimeout(id);
  }, [active, inView]);

  return (
    <div ref={ref}>
      {/* Encabezado */}
      <div className="text-center mb-12 sm:mb-16">
        <span className="inline-block text-green-800 dark:text-green-300 text-xs font-bold tracking-[0.18em] uppercase mb-4">
          Nuestra historia
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-[1.2] max-w-3xl mx-auto">
          Así nació{" "}
          <span className="bg-[#9bc4a8] dark:bg-[#2a5e3a] text-gray-900 dark:text-green-100 rounded-md px-1.5 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]">
            Annonia
          </span>{" "}
          y así seguimos creciendo cada día
        </h2>
      </div>

      {/* Grid: imagen + hitos */}
      <div className="grid lg:grid-cols-[1.55fr_1fr] gap-10 lg:gap-16 items-center">
        {/* Imagen apaisada (cambia con el paso activo) */}
        <div className="relative w-full aspect-[16/10] rounded-[20px] overflow-hidden bg-white dark:bg-[#17181e] shadow-[0_20px_50px_rgba(15,23,42,0.12)] lg:sticky lg:top-28">
          {HITOS.map((h, i) => (
            <Image
              key={i}
              src={h.image}
              alt={h.titulo}
              fill
              sizes="(max-width: 1024px) 90vw, 55vw"
              className={cn(
                "object-contain transition-[opacity,transform] duration-1000 ease-out",
                i === active ? "opacity-100 scale-100" : "opacity-0 scale-[1.025]"
              )}
            />
          ))}
        </div>

        {/* Lista de hitos */}
        <div className="flex flex-col gap-7 w-full max-w-[460px] mx-auto lg:mx-0">
          {HITOS.map((h, i) => {
            const on = i === active;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className="relative text-left pl-8 cursor-pointer"
              >
                {/* Track de fondo */}
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1.5 rounded-full bg-[#e9ebef] dark:bg-white/10" />
                {/* Relleno (solo en el activo) */}
                {on && (
                  <span
                    key={`${active}-${inView}`}
                    className={cn(
                      "absolute left-0 top-1.5 w-1.5 rounded-full bg-[#3f8556] dark:bg-green-400",
                      inView && "animate-[annoniaFill_8s_linear_forwards]"
                    )}
                    style={{ height: 0 }}
                  />
                )}
                <h3
                  className={cn(
                    "text-xl sm:text-2xl font-extrabold tracking-tight leading-tight transition-colors duration-700",
                    on ? "text-gray-900 dark:text-gray-100" : "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {h.titulo}
                </h3>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]",
                    on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden min-h-0">
                    <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed pt-2.5">
                      {h.desc}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Keyframe del relleno de la barra (coincide con STEP_MS) */}
      <style>{`@keyframes annoniaFill { from { height: 0 } to { height: calc(100% - 0.7rem) } }`}</style>
    </div>
  );
}
