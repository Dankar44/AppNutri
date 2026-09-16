"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import {
  Mail,
  Palette,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  Download,
  Eye,
  Sparkles,
  RotateCcw,
  Ban,
  EyeOff,
  ListOrdered,
  ArrowLeftRight,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SelectorDesplegable } from "@/components/selector-desplegable";
import { enviarPlanPorEmail } from "@/app/actions/email";
import { getPlanPDFData, getPlanesPaciente } from "@/app/actions/planes";
import {
  generatePlanPDF,
  type PlanPDFData,
  type PDFSectionOptions,
  type DisplayOverrides,
  type QuantityOverride,
  type PDFSectionKey,
  ORDEN_SECCIONES_PDF,
  UNIDAD_LABELS_FULL,
} from "@/lib/pdf/generate-plan-pdf";
import { extraerRecetasDelPlan, type DistribucionRecetarioPDF } from "@/lib/pdf/generate-recetario-pdf";
import { downloadPDF } from "@/lib/pdf/pdf-download";
import { EntregarCaso } from "@/components/docencia/entregar-caso";
import { OrdenSeccionesPdf } from "@/components/paciente/orden-secciones-pdf";

// ─── Types ───

interface EntregablesTabProps {
  pacienteId: string;
  pacienteEmail?: string | null;
  pacienteNombre: string;
  planActivo?: { id: string; nombre: string } | null;
  /** Si el paciente tiene activado "ocultar calorías": el PDF arranca sin valores nutricionales + aviso. */
  ocultarCalorias?: boolean;
  /**
   * #40 — Si este paciente es un caso de clase: el alumno puede entregar desde aquí el PDF con las
   * secciones que tiene puestas, que es el sitio natural para hacerlo.
   */
  casoEntrega?: { asignacionId: string; estado: string; planes: { id: string; nombre: string; activo: boolean }[] } | null;
}

// ─── PDF Options ───

type PDFOptions = {
  portada: boolean;
  planSemanal: boolean;
  cantidadesSemanal: boolean;
  detalleDiario: boolean;
  recomendaciones: boolean;
  listaCompra: boolean;
  valoresNutricionales: boolean;
  recetasDelPlan: boolean;
  valoresNutricionalesRecetas: boolean;
  distribucionRecetas: DistribucionRecetarioPDF;
  densidad: "normal" | "compacta";
  planSemanalHorizontal: boolean;
  listaCompraHorizontal: boolean;
  ordenSecciones: PDFSectionKey[];
};

type PDFOptionBooleana = Exclude<keyof PDFOptions, "distribucionRecetas" | "densidad" | "ordenSecciones">;

type PaginaPreview = { ancho: number; alto: number; arriba: number };

const PDF_OPTIONS_DEFAULT: PDFOptions = {
  portada: true,
  planSemanal: true,
  cantidadesSemanal: false,
  detalleDiario: true,
  recomendaciones: true,
  listaCompra: true,
  valoresNutricionales: true,
  recetasDelPlan: false,
  valoresNutricionalesRecetas: true,
  distribucionRecetas: "automatica",
  densidad: "normal",
  planSemanalHorizontal: true,
  listaCompraHorizontal: false,
  ordenSecciones: [...ORDEN_SECCIONES_PDF],
};

const PDF_OPTIONS_KEYS: {
  key: PDFOptionBooleana;
  labelKey: string;
  descriptionKey: string;
  disabled?: boolean;
}[] = [
  { key: "portada", labelKey: "portada", descriptionKey: "portadaDescripcion", disabled: true },
  { key: "planSemanal", labelKey: "planSemanalCompleto", descriptionKey: "planSemanalCompletoDescripcion" },
  { key: "cantidadesSemanal", labelKey: "cantidadesSemanal", descriptionKey: "cantidadesSemanalDescripcion" },
  { key: "detalleDiario", labelKey: "detalleDiarioComidas", descriptionKey: "detalleDiarioComidasDescripcion" },
  { key: "recomendaciones", labelKey: "recomendaciones", descriptionKey: "recomendacionesDescripcion" },
  { key: "listaCompra", labelKey: "listaCompra", descriptionKey: "listaCompraDescripcion" },
  { key: "valoresNutricionales", labelKey: "valoresNutricionalesPorComida", descriptionKey: "valoresNutricionalesPorComidaDescripcion" },
];

