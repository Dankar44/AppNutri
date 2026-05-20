"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { crearAlimento, actualizarAlimento, type AlimentoFormData } from "@/app/actions/alimentos";
import { VITAMINAS, MINERALES, type MicroKey } from "@/lib/micronutrientes";
import { UNIDAD_LABELS_FULL } from "@/lib/units";
import { useTranslations } from "next-intl";
import { useUncontrolledFormPersist } from "@/lib/form-persist";
import { isNextNavigation, withTimeout } from "@/lib/utils";

const CATEGORIA_VALUES = [
  "FRUTAS", "VERDURAS", "CEREALES", "LEGUMBRES", "CARNES", "PESCADOS",
  "LACTEOS", "HUEVOS", "FRUTOS_SECOS", "ACEITES", "BEBIDAS", "CONDIMENTOS",
  "DULCES", "OTROS",
] as const;

const CATEGORIA_KEYS: Record<string, string> = {
  FRUTAS: "categorias.frutas",
  VERDURAS: "categorias.verduras",
  CEREALES: "categorias.cereales",
  LEGUMBRES: "categorias.legumbres",
  CARNES: "categorias.carnes",
  PESCADOS: "categorias.pescados",
  LACTEOS: "categorias.lacteos",
  HUEVOS: "categorias.huevos",
  FRUTOS_SECOS: "categorias.frutosSecos",
  ACEITES: "categorias.aceitesYGrasas",
  BEBIDAS: "categorias.bebidas",
  CONDIMENTOS: "categorias.condimentos",
  DULCES: "categorias.dulces",
  OTROS: "categorias.otros",
};

const UNIDAD_VALUES = [
  "GRAMOS", "MILILITROS", "UNIDAD", "CUCHARADA", "CUCHARADITA", "TAZA",
  "REBANADA", "PIEZA",
] as const;

const UNIDAD_KEYS: Record<string, string> = {
  GRAMOS: "unidades.gramos",
  MILILITROS: "unidades.mililitros",
  UNIDAD: "unidades.unidad",
  CUCHARADA: "unidades.cucharada",
  CUCHARADITA: "unidades.cucharadita",
  TAZA: "unidades.taza",
  REBANADA: "unidades.rebanada",
  PIEZA: "unidades.pieza",
};

interface AlimentoFormProps {
  alimentoId?: string;
  defaultValues?: AlimentoFormData;
}

export function AlimentoForm({ alimentoId, defaultValues }: AlimentoFormProps) {
  const router = useRouter();
  const t = useTranslations("foods");
  const tc = useTranslations("common.deploy");
  const [loading, setLoading] = useState(false);
  const isEdit = !!alimentoId;
  const formRef = useRef<HTMLFormElement>(null);
  const { wasRestored, clear: clearDraft } = useUncontrolledFormPersist(
    `alimento-${alimentoId ?? "nuevo"}`,
    formRef,
  );

  useEffect(() => {
    if (wasRestored) toast.success(tc("datosRestaurados"));
  }, [wasRestored, tc]);

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
      toast.error(t("form.urlImagenNoValida"));
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
      clearDraft();
      if (isEdit) {
        await withTimeout(actualizarAlimento(alimentoId, data));
        toast.success(t("form.alimentoActualizado"));
      } else {
        await withTimeout(crearAlimento(data));
        toast.success(t("form.alimentoCreado"));
      }
    } catch (error) {
      if (isNextNavigation(error)) throw error;
      const message = error instanceof Error ? error.message : t("form.errorGuardar");
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <section className="bg-card rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("form.informacionGeneral")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
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
            <label className="block text-sm font-medium mb-1">{t("form.categoria")}</label>
            <select
              name="categoria"
              required
              defaultValue={defaultValues?.categoria || "OTROS"}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {CATEGORIA_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(CATEGORIA_KEYS[value])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.unidadMedida")}</label>
            <select
              name="unidad"
              value={selectedUnidad}
              onChange={(e) => setSelectedUnidad(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {UNIDAD_VALUES.map((value) => (
                <option key={value} value={value}>
                  {t(UNIDAD_KEYS[value])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {selectedUnidad === "GRAMOS" || selectedUnidad === "MILILITROS"
                ? t("form.porcionBase")
                : t("form.gramosPor", { unidad: t(UNIDAD_KEYS[selectedUnidad]).toLowerCase() })}
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
            <label className="block text-sm font-medium mb-1">{t("form.enlaceProducto")}</label>
            <input
              name="enlaceProducto"
              type="url"
              maxLength={2048}
              placeholder={t("form.enlaceProductoPlaceholder")}
              defaultValue={defaultValues?.enlaceProducto || ""}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("form.enlaceProductoHint")}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">{t("form.urlImagen")}</label>
            <input
              name="imagenUrl"
              type="url"
              maxLength={2048}
              placeholder={t("form.urlImagenPlaceholder")}
              defaultValue={defaultValues?.imagenUrl || ""}
              onChange={(e) => {
                const v = e.target.value.trim();
                setImagenPreview(v || null);
                setImagenError(false);
              }}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("form.urlImagenHint")}
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
                  {t("form.vistaPrevia")}
                </span>
              </div>
            )}
            {imagenPreview && imagenError && (
              <p className="text-xs text-red-500 mt-1">{t("form.noPudoCargarImagen")}</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-semibold">{t("form.macronutrientesPor100g")}</h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.caloriasKcal")}</label>
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
            <label className="block text-sm font-medium mb-1">{t("form.proteinasG")}</label>
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
            <label className="block text-sm font-medium mb-1">{t("form.carbohidratosG")}</label>
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
            <label className="block text-sm font-medium mb-1">{t("form.grasasG")}</label>
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
            <label className="block text-sm font-medium mb-1">{t("form.fibraG")}</label>
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
          <h2 className="text-base sm:text-lg font-semibold">{t("form.micronutrientesPor100g")}</h2>
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            {microsOpen ? t("form.cerrar") : t("form.opcional")}
            {microsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        {microsOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 pt-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("filter.vitaminas")}</h3>
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
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{t("filter.minerales")}</h3>
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
              {t("form.dejaEnBlanco")}
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
          {t("form.cancelar")}
        </button>
        <button
          type="submit"
          disabled={loading || (!!imagenPreview && imagenError)}
          className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {loading ? t("form.guardando") : isEdit ? t("form.guardarCambios") : t("form.crearAlimento")}
        </button>
      </div>
    </form>
  );
}
