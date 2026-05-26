"use client";

import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

export function StockBadge({
  stock,
  stockMinimo,
}: {
  stock: number | null;
  stockMinimo: number | null;
}) {
  if (stock === null) return null;

  const isBajo = stockMinimo !== null && stock <= stockMinimo;
  const isZero = stock === 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-medium",
        isZero
          ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
          : isBajo
            ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
      )}
    >
      <Package className="w-3 h-3" />
      {stock}
    </span>
  );
}
