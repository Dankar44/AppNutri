"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import {
  Mail,
  Smartphone,
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { enviarPlanPorEmail, enviarAccesoPortal } from "@/app/actions/email";
import { crearAccesoPaciente, getAccesoEstado } from "@/app/actions/paciente-auth";
import { getPlanPDFData } from "@/app/actions/planes";
import { generatePlanPDF, type PlanPDFData } from "@/lib/pdf/generate-plan-pdf";
import { Shield, Check } from "lucide-react";

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
  micronutrientes: boolean;
  horarioPaciente: boolean;
};

const PDF_OPTIONS_DEFAULT: PDFOptions = {
  portada: true,
  planSemanal: true,
  detalleDiario: true,
  recomendaciones: true,
  listaCompra: true,
  valoresNutricionales: true,
  micronutrientes: true,
  horarioPaciente: false,
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
  { key: "micronutrientes", label: "Micronutrientes", description: "Detalle de vitaminas y minerales" },
  { key: "horarioPaciente", label: "Horario del paciente", description: "Incluye los horarios habituales del paciente" },
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
            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
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
  const [sendingAcceso, startSendingAcceso] = useTransition();
  const [accesoEstado, setAccesoEstado] = useState<{ email: string; activo: boolean; tienePassword: boolean; perfilCompleto: boolean } | null>(null);
  const [pinEmail, setPinEmail] = useState(pacienteEmail || "");
  const [generatingPin, setGeneratingPin] = useState(false);
  const [pinGenerado, setPinGenerado] = useState<string | null>(null);

  // PDF configurator state
  const [pdfOptions, setPdfOptions] = useState<PDFOptions>(PDF_OPTIONS_DEFAULT);
  const [pdfData, setPdfData] = useState<PlanPDFData | null>(null);
  const [pdfHtml, setPdfHtml] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadAcceso = useCallback(async () => {
    const estado = await getAccesoEstado(pacienteId);
    setAccesoEstado(estado);
    if (estado?.email) setPinEmail(estado.email);
  }, [pacienteId]);

  useEffect(() => { loadAcceso(); }, [loadAcceso]);

  // Load PDF data when plan exists
  useEffect(() => {
    if (!planActivo) return;
    let cancelled = false;
    setLoadingPdf(true);
    getPlanPDFData(planActivo.id).then((data) => {
      if (cancelled) return;
      setPdfData(data);
      setLoadingPdf(false);
    }).catch(() => {
      if (!cancelled) setLoadingPdf(false);
    });
    return () => { cancelled = true; };
  }, [planActivo]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Regenerate PDF HTML when options or data change
  useEffect(() => {
    if (!pdfData) { setPdfHtml(null); return; }
    const html = generatePlanPDF(pdfData);
    // Remove the auto-print script for preview purposes
    const previewHtml = html.replace(
      /<script>window\.onload=function\(\)\{window\.print\(\);\}<\/script>/,
      ""
    );
    setPdfHtml(previewHtml);
    // Count pages by counting .page divs
    const count = (previewHtml.match(/class="page/g) || []).length;
    setTotalPages(Math.max(1, count));
    setPreviewPage(0);
  }, [pdfData, pdfOptions]);

  // Scroll iframe to correct page when previewPage changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const pages = doc.querySelectorAll(".page");
      if (pages[previewPage]) {
        pages[previewPage].scrollIntoView({ behavior: "instant" });
      }
    } catch {
      // cross-origin or not loaded yet
    }
  }, [previewPage]);

  function handlePdfOptionChange(key: keyof PDFOptions, value: boolean) {
    setPdfOptions((prev) => ({ ...prev, [key]: value }));
  }

  function handlePDFDownload() {
    if (!pdfData) {
      toast.error("No hay un plan activo para exportar");
      return;
    }
    // Generate with print script for actual PDF export
    const printHtml = generatePlanPDF(pdfData);
    const ventana = window.open("", "_blank");
    if (!ventana) return;
    ventana.document.write(printHtml);
    ventana.document.close();
  }

  function handleEnviarPlan() {
    if (!planActivo) {
      toast.error("No hay un plan activo para enviar");
      return;
    }
    if (!pacienteEmail) {
      toast.error("El paciente no tiene email registrado");
      return;
    }
    startSendingPlan(async () => {
      const res = await enviarPlanPorEmail(pacienteId, planActivo.id);
      if (res.ok) {
        toast.success("Plan enviado por email correctamente");
      } else {
        toast.error(res.error || "Error al enviar el plan");
      }
    });
  }

  function handleEnviarAcceso() {
    if (!pacienteEmail) {
      toast.error("El paciente no tiene email registrado");
      return;
    }
    startSendingAcceso(async () => {
      const res = await enviarAccesoPortal(pacienteId);
      if (res.ok) {
        toast.success("Instrucciones de acceso enviadas por email");
      } else {
        toast.error(res.error || "Error al enviar las instrucciones");
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
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Generar entregable
            </h2>
            {planActivo ? (
              <p className="text-sm text-muted-foreground mt-0.5">
                {planActivo.nombre}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">
                No hay un plan activo asignado
              </p>
            )}
          </div>
        </div>

        {!planActivo ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Asigna un plan activo al paciente para poder generar entregables
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            {/* Left column: PDF options */}
            <div className="rounded-xl border border-border bg-card p-5">
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
                      className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20 shrink-0"
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

              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleEnviarPlan}
                  disabled={sendingPlan || !pdfHtml || !pacienteEmail}
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
            </div>

            {/* Right column: PDF preview */}
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col">
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
                <div className="flex-1 flex flex-col">
                  {/* Scaled PDF preview */}
                  <div
                    className="relative flex-1 bg-muted/30 rounded-lg overflow-hidden"
                    style={{ minHeight: "420px" }}
                  >
                    <div
                      className="absolute inset-0 flex items-start justify-center overflow-hidden"
                    >
                      <div
                        className="origin-top-left shadow-lg bg-white"
                        style={{
                          width: "794px",
                          height: "1123px",
                          transform: "scale(0.36)",
                          transformOrigin: "top center",
                        }}
                      >
                        <iframe
                          ref={iframeRef}
                          srcDoc={pdfHtml}
                          title="Vista previa del PDF"
                          className="w-full h-full border-0"
                          sandbox="allow-same-origin"
                          style={{
                            pointerEvents: "none",
                          }}
                          onLoad={() => {
                            // Scroll to the correct page on load
                            const iframe = iframeRef.current;
                            if (!iframe) return;
                            try {
                              const pages = iframe.contentDocument?.querySelectorAll(".page");
                              if (pages && pages[previewPage]) {
                                pages[previewPage].scrollIntoView();
                              }
                            } catch {
                              // cross-origin safety
                            }
                          }}
                        />
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

      {/* Section 2: Aplicacion para el cliente */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground mb-4">
          Aplicacion para el cliente
        </h2>

        {/* Send access instructions */}
        <div className="mb-5">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Enviar instrucciones de acceso al cliente
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleEnviarAcceso}
              disabled={sendingAcceso || !pacienteEmail}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors",
                pacienteEmail
                  ? "hover:bg-muted/60 cursor-pointer"
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950 dark:text-blue-400 shrink-0">
                {sendingAcceso ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Enviar por email
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pacienteEmail || "Sin email registrado"}
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled
              className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-left opacity-50 cursor-not-allowed"
            >
              <div className="rounded-lg bg-muted p-2.5 text-muted-foreground shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Enviar por mensaje
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Proximamente
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Estado del acceso */}
        {accesoEstado && (
          <div className="border-t border-border pt-4 mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              Estado del acceso
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{accesoEstado.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", accesoEstado.activo ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>
                  {accesoEstado.activo ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contraseña</span>
                <span className="font-medium">{accesoEstado.tienePassword ? "Configurada" : "Sin configurar"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Perfil</span>
                <span className="font-medium">{accesoEstado.perfilCompleto ? "Completado" : "Pendiente"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Regenerar PIN / Crear contraseña */}
        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold mb-3">
            {accesoEstado ? "Regenerar PIN" : "O genera una contraseña por ellos"}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email del paciente *</label>
              <input
                type="email"
                value={pinEmail}
                onChange={(e) => setPinEmail(e.target.value)}
                placeholder="email@ejemplo.com"
                maxLength={200}
                className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-[11px] text-muted-foreground mt-1">El paciente usará este email para hacer login</p>
            </div>
            <button
              type="button"
              disabled={generatingPin || !pinEmail.includes("@")}
              onClick={async () => {
                setGeneratingPin(true);
                try {
                  const pin = String(Math.floor(100000 + Math.random() * 900000));
                  await crearAccesoPaciente(pacienteId, pinEmail, pin);
                  setPinGenerado(pin);
                  await loadAcceso();
                  toast.success("PIN generado correctamente");
                } catch (e: any) {
                  toast.error(e?.message || "Error al generar PIN");
                } finally {
                  setGeneratingPin(false);
                }
              }}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {generatingPin ? "Generando..." : accesoEstado ? "Regenerar PIN" : "Crear contraseña"}
            </button>
            {pinGenerado && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-sm">PIN generado: <strong className="font-mono text-lg">{pinGenerado}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Examenes de laboratorio */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-950 dark:text-purple-400 shrink-0">
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
          <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-950 dark:text-amber-400 shrink-0">
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
