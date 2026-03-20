"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { MacroBadges } from "./macro-badge";

interface AlimentoOption {
  id: string;
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  porcion: number;
}

interface AlimentoSearchProps {
  onSelect: (alimento: AlimentoOption) => void;
  placeholder?: string;
  searchAction: (query: string) => Promise<AlimentoOption[]>;
}

export function AlimentoSearch({
  onSelect,
  placeholder = "Buscar alimento...",
  searchAction,
}: AlimentoSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlimentoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchAction(value);
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(alimento: AlimentoOption) {
    onSelect(alimento);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {results.map((alimento) => (
            <button
              key={alimento.id}
              onClick={() => handleSelect(alimento)}
              className="w-full px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
            >
              <p className="text-sm font-medium">{alimento.nombre}</p>
              <div className="mt-1">
                <MacroBadges
                  calorias={alimento.calorias}
                  proteinas={alimento.proteinas}
                  carbohidratos={alimento.carbohidratos}
                  grasas={alimento.grasas}
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg p-4 text-center text-sm text-muted-foreground">
          No se encontraron resultados
        </div>
      )}
    </div>
  );
}
