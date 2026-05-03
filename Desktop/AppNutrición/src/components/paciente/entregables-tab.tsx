"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  Mail,
  Palette,
  Plus,
  Info,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  FlaskConical,
  Settings2,
  Download,
  Eye,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { enviarPlanPorEmail } from "@/app/actions/email";
import { getPlanPDFData, getPlanesPaciente } from "@/app/actions/planes";
import { generatePlanPDF, type PlanPDFData, type PDFSectionOptions } from "@/lib/pdf/generate-plan-pdf";

// ─── Types ───

interface EntregablesTabProps {
  pacienteId: string;
  pacienteEmail?: string | null;
  pacienteNombre: string;
  planActivo?: { id: string; nombre: string } | null;
}

type PreferenciasPortal = {
  accesoApp: boolean;
  mensajes: boolean;
  registroPeso: boolean;
  confirmacionConsultas: boolean;
  diarioAlimentario: boolean;
  infoNutricional: boolean;
};

const PREFERENCIAS_DEFAULT: PreferenciasPortal = {
  accesoApp: true,
  mensajes: false,
  registroPeso: true,
  confirmacionConsultas: false,
  diarioAlimentario: true,
  infoNutricional: true,
};

const PREFERENCIAS_LABELS: {
  key: keyof PreferenciasPortal;
  label: string;
  description: string;
}[] = [
  {
    key: "accesoApp",
    label: "Acceso a la aplicacion movil",
    description:
      "Permite al paciente acceder al portal desde cualquier dispositivo",
  },
  {
    key: "mensajes",
    label: "Funcionalidad de mensajes",
    description: "Permite al paciente enviar y recibir mensajes",
  },
  {
    key: "registroPeso",
    label: "Funcionalidad de registro de peso",
    description: "Permite al paciente registrar su peso desde el portal",
  },
  {
    key: "confirmacionConsultas",
    label: "Confirmacion de consultas",
    description:
      "El paciente puede confirmar o cancelar consultas programadas",
  },
  {
    key: "diarioAlimentario",
    label: "Diario alimentario",
    description: "Permite al paciente llevar un registro diario de comidas",
  },
  {
    key: "infoNutricional",
    label: "Informacion nutricional",
    description:
      "Muestra informacion nutricional detallada en el plan alimentario",
  },
];

// ─── PDF Options ───

type PDFOptions = {
  portada: boolean;
  planSemanal: boolean;
  detalleDiario: boolean;
  recomendaciones: boolean;
  listaCompra: boolean;
  valoresNutricionales: boolean;
};

const PDF_OPTIONS_DEFAULT: PDFOptions = {
  portada: true,
  planSemanal: true,
  detalleDiario: true,
  recomendaciones: true,
  listaCompra: true,
  valoresNutricionales: true,
};

const PDF_OPTIONS_LABELS: {
  key: keyof PDFOptions;
  label: string;
  description: string;
  disabled?: boolean;
}[] = [
  { key: "portada", label: "Portada", description: "Pagina de presentacion con el nombre del paciente", disabled: true },
  { key: "planSemanal", label: "Plan semanal completo", description: "Tabla resumen con todas las comidas de la semana" },
  { key: "detalleDiario", label: "Detalle diario de comidas", description: "Desglose de cada dia con ingredientes y cantidades" },
  { key: "recomendaciones", label: "Recomendaciones", description: "Consejos y recomendaciones personalizadas para el paciente" },
  { key: "listaCompra", label: "Lista de la compra", description: "Lista de ingredientes organizada por categorias" },
  { key: "valoresNutricionales", label: "Valores nutricionales por comida", description: "Calorias, proteinas, carbohidratos y grasas por comida" },
];

// ─── Toggle Dropdown ───

function ToggleDropdown({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
          value
            ? "border-green-200 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
            : "border-border bg-muted/50 text-muted-foreground"
        )}
      >
        {value ? "Activada" : "Desactivada"}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-border bg-card shadow-lg">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors rounded-t-lg"
              onClick={() => {
                onChange(true);
                setOpen(false);
              }}
            >
              Activada
            </button>
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors rounded-b-lg"
              onClick={() => {
                onChange(false);
                setOpen(false);
              }}
            >
              Desactivada
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tooltip Icon ───

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md z-30">
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Main Component ───

