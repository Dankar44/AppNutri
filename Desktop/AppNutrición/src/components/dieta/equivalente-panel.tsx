"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, ArrowUp, ArrowDown, Minus, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { buscarEquivalentes } from "@/app/actions/alimentos";

interface EquivalentePanelProps {
  alimentoId: string;
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  cantidad: number;
  onSelect: (alimentoId: string, nombre: string, cantidad: number) => void;
  onClose: () => void;
}

interface Equivalente {
  id: string;
  nombre: string;
  cantidadG: number;
  cal: number;
  gras: number;
  carb: number;
  prot: number;
  diffCal: number;
  diffGras: number;
  diffCarb: number;
  diffProt: number;
}

const PAGE_SIZE = 6;

function DiffIndicator({ value }: { value: number }) {
  const rounded = Math.round(value);
  if (Math.abs(rounded) < 1) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-primary font-medium bg-primary/10 rounded-full px-1.5 py-0.5">
        <Minus className="w-2.5 h-2.5" />
      </span>
    );
  }
  const isUp = rounded > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium rounded-full px-1.5 py-0.5 ${
      isUp ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10" : "text-primary bg-primary/10"
    }`}>
      {isUp ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
      {Math.abs(rounded)}
    </span>
  );
}

export function EquivalentePanel({
  alimentoId,
  nombre,
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  cantidad,
  onSelect,
  onClose,
}: EquivalentePanelProps) {
  const [busqueda, setBusqueda] = useState("");
  const [allResults, setAllResults] = useState<Equivalente[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const calRef = (calorias * cantidad) / 100;
  const protRef = (proteinas * cantidad) / 100;
  const carbRef = (carbohidratos * cantidad) / 100;
  const grasRef = (grasas * cantidad) / 100;

  const loadData = useCallback(async () => {
    setLoading(true);
    setPage(0);
    const res = await buscarEquivalentes(alimentoId, calRef, busqueda || undefined);
    const equivalentes: Equivalente[] = (res as any[]).map((r) => {
      const cantG = r.calorias > 0 ? Math.round((calRef / r.calorias) * 100) : 100;
      const factor = cantG / 100;
      return {
        id: r.id,
        nombre: r.nombre,
        cantidadG: cantG,
        cal: Math.round(r.calorias * factor),
        gras: Math.round(r.grasas * factor * 10) / 10,
        carb: Math.round(r.carbohidratos * factor * 10) / 10,
        prot: Math.round(r.proteinas * factor * 10) / 10,
        diffCal: Math.round(r.calorias * factor - calRef),
        diffGras: Math.round((r.grasas * factor - grasRef) * 10) / 10,
        diffCarb: Math.round((r.carbohidratos * factor - carbRef) * 10) / 10,
        diffProt: Math.round((r.proteinas * factor - protRef) * 10) / 10,
      };
    });
    setAllResults(equivalentes);
    setLoading(false);
  }, [alimentoId, calRef, protRef, carbRef, grasRef, busqueda]);

  useEffect(() => {
    const timer = setTimeout(loadData, 300);
    return () => clearTimeout(timer);
  }, [loadData]);

  const totalPages = Math.ceil(allResults.length / PAGE_SIZE);
  const visible = allResults.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="border border-primary/20 rounded-xl bg-card shadow-lg overflow-hidden my-2">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-primary/10">
        <h4 className="text-sm font-semibold">Añadir nuevo alimento equivalente</h4>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar alimento"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            maxLength={100}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
      </div>

      {/* Reference info + column headers */}
      <div className="px-4 pt-3 pb-2 border-b border-border/50 bg-muted/10">
        <p className="text-xs text-primary font-medium mb-2">
          Cálculo de equivalentes según el alimento de referencia:
        </p>
        <div className="grid grid-cols-[1fr_75px_60px_60px_60px_36px] gap-1 text-[10px] font-semibold text-muted-foreground">
          <span>Alimento</span>
          <span className="text-center bg-primary/10 text-primary rounded px-1 py-0.5">Energía</span>
          <span className="text-center">Grasa</span>
          <span className="text-center">H. Carb.</span>
          <span className="text-center">Proteína</span>
          <span></span>
        </div>
      </div>

      {/* Reference row */}
      <div className="grid grid-cols-[1fr_75px_60px_60px_60px_36px] gap-1 items-center px-4 py-2 bg-primary/5 border-b border-primary/10 text-xs">
        <div className="min-w-0">
          <p className="font-semibold truncate text-primary">{nombre}</p>
          <p className="text-[10px] text-muted-foreground">{cantidad}g · referencia</p>
        </div>
        <p className="text-center font-bold tabular-nums">{Math.round(calRef)} kcal</p>
        <p className="text-center tabular-nums">{Math.round(grasRef)} g</p>
        <p className="text-center tabular-nums">{Math.round(carbRef)} g</p>
        <p className="text-center tabular-nums">{Math.round(protRef)} g</p>
        <span></span>
      </div>

      {/* Results */}
      <div className="divide-y divide-border/40">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">Buscando equivalentes...</div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No se encontraron equivalentes</div>
        ) : (
          visible.map((eq) => (
            <div
              key={eq.id}
              className="grid grid-cols-[1fr_75px_60px_60px_60px_36px] gap-1 items-center px-4 py-2.5 hover:bg-muted/30 transition-colors text-xs"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{eq.nombre}</p>
                <p className="text-[10px] text-muted-foreground">{eq.cantidadG}g</p>
              </div>
              <div className="text-center space-y-0.5">
                <p className="font-bold tabular-nums">{eq.cal} kcal</p>
                <DiffIndicator value={eq.diffCal} />
              </div>
              <div className="text-center space-y-0.5">
                <p className="tabular-nums font-medium">{Math.round(eq.gras)} g</p>
                <DiffIndicator value={eq.diffGras} />
              </div>
              <div className="text-center space-y-0.5">
                <p className="tabular-nums font-medium">{Math.round(eq.carb)} g</p>
                <DiffIndicator value={eq.diffCarb} />
              </div>
              <div className="text-center space-y-0.5">
                <p className="tabular-nums font-medium">{Math.round(eq.prot)} g</p>
                <DiffIndicator value={eq.diffProt} />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => onSelect(eq.id, eq.nombre, eq.cantidadG)}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  title="Usar este equivalente"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-1 px-4 py-2.5 border-t border-border/50 bg-muted/10">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = totalPages <= 5 ? i : Math.min(Math.max(page - 2, 0), totalPages - 5) + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                  p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                }`}
              >
                {p + 1}
              </button>
            );
          })}
          {totalPages > 5 && <span className="text-xs text-muted-foreground px-1">...</span>}
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