const DIA_KEYS: Record<string, string> = {
  LUNES: "diaLunes", MARTES: "diaMartes", MIERCOLES: "diaMiercoles",
  JUEVES: "diaJueves", VIERNES: "diaViernes", SABADO: "diaSabado", DOMINGO: "diaDomingo",
};

const TIPO_KEYS: Record<string, string> = {
  DESAYUNO: "comidaDesayuno", MEDIA_MANANA: "comidaMediaManana", ALMUERZO: "comidaComida",
  MERIENDA: "comidaMerienda", CENA: "comidaCena", RECENA: "comidaRecena",
  // Sin esta entrada, una comida propia sin nombre salía como el enum en crudo ("OTRA").
  OTRA: "comidaOtra",
};

const UNIDADES = ["GRAMOS", "MILILITROS", "UNIDAD", "CUCHARADA", "CUCHARADITA", "TAZA", "REBANADA", "PIEZA", "LATA", "LONCHA"] as const;

// ─── Quantity Editor ───

function QuantityEditor({
  pdfData,
  overrides,
  onChange,
}: {
  pdfData: PlanPDFData;
  overrides: DisplayOverrides;
  onChange: (ov: DisplayOverrides) => void;
}) {
  const t = useTranslations("patients.entregables");
  const [expandedDia, setExpandedDia] = useState<string | null>(null);
  const [sectionOpen, setSectionOpen] = useState(false);
  const hasOverrides = Object.keys(overrides).length > 0;

  const updateOverride = useCallback(
    (key: string, patch: Partial<QuantityOverride>) => {
      onChange({ ...overrides, [key]: { ...overrides[key], ...patch } });
    },
    [overrides, onChange],
  );

  const removeOverride = useCallback(
    (key: string) => {
      const next = { ...overrides };
      delete next[key];
      onChange(next);
    },
    [overrides, onChange],
  );

  const resetAll = useCallback(() => onChange({}), [onChange]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setSectionOpen(!sectionOpen)}
        className="w-full flex items-center justify-between py-2 text-left group"
      >
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("cantidadesEntregable")}
          </h4>
          {hasOverrides && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
              {Object.keys(overrides).length}
            </span>
          )}
        </div>
        {sectionOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {sectionOpen && (
      <div className="space-y-2 mt-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("ajustaCantidades")}
          </p>
          {hasOverrides && (
            <button
              type="button"
              onClick={resetAll}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
            >
              <RotateCcw className="w-3 h-3" />
              {t("restablecer")}
            </button>
          )}
        </div>

      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
        {pdfData.dias.map((dia) => {
          const isExpanded = expandedDia === dia.dia;
          const diaOverrideCount = dia.comidas.reduce((count, comida) =>
            count + comida.alimentos.filter((_, aIdx) => {
              const key = `${dia.dia}-${comida.id}-${aIdx}`;
              return overrides[key] !== undefined;
            }).length, 0);

          return (
            <div key={dia.dia} className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedDia(isExpanded ? null : dia.dia)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <span className="flex items-center gap-2">
                  {DIA_KEYS[dia.dia] ? t(DIA_KEYS[dia.dia]) : dia.dia}
                  {diaOverrideCount > 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                      {diaOverrideCount}
                    </span>
                  )}
                </span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {isExpanded && (
                <div className="border-t border-border divide-y divide-border/50">
                  {dia.comidas.map((comida) => {
                    if (comida.alimentos.length === 0) return null;
                    return (
                      <div key={comida.id} className="px-3 py-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
                          {/* El nombre que le puso el nutri; si no tiene, la etiqueta de su tipo.
                              Antes salía el enum en crudo ("OTRA") en la pantalla previa al PDF. */}
                          {(comida.nombre ?? "").trim() ||
                            (TIPO_KEYS[comida.tipo] ? t(TIPO_KEYS[comida.tipo]) : comida.tipo)}
                        </p>
                        <div className="space-y-1.5">
                          {comida.alimentos.map((a, aIdx) => {
                            const key = `${dia.dia}-${comida.id}-${aIdx}`;
                            const ov = overrides[key];
                            const nombre = a.alimento?.nombre || a.receta?.nombre || "?";
                            const isModified = ov !== undefined;
                            const isLibre = ov?.libre === true;
                            // Una receta se mide en porciones (1 = 1 persona): no tiene
                            // sentido el selector de unidades, y va de 0,5 en 0,5.
                            const esReceta = !!a.receta;

                            return (
                              <div key={key} className={cn(
                                "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                                isModified ? "bg-amber-50 dark:bg-amber-500/10" : "bg-muted/30"
                              )}>
                                <span className="flex-1 min-w-0 truncate font-medium" title={nombre}>
                                  {nombre}
                                </span>

                                {isLibre ? (
                                  <span className="text-muted-foreground italic shrink-0">{t("libre")}</span>
                                ) : (
                                  <>
                                    <input
                                      type="number"
                                      min={0}
                                      step={esReceta ? 0.5 : "any"}
                                      value={ov?.cantidad ?? a.cantidad}
                                      onChange={(e) => {
                                        if (e.target.value === "") {
                                          updateOverride(key, { cantidad: null, libre: false });
                                          return;
                                        }
                                        const parsed = parseFloat(e.target.value);
                                        if (Number.isNaN(parsed) || parsed < 0) return;
                                        updateOverride(key, { cantidad: parsed, libre: false });
                                      }}
                                      className="w-16 px-1.5 py-0.5 rounded border border-border bg-background text-right text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-primary/30"
                                    />
                                    {esReceta ? (
                                      <span className="w-24 px-1 text-xs text-muted-foreground" title={t("porcionesAyudaEntregable")}>
                                        {t("porciones")}
                                      </span>
                                    ) : (
                                      <select
                                        value={ov?.unidad ?? a.unidad}
                                        onChange={(e) => updateOverride(key, { unidad: e.target.value, libre: false })}
                                        className="w-24 px-1 py-0.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                                      >
                                        {UNIDADES.map((u) => (
                                          <option key={u} value={u}>{UNIDAD_LABELS_FULL[u]}</option>
                                        ))}
                                      </select>
                                    )}
                                  </>
                                )}

                                <button
                                  type="button"
                                  onClick={() => isLibre
                                    ? removeOverride(key)
                                    : updateOverride(key, { libre: true, cantidad: null, unidad: null })
                                  }
                                  title={isLibre ? t("restaurarCantidad") : t("marcarComoLibre")}
                                  className={cn(
                                    "p-1 rounded transition-colors shrink-0",
                                    isLibre
                                      ? "text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                  )}
                                >
                                  <Ban className="w-3 h-3" />
                                </button>

                                {isModified && !isLibre && (
                                  <button
                                    type="button"
                                    onClick={() => removeOverride(key)}
                                    title={t("restablecer")}
                                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
      )}
    </div>
  );
}

// ─── Main Component ───

export function EntregablesTab({
  pacienteId,
  pacienteEmail,
  pacienteNombre,
  planActivo,
  ocultarCalorias = false,
  casoEntrega = null,
}: EntregablesTabProps) {
  const t = useTranslations("patients.entregables");
  const tAula = useTranslations("aula");
  const tPdf = useTranslations("pdf");
  const tRecetario = useTranslations("recipes.recetario");
  const [sendingPlan, startSendingPlan] = useTransition();

  // PDF configurator state. Si el paciente tiene "ocultar calorías", los valores
  // nutricionales arrancan desactivados para no enviarle un PDF con kcal sin querer.
  const opcionesIniciales: PDFOptions = {
    ...PDF_OPTIONS_DEFAULT,
    valoresNutricionales: !ocultarCalorias,
    valoresNutricionalesRecetas: !ocultarCalorias,
  };
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>(opcionesIniciales);
  const [appliedOptions, setAppliedOptions] = useState<PDFOptions>(opcionesIniciales);
  const [pdfData, setPdfData] = useState<PlanPDFData | null>(null);
  const [planes, setPlanes] = useState<{ id: string; nombre: string; activo: boolean }[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(planActivo?.id ?? null);
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [paginasPreview, setPaginasPreview] = useState<PaginaPreview[]>([]);
  const [displayOverrides, setDisplayOverrides] = useState<DisplayOverrides>({});
  const [appliedOverrides, setAppliedOverrides] = useState<DisplayOverrides>({});
  const [ordenPersonalizado, setOrdenPersonalizado] = useState(false);
  const numeroRecetasPlan = pdfData ? extraerRecetasDelPlan(pdfData.dias).length : 0;

  // Cargar la lista de planes del paciente
  useEffect(() => {
    getPlanesPaciente(pacienteId).then((list) => {
      const mapped = list.map((p) => ({ id: p.id, nombre: p.nombre, activo: p.activo }));
      setPlanes(mapped);
      if (!selectedPlanId && mapped.length > 0) {
        const activo = mapped.find((p) => p.activo);
        setSelectedPlanId(activo?.id ?? mapped[0].id);
      }
    }).catch(() => {});
  }, [pacienteId]);

  // Cargar datos del PDF cuando cambia el plan seleccionado
  useEffect(() => {
    if (!selectedPlanId) { setPdfData(null); return; }
    let cancelled = false;
    setLoadingPdf(true);
    setDisplayOverrides({});
    setAppliedOverrides({});
    getPlanPDFData(selectedPlanId).then((data) => {
      if (cancelled) return;
      setPdfData(data);
      if (!data || extraerRecetasDelPlan(data.dias).length === 0) {
        setPdfOptions((prev) => ({ ...prev, recetasDelPlan: false }));
        setAppliedOptions((prev) => ({ ...prev, recetasDelPlan: false }));
      }
      setLoadingPdf(false);
    }).catch(() => {
      if (!cancelled) setLoadingPdf(false);
    });
    return () => { cancelled = true; };
  }, [selectedPlanId]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const paginaActualPreview = paginasPreview[previewPage] ?? {
    ancho: 794,
    alto: 1123,
    arriba: previewPage * 1123,
  };
  const anchoPaginaPreview = paginaActualPreview.ancho;
  const anchoMaximoPreview = Math.max(794, ...paginasPreview.map((pagina) => pagina.ancho));
  const altoTotalPreview = paginasPreview.length > 0
    ? paginasPreview[paginasPreview.length - 1].arriba + paginasPreview[paginasPreview.length - 1].alto
    : Math.max(totalPages, 1) * 1123;
  const anchoPaginaEscalado = anchoPaginaPreview * previewScale;
  const altoPaginaEscalado = paginaActualPreview.alto * previewScale;

  // Aprovechar el mayor tamaño posible sin recortar la hoja: las horizontales llenan el ancho
  // disponible y las verticales se ajustan por altura dentro del mismo espacio estable.
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const update = () => setPreviewScale(Math.min(
      el.clientWidth / anchoPaginaPreview,
      el.clientHeight / paginaActualPreview.alto,
    ));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pdfHtml, anchoPaginaPreview, paginaActualPreview.alto]);

  function toSections(opts: PDFOptions): PDFSectionOptions {
    return {
      portada: opts.portada,
      planSemanal: opts.planSemanal,
      cantidadesSemanal: opts.cantidadesSemanal,
      detalleDiario: opts.detalleDiario,
      recomendaciones: opts.recomendaciones,
      listaCompra: opts.listaCompra,
      valoresNutricionales: opts.valoresNutricionales,
      recetasDelPlan: opts.recetasDelPlan,
      valoresNutricionalesRecetas: opts.valoresNutricionalesRecetas,
      distribucionRecetas: opts.distribucionRecetas,
      densidad: opts.densidad,
      planSemanalHorizontal: opts.planSemanalHorizontal,
      listaCompraHorizontal: opts.listaCompraHorizontal,
      ordenSecciones: opts.ordenSecciones,
    };
  }

  // Regenerate PDF HTML when data o opciones aplicadas cambian (no cuando cambia pdfOptions/overrides en edición)
  useEffect(() => {
    if (!pdfData) { setPdfHtml(null); return; }
    const html = generatePlanPDF({ ...pdfData, sections: toSections(appliedOptions), displayOverrides: appliedOverrides }, tPdf);
    const previewHtml = html.replace(/<script[\s\S]*?<\/script>/gi, "");
    setPdfHtml(previewHtml);
    const count = (previewHtml.match(/class="page/g) || []).length;
    setTotalPages(Math.max(1, count));
    setPaginasPreview([]);
    setPreviewPage(0);
  }, [pdfData, appliedOptions, appliedOverrides]);

  // ¿Hay cambios sin aplicar?
  const hasUnappliedChanges =
    JSON.stringify(pdfOptions) !== JSON.stringify(appliedOptions) ||
    JSON.stringify(displayOverrides) !== JSON.stringify(appliedOverrides);


  function handlePdfOptionChange(key: PDFOptionBooleana, value: boolean) {
    setPdfOptions((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "planSemanal" && !value) next.cantidadesSemanal = false;
      return next;
    });
  }

  const [downloading, setDownloading] = useState(false);

  async function handlePDFDownload() {
    if (!pdfData) {
      toast.error(t("sinPlanActivoSeleccionado"));
      return;
    }
    setDownloading(true);
    try {
      const html = generatePlanPDF({ ...pdfData, sections: toSections(pdfOptions), displayOverrides }, tPdf);
      const nombre = pdfData.pacienteNombre.replace(/\s+/g, "-");
      await downloadPDF(html, `Plan-${nombre}.pdf`);
    } catch {
      toast.error(t("errorDescargarPdf"));
    } finally {
      setDownloading(false);
    }
  }

  function handleEnviarPlan() {
    if (!selectedPlanId) {
      toast.error(t("sinPlanActivoSeleccionado"));
      return;
    }
    if (!pacienteEmail) {
      toast.error(t("sinEmailRegistrado"));
      return;
    }
    startSendingPlan(async () => {
      const res = await enviarPlanPorEmail(pacienteId, selectedPlanId, toSections(pdfOptions), displayOverrides);
      if (res.ok) {
        toast.success(t("planEnviadoEmail"));
      } else {
        toast.error(res.error || t("errorEnviarPlan"));
      }
    });
  }


  return (
    <div className="space-y-6">
      {/* Section 1: Generar entregable */}
      <div>
        {planes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("sinPlanesEntregables")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            {/* Right column: PDF options */}
            <div className="rounded-xl border border-border bg-card p-5 lg:order-2">
              {/* Selector de plan */}
              <div className="mb-5 pb-5 border-b border-border">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  {t("planAlimenticio")}
                </label>
                <SelectorDesplegable
                  value={selectedPlanId ?? ""}
                  onChange={setSelectedPlanId}
                  options={planes.map((plan) => ({
                    value: plan.id,
                    label: plan.nombre,
                    insignia: plan.activo ? t("planActualLabel") : undefined,
                    insigniaClassName: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
                  }))}
                  ariaLabel={t("planAlimenticio")}
                  menuLabel={t("planAlimenticio")}
                />
              </div>

              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  {t("contenidoPdf")}
                </h3>
                <button
                  type="button"
                  aria-pressed={ordenPersonalizado}
                  onClick={() => setOrdenPersonalizado((actual) => !actual)}
                  className={cn(
                    "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                    ordenPersonalizado
                      ? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
                      : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
                  {ordenPersonalizado ? t("guardarOrden") : t("personalizarOrdenBoton")}
                </button>
              </div>
              {ocultarCalorias && (
                <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-3">
                  <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    {t("ocultarCaloriasAviso")}
                  </p>
                </div>
              )}

              <div className="space-y-1">
                {ordenPersonalizado ? (
                  <OrdenSeccionesPdf
                    orden={pdfOptions.ordenSecciones}
                    recetasDisponibles={numeroRecetasPlan > 0}
                    recetasCount={numeroRecetasPlan}
                    onChange={(orden) => setPdfOptions((previa) => ({ ...previa, ordenSecciones: orden }))}
                  />
                ) : PDF_OPTIONS_KEYS.map((opt) => {
                  const isDisabled = opt.disabled || (opt.key === "cantidadesSemanal" && !pdfOptions.planSemanal);
                  const permiteHorizontal = opt.key === "planSemanal" || opt.key === "listaCompra";
                  const horizontalActivo = opt.key === "planSemanal"
                    ? pdfOptions.planSemanalHorizontal
                    : pdfOptions.listaCompraHorizontal;
                  return (
                  <div
                    key={opt.key}
                    className="flex items-start gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-muted/40"
                  >
                    <label className={cn(
                      "flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-lg px-2 py-1.5",
                      isDisabled && "cursor-not-allowed opacity-60",
                    )}>
                      <input
                        type="checkbox"
                        checked={pdfOptions[opt.key]}
                        disabled={isDisabled}
                        onChange={(e) =>
                          handlePdfOptionChange(opt.key, e.target.checked)
                        }
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary accent-primary focus:ring-primary/20"
                      />
                      <span className="min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {t(opt.labelKey)}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {t(opt.descriptionKey)}
                        </span>
                      </span>
                    </label>
                    {permiteHorizontal && (
                      <button
                        type="button"
                        disabled={isDisabled || !pdfOptions[opt.key]}
                        aria-pressed={horizontalActivo}
                        onClick={() => setPdfOptions((previa) => ({
                          ...previa,
                          [opt.key === "planSemanal" ? "planSemanalHorizontal" : "listaCompraHorizontal"]: !horizontalActivo,
                        }))}
                        className={cn(
                          "mt-1 inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                          horizontalActivo
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted",
                          (isDisabled || !pdfOptions[opt.key]) && "cursor-not-allowed opacity-40",
                        )}
                        title={t(horizontalActivo ? "quitarHorizontal" : "ponerHorizontal")}
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">{t("horizontal")}</span>
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>

              {!ordenPersonalizado && numeroRecetasPlan > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-card p-3">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={pdfOptions.recetasDelPlan}
                      onChange={(evento) => handlePdfOptionChange("recetasDelPlan", evento.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary focus:ring-primary/20"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {t("recetasDelPlan", { count: numeroRecetasPlan })}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {t("recetasDelPlanDescripcion")}
                      </span>
                    </span>
                  </label>

                  {pdfOptions.recetasDelPlan && (
                    <div className="mt-3 space-y-3 border-t border-border pt-3">
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg px-1 py-1.5 transition-colors hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={pdfOptions.valoresNutricionalesRecetas}
                          onChange={(evento) => handlePdfOptionChange("valoresNutricionalesRecetas", evento.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary focus:ring-primary/20"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-foreground">{tRecetario("macros")}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{tRecetario("macrosDescripcion")}</span>
                        </span>
                      </label>

                      <fieldset className="border-t border-border pt-3">
                        <legend className="text-sm font-medium text-foreground">{tRecetario("distribucionTitulo")}</legend>
                        <p className="mt-1 text-xs text-muted-foreground">{tRecetario("distribucionAyuda")}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {["automatica", "unaPorPagina"].map((distribucion) => {
                            const valor = distribucion as DistribucionRecetarioPDF;
                            const seleccionada = pdfOptions.distribucionRecetas === valor;
                            return (
                              <label
                                key={valor}
                                className={cn(
                                  "flex min-h-11 cursor-pointer items-start gap-2.5 rounded-lg border p-3 transition-colors",
                                  seleccionada
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/50",
                                )}
                              >
                                <input
                                  type="radio"
                                  name="distribucion-recetas-plan"
                                  value={valor}
                                  checked={seleccionada}
                                  onChange={() => setPdfOptions((previa) => ({ ...previa, distribucionRecetas: valor }))}
                                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary focus:ring-primary/20"
                                />
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-foreground">
                                    {tRecetario(valor === "automatica" ? "distribucionAutomatica" : "unaPorPagina")}
                                  </span>
                                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                                    {tRecetario(valor === "automatica" ? "distribucionAutomaticaDescripcion" : "unaPorPaginaDescripcion")}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    </div>
                  )}
                </div>
              )}

              {!ordenPersonalizado && (
                <label className="mt-4 flex cursor-pointer items-center gap-3 border-t border-border px-2 pt-4">
                  <input
                    type="checkbox"
                    checked={pdfOptions.densidad === "compacta"}
                    onChange={(evento) => setPdfOptions((previa) => ({
                      ...previa,
                      densidad: evento.target.checked ? "compacta" : "normal",
                    }))}
                    className="h-4 w-4 shrink-0 rounded border-border accent-primary focus:ring-primary/20"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{t("pdfCompacto")}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{t("pdfCompactoDescripcion")}</span>
                  </span>
                </label>
              )}

              {/* Editor de cantidades */}
              {pdfData && !loadingPdf && (
                <div className="mt-5 pt-4 border-t border-border">
                  <QuantityEditor
                    pdfData={pdfData}
                    overrides={displayOverrides}
                    onChange={setDisplayOverrides}
                  />
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-border space-y-3">
                {/* Botón generar — aplica las opciones actuales a la vista previa */}
                <button
                  type="button"
                  onClick={() => { setAppliedOptions(pdfOptions); setAppliedOverrides(displayOverrides); }}
                  disabled={!hasUnappliedChanges}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                    hasUnappliedChanges
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  {hasUnappliedChanges ? t("generarVistaPrevia") : t("vistaPreviaActualizada")}
                </button>

                <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleEnviarPlan}
                  disabled={sendingPlan || !pdfHtml || !pacienteEmail}
                  title={!pacienteEmail ? t("sinEmailRegistrado") : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                    pdfHtml && pacienteEmail
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {sendingPlan ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  {t("enviarPorEmail")}
                </button>
                <button
                  type="button"
                  onClick={handlePDFDownload}
                  disabled={!pdfHtml || downloading}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
                    pdfHtml && !downloading
                      ? "border-border hover:bg-muted"
                      : "border-border/50 text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {t("descargarPdf")}
                </button>
                </div>

                {/* #40 — Entregar el caso con ESTE PDF, con las secciones que tiene puestas aquí. */}
                {casoEntrega && (casoEntrega.estado === "EN_MARCHA" || casoEntrega.estado === "ENTREGADA") && (
                  <div className="pt-3 border-t border-border">
                    <EntregarCaso
                      asignacionId={casoEntrega.asignacionId}
                      planes={casoEntrega.planes}
                      reentrega={casoEntrega.estado === "ENTREGADA"}
                      etiqueta={casoEntrega.estado === "ENTREGADA" ? tAula("casos.volverAEntregar") : tAula("casos.entregarAlProfesor")}
                      opcionesPdf={{ planId: selectedPlanId, sections: toSections(pdfOptions), displayOverrides }}
                    />
                  </div>
                )}

                <Link
                  href="/ajustes#documentos"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Palette className="w-3.5 h-3.5" />
                  {t("personalizarEntregables")}
                </Link>
              </div>
            </div>

            {/* Left column: PDF preview */}
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col lg:order-1 lg:sticky lg:top-6 lg:self-start">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  {t("vistaPrevia")}
                </h3>
              </div>

              {loadingPdf ? (
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : pdfHtml ? (
                <div className="flex-1 flex flex-col items-center">
                  {/* Espacio estable para una página visible, sea vertical u horizontal */}
                  <div
                    ref={previewContainerRef}
                    className="relative aspect-[794/1123] w-full overflow-hidden lg:h-[calc(100vh-200px)] lg:aspect-auto"
                  >
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                      {/* Reserva el tamaño visual de la hoja activa para poder centrarla sin mover
                          el área exterior ni la navegación. */}
                      <div
                        className="shrink-0 overflow-hidden rounded-lg bg-white shadow-xl ring-2 ring-inset ring-border"
                        style={{
                          width: `${anchoPaginaEscalado}px`,
                          height: `${altoPaginaEscalado}px`,
                        }}
                      >
                        <div
                          className="overflow-hidden bg-white"
                          style={{
                            width: `${anchoPaginaPreview}px`,
                            height: `${paginaActualPreview.alto}px`,
                            transform: `scale(${previewScale})`,
                            transformOrigin: "top left",
                          }}
                        >
                          {/* La tira completa se desplaza dentro de una ventana que mide exactamente
                              una hoja; por eso nunca asoma la página siguiente. */}
                          <div
                            style={{
                              width: `${anchoMaximoPreview}px`,
                              height: `${altoTotalPreview}px`,
                              transform: `translateY(-${paginaActualPreview.arriba}px)`,
                              transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                            }}
                          >
                            <iframe
                              ref={iframeRef}
                              srcDoc={pdfHtml}
                              title={t("vistaPreviaPdf")}
                              className="border-0 block"
                              sandbox="allow-same-origin"
                              scrolling="no"
                              style={{
                                width: `${anchoMaximoPreview}px`,
                                height: `${altoTotalPreview}px`,
                                pointerEvents: "none",
                              }}
                              onLoad={() => {
                                const iframe = iframeRef.current;
                                if (!iframe) return;
                                try {
                                  const doc = iframe.contentDocument;
                                  if (!doc) return;
                                  const styleId = "preview-page-delim";
                                  let style = doc.getElementById(styleId) as HTMLStyleElement | null;
                                  if (!style) {
                                    style = doc.createElement("style");
                                    style.id = styleId;
                                    doc.head.appendChild(style);
                                  }
                                // Sin altura fija: cada bloque .page crece según su contenido para
                                // NO recortar (antes se perdían los valores nutricionales al final
                                // de un día con mucho contenido).
                                style.textContent = `
                                  html, body { margin: 0; padding: 0; background: white; overflow: hidden; }
                                  .page {
                                    margin: 0 !important;
                                    min-height: 0 !important;
                                    width: 794px !important;
                                    background: white;
                                    box-sizing: border-box;
                                    overflow: hidden;
                                  }
                                  .page.pdf-pagina-plan-semanal-horizontal,
                                  .page.pdf-pagina-lista-compra-horizontal { width: 1123px !important; }
                                  .page.cover { justify-content: center; }
                                `;
                                const pages = Array.from(doc.querySelectorAll<HTMLElement>(".page"));
                                const paginasCalculadas: PaginaPreview[] = [];
                                let arriba = 0;
                                for (const page of pages) {
                                  const horizontal = page.classList.contains("pdf-pagina-plan-semanal-horizontal")
                                    || page.classList.contains("pdf-pagina-lista-compra-horizontal");
                                  const ancho = horizontal ? 1123 : 794;
                                  const alto = horizontal ? 794 : 1123;
                                  const PAGE_H = alto;
                                  page.style.width = `${ancho}px`;
                                  page.style.height = "auto";
                                  // El generador ya entrega cada página física como un bloque `.page`.
                                  // La preview solo fija sus dimensiones para mostrar el mismo paquete
                                  // de contenido que recibirá Chromium al descargar el PDF.
                                  const needed = Math.max(1, Math.ceil((page.scrollHeight - 4) / PAGE_H));
                                  page.style.height = `${needed * PAGE_H}px`;
                                  for (let indice = 0; indice < needed; indice++) {
                                    paginasCalculadas.push({ ancho, alto, arriba });
                                    arriba += alto;
                                  }
                                }
                                if (paginasCalculadas.length > 0) {
                                  setPaginasPreview(paginasCalculadas);
                                  setTotalPages(paginasCalculadas.length);
                                }
                                } catch {
                                  // cross-origin safety
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page navigation */}
                  {totalPages > 1 && (
                    <div className="flex h-14 shrink-0 items-center justify-center gap-3 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setPreviewPage(Math.max(0, previewPage - 1))}
                        disabled={previewPage === 0}
                        className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {previewPage + 1} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewPage(Math.min(totalPages - 1, previewPage + 1))}
                        disabled={previewPage >= totalPages - 1}
                        className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center min-h-[400px] rounded-lg border border-dashed border-border bg-muted/20">
                  <p className="text-sm text-muted-foreground text-center">
                    {t("noSePudoCargarVistaPrevia")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
