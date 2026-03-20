"use client";

import { cn } from "@/lib/utils";

interface MacroBarraProps {
  label: string;
  actual: number;
  objetivo: number;
  color: string;
  unit?: string;
}

export function MacroBarra({
  label,
  actual,
  objetivo,
  color,
  unit = "g",
}: MacroBarraProps) {
  const pct = objetivo > 0 ? Math.min((actual / objetivo) * 100, 120) : 0;
  const isOver = actual > objetivo && objetivo > 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-medium", isOver && "text-red-500")}>
          {Math.round(actual)}/{Math.round(objetivo)}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isOver ? "bg-red-500" : color
          )}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
