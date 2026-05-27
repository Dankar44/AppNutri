"use client";

import { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Package, Search, AlertTriangle, Euro, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StockBadge } from "@/components/alimento/stock-badge";
import { getInventarioEmpresa, getResumenStockEmpresa, registrarMovimientoStock } from "@/app/actions/stock";
import { toast } from "sonner";

type AlimentoStock = NonNullable<Awaited<ReturnType<typeof getInventarioEmpresa>>>[number];
type Resumen = Awaited<ReturnType<typeof getResumenStockEmpresa>>;
type Filtro = "todos" | "stockBajo" | "sinStock";

export function InventarioTab() {
  const t = useTranslations("centro");
  const tFoods = useTranslations("foods");
  const [alimentos, setAlimentos] = useState<AlimentoStock[]>([]);
  const [resumen, setResumen] = useState<Resumen>(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [ajustandoId, setAjustandoId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [inv, res] = await Promise.all([getInventarioEmpresa(), getResumenStockEmpresa()]);
    setAlimentos(inv ?? []);
    setResumen(res);
    setLoading(false);
  }

  const filtrados = alimentos.filter((a) => {
    if (busqueda && !a.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (filtro === "sinStock") return a.stock === 0;
    if (filtro === "stockBajo") return a.stockMinimo !== null && a.stock !== null && a.stock <= a.stockMinimo && a.stock > 0;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (alimentos.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-medium">{t("inventario.vacio")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("inventario.vacioDesc")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen */}
      {resumen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ResumenCard
            label={t("inventario.resumen.totalProductos")}
            value={String(resumen.totalItems)}
            icon={Package}
            color="primary"
          />
          <ResumenCard
            label={t("inventario.resumen.stockBajo")}
            value={String(resumen.bajosStock)}
            icon={AlertTriangle}
            color={resumen.bajosStock > 0 ? "amber" : "green"}
          />
          <ResumenCard
            label={t("inventario.resumen.valorTotal")}
            value={`${resumen.valorTotal.toFixed(2)} €`}
            icon={Euro}
            color="primary"
          />
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={t("inventario.filtros.buscar")}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted shrink-0">
          {(["todos", "stockBajo", "sinStock"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                filtro === f
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(`inventario.filtros.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 font-medium text-muted-foreground">{t("inventario.tabla.nombre")}</th>
              <th className="pb-2 font-medium text-muted-foreground text-center">{t("inventario.tabla.stock")}</th>
              <th className="pb-2 font-medium text-muted-foreground text-center hidden sm:table-cell">{t("inventario.tabla.minimo")}</th>
              <th className="pb-2 font-medium text-muted-foreground text-right hidden sm:table-cell">{t("inventario.tabla.precio")}</th>
              <th className="pb-2 font-medium text-muted-foreground text-right hidden md:table-cell">{t("inventario.tabla.valor")}</th>
              <th className="pb-2 font-medium text-muted-foreground text-right">{t("inventario.tabla.acciones")}</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((a) => (
              <tr key={a.id} className="border-b border-border/50 last:border-0">
                <td className="py-3 pr-3">
                  <div>
                    <p className="font-medium truncate max-w-[200px]">{a.nombre}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {a.dietista ? `${a.dietista.nombre} ${a.dietista.apellidos ?? ""}`.trim() : "—"}
                    </p>
                  </div>
                </td>
                <td className="py-3 text-center">
                  <StockBadge stock={a.stock} stockMinimo={a.stockMinimo} />
                </td>
                <td className="py-3 text-center hidden sm:table-cell text-muted-foreground">
                  {a.stockMinimo ?? "—"}
                </td>
                <td className="py-3 text-right hidden sm:table-cell text-muted-foreground">
                  {a.precioUnitario !== null ? `${a.precioUnitario.toFixed(2)} €` : "—"}
                </td>
                <td className="py-3 text-right hidden md:table-cell font-medium">
                  {a.stock !== null && a.precioUnitario !== null
                    ? `${(a.stock * a.precioUnitario).toFixed(2)} €`
                    : "—"}
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => setAjustandoId(a.id)}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {t("inventario.ajustar")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtrados.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          {t("inventario.filtros.buscar")}
        </p>
      )}

      {/* Modal ajustar stock */}
      {ajustandoId && (
        <AjustarStockModal
          alimentoId={ajustandoId}
          stockActual={alimentos.find((a) => a.id === ajustandoId)?.stock ?? 0}
          onClose={() => setAjustandoId(null)}
          onUpdated={(id, nuevoStock) => {
            setAlimentos((prev) =>
              prev.map((a) => (a.id === id ? { ...a, stock: nuevoStock } : a)),
            );
            setAjustandoId(null);
            getResumenStockEmpresa().then(setResumen);
          }}
        />
      )}
    </div>
  );
}

function ResumenCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: "primary" | "amber" | "green";
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border">
      <div
        className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          color === "primary" && "bg-primary/10 text-primary",
          color === "amber" && "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
          color === "green" && "bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400",
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

function AjustarStockModal({
  alimentoId,
  stockActual,
  onClose,
  onUpdated,
}: {
  alimentoId: string;
  stockActual: number;
  onClose: () => void;
  onUpdated: (id: string, nuevoStock: number) => void;
}) {
  const t = useTranslations("foods");
  const [tipo, setTipo] = useState<"INCREMENTAR" | "DECREMENTAR" | "ESTABLECER">("INCREMENTAR");
  const [cantidad, setCantidad] = useState(1);
  const [nota, setNota] = useState("");
  const [isPending, startTransition] = useTransition();

  const preview =
    tipo === "ESTABLECER" ? cantidad : tipo === "INCREMENTAR" ? stockActual + cantidad : Math.max(0, stockActual - cantidad);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await registrarMovimientoStock(alimentoId, { tipo, cantidad, nota: nota || undefined });
      if (res.ok && res.stockNuevo !== undefined) {
        toast.success(t("stock.stockActualizado"));
        onUpdated(alimentoId, res.stockNuevo);
      } else {
        toast.error(res.error || t("stock.errorActualizar"));
      }
    });
  }

  const tabs = [
    { id: "INCREMENTAR" as const, label: t("stock.anadir") },
    { id: "DECREMENTAR" as const, label: t("stock.retirar") },
    { id: "ESTABLECER" as const, label: t("stock.establecer") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border p-5 max-w-sm w-full shadow-xl">
        <h3 className="text-sm font-semibold mb-4">{t("stock.ajustarStock")}</h3>

        <div className="flex gap-1 p-1 rounded-lg bg-muted mb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTipo(tab.id)}
              className={cn(
                "flex-1 py-1.5 rounded-md text-xs font-medium transition-colors text-center",
                tipo === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
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
