"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { crearAlimento, actualizarAlimento, type AlimentoFormData } from "@/app/actions/alimentos";

const CATEGORIAS = [
  { value: "FRUTAS", label: "Frutas" },
  { value: "VERDURAS", label: "Verduras" },
  { value: "CEREALES", label: "Cereales" },
  { value: "LEGUMBRES", label: "Legumbres" },
  { value: "CARNES", label: "Carnes" },
  { value: "PESCADOS", label: "Pescados" },
  { value: "LACTEOS", label: "Lácteos" },
  { value: "HUEVOS", label: "Huevos" },
  { value: "FRUTOS_SECOS", label: "Frutos secos" },
  { value: "ACEITES", label: "Aceites y grasas" },
  { value: "BEBIDAS", label: "Bebidas" },
  { value: "CONDIMENTOS", label: "Condimentos" },
  { value: "DULCES", label: "Dulces" },
  { value: "OTROS", label: "Otros" },
];

const UNIDADES = [
  { value: "GRAMOS", label: "Gramos (g)" },
  { value: "MILILITROS", label: "Mililitros (ml)" },
  { value: "UNIDAD", label: "Unidad" },
  { value: "CUCHARADA", label: "Cucharada" },
  { value: "CUCHARADITA", label: "Cucharadita" },
  { value: "TAZA", label: "Taza" },
  { value: "REBANADA", label: "Rebanada" },
  { value: "PIEZA", label: "Pieza" },
];

interface AlimentoFormProps {
  alimentoId?: string;
  defaultValues?: AlimentoFormData;
}

export function AlimentoForm({ alimentoId, defaultValues }: AlimentoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!alimentoId;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data: AlimentoFormData = {
      nombre: form.get("nombre") as string,
      categoria: form.get("categoria") as AlimentoFormData["categoria"],
      calorias: parseFloat(form.get("calorias") as string) || 0,
      proteinas: parseFloat(form.get("proteinas") as string) || 0,
      carbohidratos: parseFloat(form.get("carbohidratos") as string) || 0,
      grasas: parseFloat(form.get("grasas") as string) || 0,
      fibra: parseFloat(form.get("fibra") as string) || 0,
      porcion: parseFloat(form.get("porcion") as string) || 100,
      unidad: form.get("unidad") as AlimentoFormData["unidad"],
      enlaceProducto: (form.get("enlaceProducto") as string)?.trim() || null,
    };

    try {
      if (isEdit) {
        await actualizarAlimento(alimentoId, data);
        toast.success("Alimento actualizado");
      } else {
        await crearAlimento(data);
        toast.success("Alimento creado");
      }
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al guardar el alimento");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">Información general</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
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
            <label className="block text-sm font-medium mb-1">Categoría *</label>
            <select
              name="categoria"
              required
              defaultValue={defaultValues?.categoria || "OTROS"}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Unidad de medida</label>
            <select
              name="unidad"
              defaultValue={defaultValues?.unidad || "GRAMOS"}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {UNIDADES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Porción base (g)</label>
            <input
              name="porcion"
              type="number" inputMode="decimal"
              step="0.1"
              min={0.1}
              max={10000}
              defaultValue={defaultValues?.porcion || 100}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">Enlace al producto</label>
            <input
              name="enlaceProducto"
              type="url"
              maxLength={2048}
              placeholder="https://www.ejemplo.com/producto"
              defaultValue={defaultValues?.enlaceProducto || ""}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL del producto en la web de la tienda o supermercado (opcional)
            </p>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-semibold">Macronutrientes por 100g</h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Calorías (kcal)</label>
            <input
              name="calorias"
              type="number" inputMode="decimal"
              step="0.1"
              min={0}
              max={20000}
              required
              defaultValue={defaultValues?.calorias}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Proteínas (g)</label>
            <input
              name="proteinas"
              type="number" inputMode="decimal"
              step="0.1"
              min={0}
              max={2000}
              required
              defaultValue={defaultValues?.proteinas}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Carbohidratos (g)</label>
            <input
              name="carbohidratos"
              type="number" inputMode="decimal"
              step="0.1"
              min={0}
              max={2000}
              required
              defaultValue={defaultValues?.carbohidratos}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Grasas (g)</label>
            <input
              name="grasas"
              type="number" inputMode="decimal"
              step="0.1"
              min={0}
              max={2000}
              required
              defaultValue={defaultValues?.grasas}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fibra (g)</label>
            <input
              name="fibra"
              type="number" inputMode="decimal"
              step="0.1"
              min={0}
              max={2000}
              defaultValue={defaultValues?.fibra || 0}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
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
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear alimento"}
        </button>
      </div>
    </form>
  );
}
