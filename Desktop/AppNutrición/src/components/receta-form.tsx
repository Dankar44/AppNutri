"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  crearReceta,
  actualizarReceta,
  type RecetaFormData,
  type IngredienteData,
} from "@/app/actions/recetas";
import { IngredienteList, type IngredienteItem } from "./ingrediente-list";
import { MacroAnalysisCard } from "./alimento/macro-analysis-card";
import { calcularMacrosPorcion, sumarMacros, convertirAGramos } from "@/lib/macros";

interface RecetaFormProps {
  recetaId?: string;
  defaultValues?: RecetaFormData;
  defaultIngredientes?: IngredienteItem[];
}

export function RecetaForm({
  recetaId,
  defaultValues,
  defaultIngredientes = [],
}: RecetaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [ingredientes, setIngredientes] = useState<IngredienteItem[]>(defaultIngredientes);
  const porciones = 1;
  const isEdit = !!recetaId;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (ingredientes.length === 0) {
      toast.error("Añade al menos un ingrediente");
      return;
    }

    setLoading(true);
    const form = new FormData(e.currentTarget);

    const tiempoRaw = form.get("tiempoPreparacion");
    const tiempoStr = typeof tiempoRaw === "string" ? tiempoRaw.trim() : "";
    const tiempoParsed = tiempoStr === "" ? null : Number(tiempoStr);
    const data: RecetaFormData = {
      nombre: form.get("nombre") as string,
      descripcion: (form.get("descripcion") as string) || undefined,
      instrucciones: undefined,
      porciones,
      tiempoPreparacion:
        tiempoParsed === null || Number.isNaN(tiempoParsed) ? null : tiempoParsed,
    };

    const ingredientesData: IngredienteData[] = ingredientes.map((ing) => ({
      alimentoId: ing.alimentoId,
      cantidad: ing.cantidad,
      unidad: ing.unidad as IngredienteData["unidad"],
    }));

    try {
      if (isEdit) {
        await actualizarReceta(recetaId, data, ingredientesData);
        toast.success("Receta actualizada");
      } else {
        await crearReceta(data, ingredientesData);
        toast.success("Receta creada");
      }
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al guardar la receta");
      setLoading(false);
    }
  }

  const macrosTotales = sumarMacros(
    ingredientes.map((ing) =>
      calcularMacrosPorcion(ing.macrosPor100g, convertirAGramos(ing.cantidad, ing.unidad, ing.porcion || 100))
    )
  );
  const macrosPorPorcion = porciones > 0
    ? {
        calorias: macrosTotales.calorias / porciones,
        proteinas: macrosTotales.proteinas / porciones,
        carbohidratos: macrosTotales.carbohidratos / porciones,
        grasas: macrosTotales.grasas / porciones,
        fibra: macrosTotales.fibra / porciones,
      }
    : macrosTotales;
  const pesoTotal = ingredientes.reduce((sum, ing) => sum + convertirAGramos(ing.cantidad || 0, ing.unidad, ing.porcion || 100), 0);

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
      <div className="space-y-6 min-w-0">
      <section className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Información de la receta</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              name="nombre"
              required
              maxLength={200}
              defaultValue={defaultValues?.nombre}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              name="descripcion"
              rows={3}
              maxLength={500}
              defaultValue={defaultValues?.descripcion}
              placeholder="Notas, pasos de preparación o cualquier detalle útil…"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tiempo de preparación (minutos)</label>
            <input
              name="tiempoPreparacion"
              type="number" inputMode="decimal"
              min={0}
              max={1440}
              step={1}
              defaultValue={defaultValues?.tiempoPreparacion ?? ""}
              placeholder="Ej. 30"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Ingredientes</h2>
        <IngredienteList
          ingredientes={ingredientes}
          onChange={setIngredientes}
          porciones={porciones}
        />
      </section>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 sm:py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium min-h-11 sm:min-h-0"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 sm:py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 min-h-11 sm:min-h-0"
        >
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear receta"}
        </button>
      </div>
      </div>

      <aside className="lg:sticky lg:top-4 space-y-3">
        <MacroAnalysisCard
          title="Macros de la receta"
          proteinas={macrosPorPorcion.proteinas}
          carbohidratos={macrosPorPorcion.carbohidratos}
          grasas={macrosPorPorcion.grasas}
          fibra={macrosPorPorcion.fibra}
        />
        <div className="bg-card rounded-xl border border-border px-5 py-4 flex items-center justify-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground text-xs">Energía</p>
            <p className="font-bold text-base tabular-nums">{Math.round(macrosTotales.calorias)} kcal</p>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden />
          <div className="text-center">
            <p className="text-muted-foreground text-xs">Peso 1 porción</p>
            <p className="font-bold text-base tabular-nums">{Math.round(pesoTotal)} g</p>
          </div>
        </div>
        {ingredientes.length === 0 && (
          <p className="text-xs text-muted-foreground text-center italic">
            Añade ingredientes para ver los macros calculados
          </p>
        )}
      </aside>
    </form>
  );
}
