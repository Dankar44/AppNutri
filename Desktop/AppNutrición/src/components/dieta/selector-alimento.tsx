"use client";

import { useState, useEffect } from "react";
import { X, Search, Sparkles, CookingPot } from "lucide-react";
import { MacroBadges } from "@/components/macro-badge";
import { buscarAlimentosYRecetas } from "@/app/actions/recetas";
import { getSugerencias } from "@/app/actions/sugerencias";
import type { AlimentoSugerido } from "@/lib/ai/suggest-complement";

interface SelectorAlimentoProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: {
    alimentoId: string | null;
    recetaId: string | null;
    nombre: string;
    cantidad: number;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
  }) => void;
  comidaId?: string;
  macrosObjetivo?: { calorias: number; proteinas: number; carbohidratos: number; grasas: number };
}

interface AlimentoResult {
  id: string; nombre: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number; porcion: number;
}

interface RecetaResult {
  id: string; nombre: string; porciones: number;
  calorias: number; proteinas: number; carbohidratos: number; grasas: number;
  ingredientes: { alimento: { nombre: string }; cantidad: number }[];
}

export function SelectorAlimento({ open, onClose, onSelect, comidaId, macrosObjetivo }: SelectorAlimentoProps) {
  const [query, setQuery] = useState("");
  const [alimentos, setAlimentos] = useState<AlimentoResult[]>([]);
  const [recetas, setRecetas] = useState<RecetaResult[]>([]);
  const [sugerencias, setSugerencias] = useState<AlimentoSugerido[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);
  const debounceRef = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open && comidaId && macrosObjetivo) {
      setLoadingSugerencias(true);
      getSugerencias(comidaId, macrosObjetivo)
        .then(setSugerencias)
        .finally(() => setLoadingSugerencias(false));
    }
    if (!open) {
      setQuery("");
      setAlimentos([]);
      setRecetas([]);
      setSugerencias([]);
    }
  }, [open, comidaId, macrosObjetivo]);

  if (!open) return null;

  async function handleSearch(value: string) {
    setQuery(value);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    if (value.length < 2) {
      setAlimentos([]);
      setRecetas([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await buscarAlimentosYRecetas(value);
        setAlimentos(data.alimentos);
        setRecetas(data.recetas);
      } finally {
        setLoading(false);
      }
    }, 300);
    debounceRef[1](timeout);
  }

  function handleSelectAlimento(item: AlimentoResult) {
    onSelect({
      alimentoId: item.id,
      recetaId: null,
      nombre: item.nombre,
      cantidad: item.porcion,
      calorias: item.calorias,
      proteinas: item.proteinas,
      carbohidratos: item.carbohidratos,
      grasas: item.grasas,
    });
    setQuery("");
    setAlimentos([]);
    setRecetas([]);
    onClose();
  }

  function handleSelectReceta(item: RecetaResult) {
    onSelect({
      alimentoId: null,
      recetaId: item.id,
      nombre: item.nombre,
      cantidad: 1,
      calorias: item.calorias,
      proteinas: item.proteinas,
      carbohidratos: item.carbohidratos,
      grasas: item.grasas,
    });
    setQuery("");
    setAlimentos([]);
    setRecetas([]);
    onClose();
  }

  const hasResults = alimentos.length > 0 || recetas.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-card rounded-t-xl sm:rounded-xl border border-border shadow-xl w-full sm:max-w-lg max-h-[90dvh] sm:max-h-[80vh] flex flex-col pb-safe sm:pb-0">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold">Añadir alimento o receta</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 hover:bg-muted rounded transition-colors min-h-11 min-w-11 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar alimento o receta..."
              autoFocus
              maxLength={100}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Sugerencias */}
          {query.length < 2 && sugerencias.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">Sugerencias para equilibrar macros</span>
              </div>
              <div className="space-y-1">
                {sugerencias.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectAlimento(s)}
                    className="w-full text-left p-3 rounded-lg hover:bg-amber-50 transition-colors border border-amber-100"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{s.nombre}</p>
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium">
                        {s.razon}
                      </span>
                    </div>
                    <div className="mt-1">
                      <MacroBadges calorias={s.calorias} proteinas={s.proteinas} carbohidratos={s.carbohidratos} grasas={s.grasas} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {loadingSugerencias && query.length < 2 && (
            <p className="text-xs text-muted-foreground text-center py-2">Calculando sugerencias...</p>
          )}

          {loading && (
            <p className="text-sm text-muted-foreground text-center py-4">Buscando...</p>
          )}

          {!loading && !hasResults && query.length >= 2 && (
            <p className="text-sm text-muted-foreground text-center py-4">No se encontraron resultados</p>
          )}

          {/* Recetas (primero, destacadas) */}
          {recetas.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <CookingPot className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-semibold text-purple-700">Recetas</span>
              </div>
              <div className="space-y-1">
                {recetas.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectReceta(r)}
                    className="w-full text-left p-3 rounded-lg hover:bg-purple-50 transition-colors border border-purple-200 bg-purple-50/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CookingPot className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <p className="text-sm font-medium text-purple-900">{r.nombre}</p>
                      </div>
                      <span className="text-[10px] text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full font-medium">
                        {r.porciones} porc.
                      </span>
                    </div>
                    <div className="mt-1">
                      <MacroBadges calorias={r.calorias} proteinas={r.proteinas} carbohidratos={r.carbohidratos} grasas={r.grasas} />
                    </div>
                    {r.ingredientes.length > 0 && (
                      <p className="mt-1.5 text-[10px] text-purple-600">
                        Ingredientes: {r.ingredientes.map((i) => `${i.alimento.nombre} (${i.cantidad}g)`).join(", ")}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Alimentos */}
          {alimentos.length > 0 && (
            <div>
              {recetas.length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground mb-2">Alimentos</p>
              )}
              <div className="space-y-1">
                {alimentos.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectAlimento(item)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="text-sm font-medium">{item.nombre}</p>
                    <div className="mt-1">
                      <MacroBadges calorias={item.calorias} proteinas={item.proteinas} carbohidratos={item.carbohidratos} grasas={item.grasas} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
