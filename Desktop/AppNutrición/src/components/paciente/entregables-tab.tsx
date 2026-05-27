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
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { enviarPlanPorEmail } from "@/app/actions/email";
import { getPlanPDFData, getPlanesPaciente } from "@/app/actions/planes";
import {
  generatePlanPDF,
  type PlanPDFData,
  type PDFSectionOptions,
  type DisplayOverrides,
  type QuantityOverride,
  UNIDAD_LABELS_FULL,
} from "@/lib/pdf/generate-plan-pdf";
import { downloadPDF } from "@/lib/pdf/pdf-download";

// ─── Types ───

interface EntregablesTabProps {
  pacienteId: string;
  pacienteEmail?: string | null;
  pacienteNombre: string;
  planActivo?: { id: string; nombre: string } | null;
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
};

const PDF_OPTIONS_DEFAULT: PDFOptions = {
  portada: true,
  planSemanal: true,
  cantidadesSemanal: false,
  detalleDiario: true,
  recomendaciones: true,
  listaCompra: true,
  valoresNutricionales: true,
};

const PDF_OPTIONS_KEYS: {
  key: keyof PDFOptions;
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
};

const UNIDADES = ["GRAMOS", "MILILITROS", "UNIDAD", "CUCHARADA", "CUCHARADITA", "TAZA", "REBANADA", "PIEZA"] as const;

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
              const key = `${dia.dia}-${comida.tipo}-${aIdx}`;
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
                      <div key={comida.tipo} className="px-3 py-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
                          {TIPO_KEYS[comida.tipo] ? t(TIPO_KEYS[comida.tipo]) : comida.tipo}
                        </p>
                        <div className="space-y-1.5">
                          {comida.alimentos.map((a, aIdx) => {
                            const key = `${dia.dia}-${comida.tipo}-${aIdx}`;
                            const ov = overrides[key];
                            const nombre = a.alimento?.nombre || a.receta?.nombre || "?";
                            const isModified = ov !== undefined;
                            const isLibre = ov?.libre === true;

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
                                      step="any"
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
                                    <select
                                      value={ov?.unidad ?? a.unidad}
                                      onChange={(e) => updateOverride(key, { unidad: e.target.value, libre: false })}
                                      className="w-24 px-1 py-0.5 rounded border border-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                                    >
                                      {UNIDADES.map((u) => (
                                        <option key={u} value={u}>{UNIDAD_LABELS_FULL[u]}</option>
                                      ))}
                                    </select>
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
}: EntregablesTabProps) {
  const t = useTranslations("patients.entregables");
  const tPdf = useTranslations("pdf");
  const [sendingPlan, startSendingPlan] = useTransition();

  // PDF configurator state
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>(PDF_OPTIONS_DEFAULT);
  const [appliedOptions, setAppliedOptions] = useState<PDFOptions>(PDF_OPTIONS_DEFAULT);
  const [pdfData, setPdfData] = useState<PlanPDFData | null>(null);
  const [planes, setPlanes] = useState<{ id: string; nombre: string; activo: boolean }[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(planActivo?.id ?? null);
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [displayOverrides, setDisplayOverrides] = useState<DisplayOverrides>({});
  const [appliedOverrides, setAppliedOverrides] = useState<DisplayOverrides>({});

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
      setLoadingPdf(false);
    }).catch(() => {
      if (!cancelled) setLoadingPdf(false);
    });
    return () => { cancelled = true; };
  }, [selectedPlanId]);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  // Ajustar escala de la vista previa al ancho del contenedor (794px = A4 a 96dpi)
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const update = () => setPreviewScale(el.clientWidth / 794);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pdfHtml]);

  function toSections(opts: PDFOptions): PDFSectionOptions {
    return {
      portada: opts.portada,
      planSemanal: opts.planSemanal,
      cantidadesSemanal: opts.cantidadesSemanal,
      detalleDiario: opts.detalleDiario,
      recomendaciones: opts.recomendaciones,
      listaCompra: opts.listaCompra,
      valoresNutricionales: opts.valoresNutricionales,
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
    setPreviewPage(0);
  }, [pdfData, appliedOptions, appliedOverrides]);

  // ¿Hay cambios sin aplicar?
  const hasUnappliedChanges =
    JSON.stringify(pdfOptions) !== JSON.stringify(appliedOptions) ||
    JSON.stringify(displayOverrides) !== JSON.stringify(appliedOverrides);


  function handlePdfOptionChange(key: keyof PDFOptions, value: boolean) {
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
                <select
                  value={selectedPlanId ?? ""}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}{p.activo ? ` ${t("planActualLabel")}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <h3 className="text-sm font-semibold text-foreground mb-4">
                {t("contenidoPdf")}
              </h3>
              <div className="space-y-1">
                {PDF_OPTIONS_KEYS.map((opt) => {
                  const isDisabled = opt.disabled || (opt.key === "cantidadesSemanal" && !pdfOptions.planSemanal);
                  return (
                  <label
                    key={opt.key}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      isDisabled
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-muted/50 cursor-pointer"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={pdfOptions[opt.key]}
                      disabled={isDisabled}
                      onChange={(e) =>
                        handlePdfOptionChange(opt.key, e.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20 shrink-0 accent-primary"
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        {t(opt.labelKey)}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t(opt.descriptionKey)}
                      </p>
                    </div>
                  </label>
                  );
                })}
              </div>

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
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col lg:order-1">
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
                  {/* A4 container con borde visible — una página visible a la vez */}
                  <div
                    ref={previewContainerRef}
                    className="relative bg-muted/30 rounded-lg overflow-hidden w-full border-2 border-border shadow-xl"
                    style={{ aspectRatio: "794 / 1123", maxHeight: "calc(100vh - 200px)", maxWidth: "calc((100vh - 200px) * 794 / 1123)" }}
                  >
                    <div className="absolute inset-0 overflow-hidden">
                      {/* Wrapper que se escala al ancho del contenedor */}
                      <div
                        className="absolute top-0 left-0 bg-card"
                        style={{
                          width: "794px",
                          height: "1123px",
                          transform: `scale(${previewScale})`,
                          transformOrigin: "top left",
                          overflow: "hidden",
                        }}
                      >
                        {/* Wrapper interno que se desplaza verticalmente para cambiar de página */}
                        <div
                          style={{
                            width: "794px",
                            height: `${Math.max(totalPages, 1) * 1123}px`,
                            transform: `translateY(-${previewPage * 1123}px)`,
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
                              width: "794px",
                              height: `${Math.max(totalPages, 1) * 1123}px`,
                              pointerEvents: "none",
                            }}
                            onLoad={() => {
                              const iframe = iframeRef.current;
                              if (!iframe) return;
                              try {
                                const doc = iframe.contentDocument;
                                if (!doc) return;
                                const styleId = "preview-page-delim";
                                if (!doc.getElementById(styleId)) {
                                  const style = doc.createElement("style");
                                  style.id = styleId;
                                  style.textContent = `
                                    html, body { margin: 0; padding: 0; background: white; overflow: hidden; }
                                    .page {
                                      margin: 0 !important;
                                      height: 1123px !important;
                                      min-height: 1123px !important;
                                      max-height: 1123px !important;
                                      width: 794px !important;
                                      background: white;
                                      box-sizing: border-box;
                                      overflow: hidden;
                                    }
                                    .page.cover { justify-content: center; }
                                  `;
                                  doc.head.appendChild(style);
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

                  {/* Page navigation */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-border">
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
