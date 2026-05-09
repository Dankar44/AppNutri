"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { crearAlimento, actualizarAlimento, type AlimentoFormData } from "@/app/actions/alimentos";
import { VITAMINAS, MINERALES, type MicroKey } from "@/lib/micronutrientes";
import { UNIDAD_LABELS_FULL } from "@/lib/units";

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

  const [selectedUnidad, setSelectedUnidad] = useState<string>(defaultValues?.unidad || "GRAMOS");
  const [imagenPreview, setImagenPreview] = useState<string | null>(defaultValues?.imagenUrl || null);
  const [imagenError, setImagenError] = useState(false);
  const hasAnyMicro = defaultValues?.micronutrientes && Object.values(defaultValues.micronutrientes).some((v) => v !== null && v !== undefined);
  const [microsOpen, setMicrosOpen] = useState(!!hasAnyMicro);
  const [microsTracked, setMicrosTracked] = useState(!!hasAnyMicro);

  function toggleMicros() {
    if (!microsOpen && !microsTracked) setMicrosTracked(true);
    setMicrosOpen(!microsOpen);
  }

  function parseMicros(form: FormData): Partial<Record<MicroKey, number | null>> | undefined {
    if (!microsTracked) return undefined;
    const result: Partial<Record<MicroKey, number | null>> = {};
    for (const micro of [...VITAMINAS, ...MINERALES]) {
      const raw = form.get(micro.key) as string;
      if (raw === null || raw === undefined || raw.trim() === "") {
        result[micro.key] = null;
      } else {
        const num = parseFloat(raw);
        result[micro.key] = isNaN(num) ? null : num;
      }
    }
    return result;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (imagenPreview && imagenError) {
      toast.error("La URL de imagen no es válida. Corrígela o déjala vacía.");
      return;
    }
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
      imagenUrl: (form.get("imagenUrl") as string)?.trim() || null,
      micronutrientes: parseMicros(form),
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
      const digest = error && typeof error === "object" && "digest" in error
        ? String((error as Record<string, unknown>).digest) : "";
      if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")) throw error;
      const message = error instanceof Error ? error.message : "Error al guardar el alimento";
      toast.error(message);
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
              value={selectedUnidad}
              onChange={(e) => setSelectedUnidad(e.target.value)}
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
            <label className="block text-sm font-medium mb-1">
              {selectedUnidad === "GRAMOS" || selectedUnidad === "MILILITROS"
                ? "Porción base (g)"
                : `Gramos por 1 ${UNIDADES.find((u) => u.value === selectedUnidad)?.label.toLowerCase() || "unidad"}`}
            </label>
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
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">URL de imagen del alimento</label>
            <input
              name="imagenUrl"
              type="url"
              maxLength={2048}
              placeholder="https://www.ejemplo.com/imagen-producto.jpg"
              defaultValue={defaultValues?.imagenUrl || ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setImagenPreview(v || null);
                setImagenError(false);
              }}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL de una imagen del alimento (opcional)
            </p>
            {imagenPreview && !imagenError && (
              <div className="mt-2 flex items-start gap-3">
                <div className="w-24 h-24 rounded-lg overflow-hidden border border-border bg-muted/10 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagenPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setImagenError(true)}
                  />
                </div>
                <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Vista previa
                </span>
              </div>
            )}
            {imagenPreview && imagenError && (
              <p className="text-xs text-red-500 mt-1">No se pudo cargar la imagen de esa URL</p>
            )}
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

      <section className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
        <button
          type="button"
          onClick={toggleMicros}
          className="w-full flex items-center justify-between"
        >
          <h2 className="text-base sm:text-lg font-semibold">Micronutrientes por 100g</h2>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            {microsOpen ? "Cerrar" : "Opcional"}
            {microsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {microsOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 pt-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vitaminas</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {VITAMINAS.map((micro) => {
                  const dv = defaultValues?.micronutrientes?.[micro.key];
                  return (
                    <div key={micro.key}>
                      <label className="block text-xs font-medium mb-1">{micro.label} ({micro.unit})</label>
                      <input
                        name={micro.key}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={0}
                        defaultValue={typeof dv === "number" ? dv : ""}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Minerales</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MINERALES.map((micro) => {
                  const dv = defaultValues?.micronutrientes?.[micro.key];
                  return (
                    <div key={micro.key}>
                      <label className="block text-xs font-medium mb-1">{micro.label} ({micro.unit})</label>
                      <input
                        name={micro.key}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        min={0}
                        defaultValue={typeof dv === "number" ? dv : ""}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-xs text-muted-foreground lg:col-span-2">
              Deja en blanco los campos que no conozcas. Solo se guardarán los que rellenes.
            </p>
          </div>
        )}
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
          disabled={loading || (!!imagenPreview && imagenError)}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear alimento"}
        </button>
      </div>
    </form>
  );
}
