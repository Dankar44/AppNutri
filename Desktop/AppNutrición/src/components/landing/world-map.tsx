"use client";

import { useMemo, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Feature, Geometry } from "geojson";
import worldData from "world-atlas/countries-110m.json";
import { cn } from "@/lib/utils";

const W = 900;
const H = 480;

// Países donde tenemos presencia.
// nombre en el dataset (world-atlas) -> { es: nombre visible, w: intensidad 1-4 }
const PAISES: Record<string, { es: string; w: 1 | 2 | 3 | 4 }> = {
  Spain: { es: "España", w: 4 },
  Portugal: { es: "Portugal", w: 3 },
  "United States of America": { es: "Estados Unidos", w: 4 },
  Mexico: { es: "México", w: 4 },
  Argentina: { es: "Argentina", w: 4 },
  Colombia: { es: "Colombia", w: 3 },
  Chile: { es: "Chile", w: 3 },
  Peru: { es: "Perú", w: 3 },
  Ecuador: { es: "Ecuador", w: 2 },
  Brazil: { es: "Brasil", w: 2 },
  Uruguay: { es: "Uruguay", w: 2 },
  Venezuela: { es: "Venezuela", w: 2 },
  Bolivia: { es: "Bolivia", w: 1 },
  Paraguay: { es: "Paraguay", w: 1 },
  Guatemala: { es: "Guatemala", w: 1 },
  "Costa Rica": { es: "Costa Rica", w: 1 },
  Panama: { es: "Panamá", w: 1 },
  "Dominican Rep.": { es: "Rep. Dominicana", w: 1 },
  Honduras: { es: "Honduras", w: 1 },
  Nicaragua: { es: "Nicaragua", w: 1 },
  "El Salvador": { es: "El Salvador", w: 1 },
  Cuba: { es: "Cuba", w: 1 },
  "Puerto Rico": { es: "Puerto Rico", w: 1 },
};

// Escala de intensidad (claro -> oscuro). Verde de marca.
const FILL: Record<1 | 2 | 3 | 4, string> = {
  1: "fill-[#a7cdb4] dark:fill-[#2f6f47]",
  2: "fill-[#7bb38e] dark:fill-[#3f9c63]",
  3: "fill-[#4c9468] dark:fill-[#54c47e]",
  4: "fill-[#236b3f] dark:fill-[#74e8a0]",
};

type Pais = (typeof PAISES)[keyof typeof PAISES];

interface PaisRender {
  name: string;
  d: string;
  cx: number;
  cy: number;
  pais: Pais | null;
}

export function WorldMap() {
  const [hover, setHover] = useState<string | null>(null);

  const paises = useMemo<PaisRender[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topo = worldData as any;
    const fc = feature(topo, topo.objects.countries) as unknown as {
      features: Feature<Geometry, { name: string }>[];
    };
    const feats = fc.features.filter((f) => f.properties.name !== "Antarctica");

    const projection = geoNaturalEarth1().fitExtent(
      [
        [12, 12],
        [W - 12, H - 12],
      ],
      { type: "FeatureCollection", features: feats }
    );
    const pathGen = geoPath(projection);

    return feats.map((f) => {
      const [cx, cy] = pathGen.centroid(f);
      return {
        name: f.properties.name,
        d: pathGen(f) ?? "",
        cx,
        cy,
        pais: PAISES[f.properties.name] ?? null,
      };
    });
  }, []);

  // El país con hover se pinta el último para que quede por encima de sus vecinos.
  const ordered = hover
    ? [...paises.filter((p) => p.name !== hover), ...paises.filter((p) => p.name === hover)]
    : paises;

  const activo = hover ? paises.find((p) => p.name === hover) ?? null : null;

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full overflow-visible"
        role="img"
        aria-label="Mapa de los países donde Annonia tiene presencia"
      >
        {/* Capa de fondo: un clic en el océano cierra el país expandido */}
        <rect
          x={0}
          y={0}
          width={W}
          height={H}
          fill="transparent"
          onClick={() => setHover(null)}
        />

        {ordered.map((p) => {
          const isHover = p.pais !== null && p.name === hover;
          return (
            <path
              key={p.name}
              d={p.d}
              strokeWidth={isHover ? 0.9 : 0.6}
              className={cn(
                "stroke-[#bdd9c5] dark:stroke-[#1a3a24]",
                p.pais ? FILL[p.pais.w] : "fill-white/85 dark:fill-white/[0.07]",
                isHover && "!stroke-white dark:!stroke-green-50"
              )}
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                transform: isHover ? "scale(1.14)" : "scale(1)",
                transition: "transform 200ms ease-out, fill 300ms ease",
                cursor: p.pais ? "pointer" : "default",
                filter: isHover ? "drop-shadow(0 2px 6px rgba(0,0,0,0.35))" : undefined,
              }}
              onMouseEnter={p.pais ? () => setHover(p.name) : undefined}
              onMouseLeave={p.pais ? () => setHover(null) : undefined}
              onClick={p.pais ? () => setHover((h) => (h === p.name ? null : p.name)) : undefined}
            />
          );
        })}
      </svg>

      {/* Tooltip con el nombre del país */}
      {activo && activo.pais && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[140%] whitespace-nowrap rounded-lg bg-green-900 px-3 py-1.5 text-sm font-semibold text-white shadow-lg dark:bg-green-50 dark:text-green-950"
          style={{ left: `${(activo.cx / W) * 100}%`, top: `${(activo.cy / H) * 100}%` }}
        >
          {activo.pais.es}
          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 h-2 w-2 rotate-45 bg-green-900 dark:bg-green-50" />
        </div>
      )}
    </div>
  );
}
