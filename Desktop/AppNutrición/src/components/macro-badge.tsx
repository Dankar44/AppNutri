"use client";

import { cn } from "@/lib/utils";

interface MacroBadgeProps {
  label: string;
  value: number;
  unit?: string;
  color: "cal" | "prot" | "carb" | "gras" | "fibra";
  size?: "sm" | "md";
}

const colorMap = {
  cal: "bg-purple-50 text-purple-600 border-purple-200",
  prot: "bg-blue-50 text-blue-600 border-blue-200",
  carb: "bg-orange-50 text-orange-700 border-orange-200",
  gras: "bg-yellow-50 text-yellow-700 border-yellow-200",
  fibra: "bg-emerald-50 text-emerald-600 border-emerald-200",
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
  return (
    <div className="flex flex-wrap gap-1.5">
      <MacroBadge label="Cal" value={calorias} color="cal" size={size} />
      <MacroBadge label="Prot" value={proteinas} color="prot" size={size} />
      <MacroBadge label="Carb" value={carbohidratos} color="carb" size={size} />
      <MacroBadge label="Gras" value={grasas} color="gras" size={size} />
      {fibra !== undefined && fibra > 0 && (
        <MacroBadge label="Fibra" value={fibra} color="fibra" size={size} />
      )}
    </div>
  );
}
