"use client";

import Link from "next/link";
import { ArrowRight, Trophy, TrendingDown, Heart, Flame } from "lucide-react";
import { useTranslations } from "next-intl";

const ICON_MAP = {
  TrendingDown,
  Trophy,
  Heart,
  Flame,
} as const;

export type HitoIconName = keyof typeof ICON_MAP;

interface Props {
  titulo: string;
  descripcion: string;
  fecha: string;
  iconName: HitoIconName;
  color: string;
  className?: string;
}

export function HitoRecienteCard({ titulo, descripcion, fecha, iconName, color, className = "" }: Props) {
  const Icon = ICON_MAP[iconName];
  const t = useTranslations("patient-portal.dashboard.hitoRecienteCard");
  return (
    <Link
      href="/paciente/portal/evolucion"
      className={`flex flex-col rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all relative overflow-hidden ${className}`}
    >
      <Trophy
        className="absolute -bottom-3 -right-3 w-24 h-24 opacity-5"
        strokeWidth={1}
      />
      <header className="flex items-center gap-3 mb-3 relative">
        <span
          className="inline-flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <Icon className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {t("label")}
          </p>
          <h2 className="text-base font-semibold truncate">{titulo}</h2>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </header>
      <p className="text-xs text-muted-foreground relative">{descripcion}</p>
      <p className="text-[11px] text-muted-foreground/80 mt-2 tabular-nums relative">
        {t("conseguidoEl", { fecha })}
      </p>
    </Link>
  );
}
