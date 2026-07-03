"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  crearReceta,
  actualizarReceta,
  getMicrosAlimentos,
  type RecetaFormData,
  type IngredienteData,
} from "@/app/actions/recetas";
import { IngredienteList, type IngredienteItem } from "./ingrediente-list";
import { MacroAnalysisCard } from "./alimento/macro-analysis-card";
import { MicronutrientesCard } from "./alimento/micronutrientes-card";
import { MICRO_KEYS, type MicroKey } from "@/lib/micronutrientes";
import { calcularMacrosPorcion, sumarMacros, convertirAGramos } from "@/lib/macros";
import { CantidadInput } from "@/components/cantidad-input";
import { useTranslations } from "next-intl";
import { isNextNavigation, withTimeout } from "@/lib/utils";
import { useUncontrolledFormPersist } from "@/lib/form-persist";
import { useDemoGuard } from "@/contexts/demo-context";

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
  const tc = useTranslations("common.deploy");
  const blockIfDemo = useDemoGuard();
  const [loading, setLoading] = useState(false);
  const [ingredientes, setIngredientes] = useState<IngredienteItem[]>(defaultIngredientes);
  // Micros por 100 g de cada alimento usado (cargados bajo demanda) para sumarlos en vivo.
  const [microsCache, setMicrosCache] = useState<Record<string, Partial<Record<string, number | null>>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const { wasRestored, clear: clearDraft } = useUncontrolledFormPersist(
    `receta-${recetaId ?? "nueva"}`,
    formRef,
  );

  useEffect(() => {
    if (wasRestored) toast.success(tc("datosRestaurados"));
  }, [wasRestored, tc]);
  const [porciones, setPorciones] = useState<number>(
    defaultValues?.porciones && defaultValues.porciones > 0 ? defaultValues.porciones : 1,
  );
  // Preparación numerada automáticamente: Enter añade el siguiente "N. " y, en un campo
  // vacío, al enfocar arranca en "1. ". El parser de la vista quita la numeración igual,
  // así que esto es solo comodidad de escritura.
  const [instrucciones, setInstrucciones] = useState<string>(defaultValues?.instrucciones ?? "");

  function handleInstruccionesKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = instrucciones.slice(0, start);
    const after = instrucciones.slice(end);
    const n = before.split("\n").filter((l) => l.trim()).length + 1;
    const insert = `\n${n}. `;
    setInstrucciones(before + insert + after);
    requestAnimationFrame(() => {
      const pos = start + insert.length;
      ta.selectionStart = ta.selectionEnd = pos;
    });
  }

  function handleInstruccionesChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    // Al teclear el primer carácter en un campo vacío, prefijar "1. " (si no escribió ya un número).
    if (instrucciones.trim() === "" && val.trim() !== "" && !/^\s*\d+[.)]/.test(val)) {
      const ta = e.currentTarget;
      setInstrucciones("1. " + val);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = ta.value.length;
      });
      return;
    }
    setInstrucciones(val);
  }

  const isEdit = !!recetaId;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (blockIfDemo()) return;
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
      instrucciones: (form.get("instrucciones") as string) || undefined,
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
      clearDraft();
      if (isEdit) {
        await withTimeout(actualizarReceta(recetaId, data, ingredientesData));
        toast.success(t("form.recetaActualizada"));
      } else {
        await withTimeout(crearReceta(data, ingredientesData));
        toast.success(t("form.recetaCreada"));
      }
    } catch (error) {
      if (isNextNavigation(error)) throw error;
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

  // Cargar micros/100 g de los alimentos usados (nuevos y precargados al editar).
  const idsKey = ingredientes.map((i) => i.alimentoId).join(",");
  useEffect(() => {
    const ids = ingredientes.map((i) => i.alimentoId).filter(Boolean);
    if (ids.length === 0) return;
    getMicrosAlimentos(ids)
      .then((data) => setMicrosCache((prev) => ({ ...prev, ...data })))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Micros por porción: se suman escalando por gramos de cada ingrediente y se dividen
  // por las porciones, igual que los macros de la tarjeta.
  const microsPorPorcion = useMemo(() => {
    const acc: Partial<Record<MicroKey, number>> = {};
    let hay = false;
    for (const ing of ingredientes) {
      const micros = microsCache[ing.alimentoId];
      if (!micros) continue;
      const gramos = convertirAGramos(ing.cantidad, ing.unidad, ing.porcion || 100);
      const factor = gramos / 100;
      for (const k of MICRO_KEYS) {
        const v = micros[k];
        if (v === null || v === undefined || !isFinite(v)) continue;
        acc[k] = (acc[k] ?? 0) + v * factor;
        hay = true;
      }
    }
    if (!hay) return {};
    const out: Partial<Record<MicroKey, number>> = {};
    for (const k of MICRO_KEYS) {
      if (acc[k] === undefined) continue;
      out[k] = porciones > 0 ? acc[k]! / porciones : acc[k]!;
    }
    return out;
  }, [ingredientes, microsCache, porciones]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
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
            <label className="block text-sm font-medium mb-1">{t("form.instruccionesLabel")}</label>
            <textarea
              name="instrucciones"
              rows={5}
              maxLength={4000}
              value={instrucciones}
              onChange={handleInstruccionesChange}
              onKeyDown={handleInstruccionesKeyDown}
              placeholder={t("form.instruccionesPlaceholder")}
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
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.porcionesLabel")}</label>
            <CantidadInput
              value={porciones}
              onChange={setPorciones}
              min={1}
              max={50}
              redondearA={0.5}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1">{t("form.porcionesAyuda")}</p>
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
        <MicronutrientesCard values={microsPorPorcion} title={t("form.microsReceta")} compact />
        {ingredientes.length === 0 && (
          <p className="text-xs text-muted-foreground text-center italic">
            {t("form.anadirIngredientes")}
          </p>
        )}
      </aside>
    </form>
  );
}
