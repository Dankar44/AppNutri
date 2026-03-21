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
  const [porciones, setPorciones] = useState(defaultValues?.porciones || 1);
  const isEdit = !!recetaId;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (ingredientes.length === 0) {
      toast.error("Añade al menos un ingrediente");
      return;
    }

    setLoading(true);
    const form = new FormData(e.currentTarget);

    const data: RecetaFormData = {
      nombre: form.get("nombre") as string,
      descripcion: (form.get("descripcion") as string) || undefined,
      instrucciones: (form.get("instrucciones") as string) || undefined,
      porciones,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
            <input
              name="descripcion"
              maxLength={500}
              defaultValue={defaultValues?.descripcion}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Porciones</label>
            <input
              type="number"
              min={1}
              max={100}
              value={porciones}
              onChange={(e) => setPorciones(parseInt(e.target.value) || 1)}
              className="w-32 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Instrucciones</label>
            <textarea
              name="instrucciones"
              rows={4}
              maxLength={5000}
              defaultValue={defaultValues?.instrucciones}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
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

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear receta"}
        </button>
      </div>
    </form>
  );
}
