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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("recipes");
  const [loading, setLoading] = useState(false);
  const [ingredientes, setIngredientes] = useState<IngredienteItem[]>(defaultIngredientes);
  const porciones = 1;
  const isEdit = !!recetaId;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (ingredientes.length === 0) {
      toast.error(t("form.anadeMinimoIngrediente"));
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
        toast.success(t("form.recetaActualizada"));
      } else {
        await crearReceta(data, ingredientesData);
        toast.success(t("form.recetaCreada"));
      }
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("form.errorGuardar"));
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
        <h2 className="text-lg font-semibold">{t("form.informacionReceta")}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.nombre")}</label>
            <input
              name="nombre"
              required
              maxLength={200}
              defaultValue={defaultValues?.nombre}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.descripcionLabel")}</label>
            <textarea
              name="descripcion"
              rows={3}
              maxLength={500}
              defaultValue={defaultValues?.descripcion}
              placeholder={t("form.descripcionPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.tiempoPreparacion")}</label>
            <input
              name="tiempoPreparacion"
              type="number" inputMode="decimal"
              min={0}
              max={1440}
              step={1}
              defaultValue={defaultValues?.tiempoPreparacion ?? ""}
              placeholder={t("form.tiempoPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("form.ingredientes")}</h2>
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
          {t("form.cancelar")}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 sm:py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 min-h-11 sm:min-h-0"
        >
          {loading ? t("form.guardando") : isEdit ? t("form.guardarCambios") : t("form.crearReceta")}
        </button>
      </div>
      </div>

      <aside className="lg:sticky lg:top-4 space-y-3">
        <MacroAnalysisCard
          title={t("form.macrosReceta")}
          proteinas={macrosPorPorcion.proteinas}
          carbohidratos={macrosPorPorcion.carbohidratos}
          grasas={macrosPorPorcion.grasas}
          fibra={macrosPorPorcion.fibra}
        />
        <div className="bg-card rounded-xl border border-border px-5 py-4 flex items-center justify-center gap-6 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground text-xs">{t("form.energiaLabel")}</p>
            <p className="font-bold text-base tabular-nums">{Math.round(macrosTotales.calorias)} kcal</p>
          </div>
          <div className="h-8 w-px bg-border" aria-hidden />
          <div className="text-center">
            <p className="text-muted-foreground text-xs">{t("form.peso1Porcion")}</p>
            <p className="font-bold text-base tabular-nums">{Math.round(pesoTotal)} g</p>
          </div>
        </div>
        {ingredientes.length === 0 && (
          <p className="text-xs text-muted-foreground text-center italic">
            {t("form.anadirIngredientes")}
          </p>
        )}
      </aside>
    </form>
  );
}
