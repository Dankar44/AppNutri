"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Scale, Users } from "lucide-react";

interface Props {
  pesoTotal: number;
  pesoPorPorcion: number;
  porciones: number;
}

export function RecetaPesoBadges({ pesoTotal, pesoPorPorcion, porciones }: Props) {
  const searchParams = useSearchParams();
  const urlPorcionesRaw = searchParams.get("porciones");
  const urlPorcionesNum = urlPorcionesRaw ? Number(urlPorcionesRaw) : NaN;
  const displayPorciones = Number.isFinite(urlPorcionesNum) && urlPorcionesNum > 0 ? urlPorcionesNum : porciones;
  const factor = displayPorciones / (porciones || 1);
  const displayPesoTotal = Math.round(pesoTotal * factor);

  return (
    <div className="inline-flex items-center gap-0 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
          <Scale className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium leading-tight">
            Peso total
          </p>
          <p className="text-base font-bold tabular-nums leading-tight">
            {displayPesoTotal} g
          </p>
        </div>
      </div>
      <div className="w-px bg-primary/20 self-stretch" />
      <div className="flex items-center gap-2.5 px-3 py-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wide text-muted-foreground font-medium leading-tight">
            Por porción
          </p>
          <p className="text-base font-bold tabular-nums leading-tight">
            {Math.round(pesoPorPorcion)} g
            <span className="text-xs text-muted-foreground font-normal ml-1">
              × {displayPorciones}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
