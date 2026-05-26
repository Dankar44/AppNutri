"use client";

import { useTranslations } from "next-intl";
import { Package } from "lucide-react";

export function StockSection({
  stock,
  precioUnitario,
  stockMinimo,
  onChange,
}: {
  stock: number | null;
  precioUnitario: number | null;
  stockMinimo: number | null;
  onChange: (field: "stock" | "precioUnitario" | "stockMinimo", value: number | null) => void;
}) {
  const t = useTranslations("foods");

  function handleNumber(field: "stock" | "precioUnitario" | "stockMinimo", val: string) {
    if (val === "") {
      onChange(field, null);
      return;
    }
    const num = field === "precioUnitario" ? parseFloat(val) : parseInt(val, 10);
    if (!isNaN(num) && num >= 0) onChange(field, num);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Package className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">{t("stock.title")}</span>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">{t("stock.description")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("stock.cantidadLabel")}</label>
          <input
            type="number"
            min={0}
            step={1}
            value={stock ?? ""}
            onChange={(e) => handleNumber("stock", e.target.value)}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("stock.precioLabel")}</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={precioUnitario ?? ""}
            onChange={(e) => handleNumber("precioUnitario", e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("stock.minimoLabel")}</label>
          <input
            type="number"
            min={0}
            step={1}
            value={stockMinimo ?? ""}
            onChange={(e) => handleNumber("stockMinimo", e.target.value)}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-[11px] text-muted-foreground mt-1">{t("stock.minimoHint")}</p>
        </div>
      </div>
    </div>
  );
}
