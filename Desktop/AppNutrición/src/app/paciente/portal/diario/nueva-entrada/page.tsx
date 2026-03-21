"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { crearEntradaDiario, buscarAlimentosPaciente } from "@/app/actions/diario";
import { toast } from "sonner";

const TIPOS = [
  { value: "DESAYUNO", label: "Desayuno" },
  { value: "MEDIA_MANANA", label: "Media mañana" },
  { value: "ALMUERZO", label: "Almuerzo" },
  { value: "MERIENDA", label: "Merienda" },
  { value: "CENA", label: "Cena" },
  { value: "RECENA", label: "Recena" },
];

export default function NuevaEntradaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<"buscar" | "texto">("buscar");
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<{ id: string; nombre: string; porcion: number }[]>([]);
  const [alimentoSeleccionado, setAlimentoSeleccionado] = useState<{ id: string; nombre: string; porcion: number } | null>(null);
  const [buscando, setBuscando] = useState(false);

  const fechaDefault = searchParams.get("fecha") || new Date().toISOString().split("T")[0];
  const tipoDefault = searchParams.get("tipo") || "DESAYUNO";

  async function handleBuscar(value: string) {
    setQuery(value);
    if (value.length < 2) { setResultados([]); return; }
    setBuscando(true);
    try {
      const data = await buscarAlimentosPaciente(value);
      setResultados(data);
    } finally {
      setBuscando(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    try {
      await crearEntradaDiario({
        fecha: form.get("fecha") as string,
        tipoComida: form.get("tipoComida") as "DESAYUNO",
        descripcion: modo === "texto" ? (form.get("descripcion") as string) : undefined,
        alimentoId: alimentoSeleccionado?.id,
        cantidad: parseFloat(form.get("cantidad") as string) || undefined,
        notas: (form.get("notas") as string) || undefined,
      });
      toast.success("Entrada registrada");
      router.push("/paciente/portal/diario");
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al registrar");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/paciente/portal/diario"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al diario
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold">Registrar comida</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha</label>
            <input name="fecha" type="date" defaultValue={fechaDefault} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Comida</label>
            <select name="tipoComida" defaultValue={tipoDefault} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm">
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => { setModo("buscar"); setAlimentoSeleccionado(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${modo === "buscar" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>
            Buscar alimento
          </button>
          <button type="button" onClick={() => { setModo("texto"); setAlimentoSeleccionado(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${modo === "texto" ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>
            Texto libre
          </button>
        </div>

        {modo === "buscar" ? (
          <div>
            {alimentoSeleccionado ? (
              <div className="p-3 rounded-lg border border-primary bg-primary/5">
                <p className="text-sm font-medium">{alimentoSeleccionado.nombre}</p>
                <button type="button" onClick={() => setAlimentoSeleccionado(null)} className="text-xs text-primary mt-1">Cambiar</button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text" value={query} onChange={(e) => handleBuscar(e.target.value)}
                  placeholder="Buscar alimento..."
                  maxLength={100}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
                />
                {resultados.length > 0 && (
                  <div className="mt-1 border border-border rounded-lg bg-card max-h-40 overflow-y-auto">
                    {resultados.map((r) => (
                      <button key={r.id} type="button" onClick={() => { setAlimentoSeleccionado(r); setQuery(""); setResultados([]); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b border-border last:border-0">
                        {r.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Cantidad (g)</label>
              <input name="cantidad" type="number" step="1" min={0.1} max={10000}
                defaultValue={alimentoSeleccionado?.porcion || ""}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">¿Qué comiste?</label>
            <input name="descripcion" required maxLength={500} placeholder="Ej: Un bocadillo de jamón y queso"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm" />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
          <textarea name="notas" rows={2} maxLength={2000} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-y" />
        </div>

        <button type="submit" disabled={loading || (modo === "buscar" && !alimentoSeleccionado)}
          className="w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50">
          {loading ? "Guardando..." : "Registrar"}
        </button>
      </form>
    </div>
  );
}
