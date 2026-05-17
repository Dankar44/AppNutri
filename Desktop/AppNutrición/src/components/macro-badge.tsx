"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface MacroBadgeProps {
  label: string;
  value: number;
  unit?: string;
  color: "cal" | "prot" | "carb" | "gras" | "fibra";
  size?: "sm" | "md";
}

const colorMap = {
  cal: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
  prot: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  carb: "bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
  gras: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30",
  fibra: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
};

export function MacroBadge({
  label,
  value,
  unit = "g",
  color,
  size = "sm",
}: MacroBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        colorMap[color],
        size === "sm" ? "px-2 py-0.5 text-[11px] sm:text-xs" : "px-3 py-1 text-sm"
      )}
    >
      <span className="font-semibold">{Math.round(value * 10) / 10}</span>
      <span className="opacity-70">
        {color === "cal" ? "kcal" : unit}
      </span>
    </span>
  );
}

export function MacroBadges({
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  fibra,
  size = "sm",
}: {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra?: number;
  size?: "sm" | "md";
}) {
  const t = useTranslations("common.macros");
  return (
    <div className="flex flex-wrap gap-1.5">
      <MacroBadge label={t("cal")} value={calorias} color="cal" size={size} />
      <MacroBadge label={t("prot")} value={proteinas} color="prot" size={size} />
      <MacroBadge label={t("carb")} value={carbohidratos} color="carb" size={size} />
      <MacroBadge label={t("gras")} value={grasas} color="gras" size={size} />
      {fibra !== undefined && fibra > 0 && (
        <MacroBadge label={t("fibra")} value={fibra} color="fibra" size={size} />
      )}
    </div>
  );
}
