"use client";

import { cn } from "@/lib/utils";

interface MacroBarraProps {
  label: string;
  actual: number;
  objetivo: number;
  color: string;
  trackColor?: string;
  unit?: string;
  icon?: string;
}

export function MacroBarra({
  label,
  actual,
  objetivo,
  color,
  trackColor = "bg-muted",
  unit = "g",
  icon,
}: MacroBarraProps) {
  const pct = objetivo > 0 ? Math.min((actual / objetivo) * 100, 120) : 0;
  const isOver = actual > objetivo && objetivo > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground flex items-center gap-1.5">
          {icon && <span className="text-sm">{icon}</span>}
          {label}
        </span>
        <span className={cn("font-medium tabular-nums", isOver && "text-red-500")}>
          {actual.toFixed(1)} / {Math.round(objetivo)} {unit}
        </span>
      </div>
      <div className={cn("h-2 rounded-full overflow-hidden", trackColor)}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isOver ? "bg-red-500" : color
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