export function EntregablesTab({
  pacienteId,
  pacienteEmail,
  pacienteNombre,
  planActivo,
}: EntregablesTabProps) {
  const [preferencias, setPreferencias] =
    useState<PreferenciasPortal>(PREFERENCIAS_DEFAULT);
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
      detalleDiario: opts.detalleDiario,
      recomendaciones: opts.recomendaciones,
      listaCompra: opts.listaCompra,
      valoresNutricionales: opts.valoresNutricionales,
    };
  }

  // Regenerate PDF HTML when data o opciones aplicadas cambian (no cuando cambia pdfOptions)
  useEffect(() => {
    if (!pdfData) { setPdfHtml(null); return; }
    const html = generatePlanPDF({ ...pdfData, sections: toSections(appliedOptions) });
    const previewHtml = html.replace(
      /<script>window\.onload=function\(\)\{window\.print\(\);\}<\/script>/,
      ""
    );
    setPdfHtml(previewHtml);
    const count = (previewHtml.match(/class="page/g) || []).length;
    setTotalPages(Math.max(1, count));
    setPreviewPage(0);
  }, [pdfData, appliedOptions]);

  // ¿Hay cambios sin aplicar?
  const hasUnappliedChanges = JSON.stringify(pdfOptions) !== JSON.stringify(appliedOptions);


  function handlePdfOptionChange(key: keyof PDFOptions, value: boolean) {
    setPdfOptions((prev) => ({ ...prev, [key]: value }));
  }

  function handlePDFDownload() {
    if (!pdfData) {
      toast.error("No hay un plan activo para exportar");
      return;
    }
    const printHtml = generatePlanPDF({ ...pdfData, sections: toSections(appliedOptions) });
    const ventana = window.open("", "_blank");
    if (!ventana) return;
    ventana.document.write(printHtml);
    ventana.document.close();
  }

  function handleEnviarPlan() {
    if (!selectedPlanId) {
      toast.error("No hay un plan seleccionado para enviar");
      return;
    }
    if (!pacienteEmail) {
      toast.error("El paciente no tiene email registrado");
      return;
    }
    startSendingPlan(async () => {
      const res = await enviarPlanPorEmail(pacienteId, selectedPlanId);
      if (res.ok) {
        toast.success("Plan enviado por email correctamente");
      } else {
        toast.error(res.error || "Error al enviar el plan");
      }
    });
  }


  function handlePreferenceChange(key: keyof PreferenciasPortal, value: boolean) {
    setPreferencias((prev) => ({ ...prev, [key]: value }));
    toast.success("Preferencia guardada");
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Generar entregable */}
      <div>
        {planes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Este paciente no tiene planes para generar entregables
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            {/* Right column: PDF options */}
            <div className="rounded-xl border border-border bg-card p-5 lg:order-2">
              {/* Selector de plan */}
              <div className="mb-5 pb-5 border-b border-border">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Plan alimenticio
                </label>
                <select
                  value={selectedPlanId ?? ""}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}{p.activo ? " (actual)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <h3 className="text-sm font-semibold text-foreground mb-4">
                Contenido del PDF
              </h3>
              <div className="space-y-1">
                {PDF_OPTIONS_LABELS.map((opt) => (
                  <label
                    key={opt.key}
                    className={cn(
                      "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                      opt.disabled
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-muted/50 cursor-pointer"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={pdfOptions[opt.key]}
                      disabled={opt.disabled}
                      onChange={(e) =>
                        handlePdfOptionChange(opt.key, e.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20 shrink-0 accent-primary"
                    />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        {opt.label}
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-border space-y-3">
                {/* Botón generar — aplica las opciones actuales a la vista previa */}
                <button
                  type="button"
                  onClick={() => setAppliedOptions(pdfOptions)}
                  disabled={!hasUnappliedChanges}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
                    hasUnappliedChanges
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Sparkles className="w-4 h-4" />
                  {hasUnappliedChanges ? "Generar vista previa" : "Vista previa actualizada"}
                </button>

                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnviarPlan}
                  disabled={sendingPlan || !pdfHtml || !pacienteEmail}
                  title={!pacienteEmail ? "El paciente no tiene email registrado" : undefined}
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
                  Enviar por email
                </button>
                <button
                  type="button"
                  onClick={handlePDFDownload}
                  disabled={!pdfHtml}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
                    pdfHtml
                      ? "border-border hover:bg-muted"
                      : "border-border/50 text-muted-foreground cursor-not-allowed"
                  )}
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
                </div>

                <Link
                  href="/ajustes#documentos"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                  <Palette className="w-3.5 h-3.5" />
                  Personalizar entregables
                </Link>
              </div>
            </div>

            {/* Left column: PDF preview */}
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col lg:order-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  Vista previa
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
                            title="Vista previa del PDF"
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
                    No se pudo cargar la vista previa
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Examenes de laboratorio */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 dark:bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400 dark:bg-purple-950 dark:text-purple-400 shrink-0">
              <FlaskConical className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-foreground">
              Examenes de laboratorio
            </h2>
          </div>
          <button
            type="button"
            disabled
            className="rounded-lg border border-dashed border-border p-2 text-muted-foreground hover:bg-muted transition-colors cursor-not-allowed opacity-50"
            title="Proximamente"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
          <FlaskConical className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Aun no ha solicitado examenes de laboratorio
          </p>
        </div>
      </div>

      {/* Section 4: Preferencias de la aplicacion del cliente */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 dark:bg-amber-950 dark:text-amber-400 shrink-0">
            <Settings2 className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-foreground">
            Preferencias de la aplicacion del cliente
          </h2>
        </div>

        <div className="divide-y divide-border">
          {PREFERENCIAS_LABELS.map((pref) => (
            <div
              key={pref.key}
              className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-foreground">
                  {pref.label}
                </span>
                <InfoTooltip text={pref.description} />
              </div>
              <ToggleDropdown
                value={preferencias[pref.key]}
                onChange={(v) => handlePreferenceChange(pref.key, v)}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
