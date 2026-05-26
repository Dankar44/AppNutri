"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Package, Plus, Minus, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { registrarMovimientoStock } from "@/app/actions/stock";
import { StockBadge } from "./stock-badge";

export function StockInfoCard({
  alimentoId,
  stock,
  precioUnitario,
  stockMinimo,
}: {
  alimentoId: string;
  stock: number | null;
  precioUnitario: number | null;
  stockMinimo: number | null;
}) {
  const t = useTranslations("foods");
  const [showModal, setShowModal] = useState(false);
  const [currentStock, setCurrentStock] = useState(stock);

  if (stock === null && precioUnitario === null) return null;

  const valor = currentStock !== null && precioUnitario !== null
    ? (currentStock * precioUnitario).toFixed(2)
    : null;

  return (
    <>
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">{t("stock.title")}</span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t("stock.ajustar")}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <p className="text-[11px] text-muted-foreground">{t("stock.cantidadLabel")}</p>
            <div className="mt-0.5">
              <StockBadge stock={currentStock} stockMinimo={stockMinimo} />
            </div>
          </div>
          {precioUnitario !== null && (
            <div>
              <p className="text-[11px] text-muted-foreground">{t("stock.precioLabel")}</p>
              <p className="text-sm font-medium mt-0.5">{precioUnitario.toFixed(2)} €</p>
            </div>
          )}
          {stockMinimo !== null && (
            <div>
              <p className="text-[11px] text-muted-foreground">{t("stock.minimoLabel")}</p>
              <p className="text-sm font-medium mt-0.5">{stockMinimo}</p>
            </div>
          )}
          {valor !== null && (
            <div>
              <p className="text-[11px] text-muted-foreground">{t("stock.valorTotal")}</p>
              <p className="text-sm font-medium mt-0.5">{valor} €</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <StockMovimientoModal
          alimentoId={alimentoId}
          stockActual={currentStock ?? 0}
          onClose={() => setShowModal(false)}
          onUpdated={(nuevoStock) => {
            setCurrentStock(nuevoStock);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

function StockMovimientoModal({
  alimentoId,
  stockActual,
  onClose,
  onUpdated,
}: {
  alimentoId: string;
  stockActual: number;
  onClose: () => void;
  onUpdated: (nuevoStock: number) => void;
}) {
  const t = useTranslations("foods");
  const [tipo, setTipo] = useState<"ESTABLECER" | "INCREMENTAR" | "DECREMENTAR">("INCREMENTAR");
  const [cantidad, setCantidad] = useState<number>(1);
  const [nota, setNota] = useState("");
  const [isPending, startTransition] = useTransition();

  const tabs = [
    { id: "INCREMENTAR" as const, label: t("stock.anadir"), icon: Plus },
    { id: "DECREMENTAR" as const, label: t("stock.retirar"), icon: Minus },
    { id: "ESTABLECER" as const, label: t("stock.establecer"), icon: RotateCcw },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await registrarMovimientoStock(alimentoId, { tipo, cantidad, nota: nota || undefined });
      if (res.ok && res.stockNuevo !== undefined) {
        toast.success(t("stock.stockActualizado"));
        onUpdated(res.stockNuevo);
      } else {
        toast.error(res.error || t("stock.errorActualizar"));
      }
    });
  }

  const preview = tipo === "ESTABLECER"
    ? cantidad
    : tipo === "INCREMENTAR"
      ? stockActual + cantidad
      : Math.max(0, stockActual - cantidad);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border p-5 max-w-sm w-full shadow-xl">
        <h3 className="text-sm font-semibold mb-4">{t("stock.ajustarStock")}</h3>

        <div className="flex gap-1 p-1 rounded-lg bg-muted mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTipo(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-colors",
                  tipo === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground">{t("stock.cantidadLabel")}</label>
              <input
                type="number"
                min={0}
                step={1}
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="text-center pt-4">
              <p className="text-[11px] text-muted-foreground">{t("stock.resultado")}</p>
              <p className="text-lg font-bold">{preview}</p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("stock.notaLabel")}</label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder={t("stock.notaPlaceholder")}
              maxLength={500}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors"
            >
              {t("stock.cancelar")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("stock.confirmar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
