"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Download } from "lucide-react";
import { buscarAlimentosAPI, importarAlimentoAPI } from "@/app/actions/alimentos";
import { MacroBadges } from "@/components/macro-badge";
import { toast } from "sonner";
import type { AlimentoAPIResult } from "@/lib/openfoodfacts";

export default function ImportarAlimentoPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlimentoAPIResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.length < 2) return;
    setLoading(true);
    try {
      const data = await buscarAlimentosAPI(query);
      setResults(data);
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al buscar alimentos");
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(alimento: AlimentoAPIResult) {
    setImporting(alimento.codigoBarras);
    try {
      const imported = await importarAlimentoAPI(alimento);
      toast.success(`${alimento.nombre} importado correctamente`);
      if (imported?.id) router.push(`/alimentos/${imported.id}`);
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al importar el alimento");
      setImporting(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/alimentos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a alimentos
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Importar desde Open Food Facts</h1>
        <p className="text-muted-foreground mt-1">
          Busca alimentos en la base de datos abierta y añádelos a tu colección
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar alimento (ej: arroz, pollo, manzana)..."
            maxLength={100}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || query.length < 2}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((alimento) => (
            <div
              key={alimento.codigoBarras}
              className="bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{alimento.nombre}</p>
                <div className="mt-1.5">
                  <MacroBadges
                    calorias={Math.round(alimento.calorias)}
                    proteinas={Math.round(alimento.proteinas * 10) / 10}
                    carbohidratos={Math.round(alimento.carbohidratos * 10) / 10}
                    grasas={Math.round(alimento.grasas * 10) / 10}
                    fibra={Math.round(alimento.fibra * 10) / 10}
                  />
                </div>
              </div>
              <button
                onClick={() => handleImport(alimento)}
                disabled={importing === alimento.codigoBarras}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium shrink-0 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {importing === alimento.codigoBarras ? "Importando..." : "Importar"}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query.length >= 2 && (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <p className="text-muted-foreground">
            No se encontraron resultados. Intenta con otro término de búsqueda.
          </p>
        </div>
      )}
    </div>
  );
}
