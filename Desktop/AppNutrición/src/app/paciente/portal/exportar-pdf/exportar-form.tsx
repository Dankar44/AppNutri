"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { generatePlanPDF, type PlanPDFData, type PDFSectionOptions } from "@/lib/pdf/generate-plan-pdf";
import type { PdfColorTheme } from "@/lib/pdf/pdf-themes";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface HorarioEntry {
  dia: string;
  hora: string;
  actividad: string;
  color?: string;
  nota?: string;
}

interface Props {
  plan: PlanPDFData["dias"] extends (infer T)[]
    ? { nombre: string; dias: T[]; caloriasObjetivo?: number | null }
    : never;
  pacienteNombre: string;
  dietistaNombre: string;
  recomendaciones: string;
  horario: HorarioEntry[];
  tema?: PdfColorTheme;
  brandName?: string;
  logoDataUrl?: string;
  clinica?: string;
}

type PDFOptions = {
  portada: boolean;
  planSemanal: boolean;
  detalleDiario: boolean;
  recomendaciones: boolean;
  listaCompra: boolean;
  horarioPaciente: boolean;
};

const DEFAULT_OPTIONS: PDFOptions = {
  portada: true,
  planSemanal: true,
  detalleDiario: true,
  recomendaciones: true,
  listaCompra: true,
  horarioPaciente: false,
};

const OPTION_LABELS: {
  key: keyof PDFOptions;
  label: string;
  description: string;
  disabled?: boolean;
}[] = [
  { key: "portada", label: "Portada", description: "Página de presentación con tu nombre", disabled: true },
  { key: "planSemanal", label: "Plan semanal completo", description: "Tabla resumen con todas las comidas de la semana" },
  { key: "detalleDiario", label: "Detalle diario de comidas", description: "Desglose de cada día con ingredientes y cantidades" },
  { key: "recomendaciones", label: "Recomendaciones", description: "Consejos y recomendaciones personalizadas" },
  { key: "listaCompra", label: "Lista de la compra", description: "Ingredientes agrupados por categoría" },
  { key: "horarioPaciente", label: "Horario semanal", description: "Tu horario habitual de actividades" },
];

const HORAS = [
  "06:00","07:00","08:00","09:00","10:00","11:00","12:00",
  "13:00","14:00","15:00","16:00","17:00","18:00","19:00",
  "20:00","21:00","22:00","23:00",
];

const COLOR_LABELS: Record<string, { bg: string; text: string }> = {
  trabajo: { bg: "#dbeafe", text: "#1d4ed8" },
  ejercicio: { bg: "#dcfce7", text: "#16a34a" },
  comida: { bg: "#fef3c7", text: "#d97706" },
  descanso: { bg: "#f3e8ff", text: "#7c3aed" },
  otro: { bg: "#f3f4f6", text: "#374151" },
};

function generateHorarioHTML(horario: HorarioEntry[], pacienteNombre: string, brand = "Annonia") {
  const dias = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const horasConDatos = HORAS.filter((h) => horario.some((e) => e.hora === h));
  if (horasConDatos.length === 0) return "";

  let tabla = `<table style="width:100%;border-collapse:collapse;font-size:9px;margin-top:12px;">`;
  tabla += `<tr><th style="background:#16a34a;color:white;padding:6px;">Hora</th>`;
  for (const d of dias) tabla += `<th style="background:#16a34a;color:white;padding:6px;">${d}</th>`;
  tabla += `</tr>`;
  for (const hora of horasConDatos) {
    tabla += `<tr><td style="padding:4px 6px;border:1px solid #e5e5e5;font-weight:600;text-align:center;">${hora}</td>`;
    for (const dia of dias) {
      const entry = horario.find((e) => e.dia === dia && e.hora === hora);
      if (entry) {
        const c = COLOR_LABELS[entry.color || "otro"];
        tabla += `<td style="padding:3px 5px;border:1px solid #e5e5e5;background:${c.bg};color:${c.text};font-size:8px;">${escapeHtml(entry.actividad)}${entry.nota ? `<br><span style="opacity:0.7">${escapeHtml(entry.nota)}</span>` : ""}</td>`;
      } else {
        tabla += `<td style="border:1px solid #e5e5e5;"></td>`;
      }
    }
    tabla += `</tr>`;
  }
  tabla += `</table>`;

  return `<div class="page"><div class="header"><div><span class="header-name">${escapeHtml(pacienteNombre).toUpperCase()}</span><br><span class="header-sub">PLAN DIETÉTICO SEMANAL</span></div><div class="header-logo">${escapeHtml(brand)}</div></div><div class="section-title">MI HORARIO SEMANAL</div>${tabla}<div class="footer">${escapeHtml(brand)}<div style="color:#c0c8c3;font-size:8px;margin-top:2px;">annonia.com</div></div></div>`;
}

function toSections(options: PDFOptions): PDFSectionOptions {
  return {
    portada: options.portada,
    planSemanal: options.planSemanal,
    detalleDiario: options.detalleDiario,
    recomendaciones: options.recomendaciones,
    listaCompra: options.listaCompra,
  };
}

function applyHorario(html: string, options: PDFOptions, horarioHtml: string): string {
  if (options.horarioPaciente && horarioHtml) {
    return html.replace("</body>", `${horarioHtml}</body>`);
  }
  return html;
}

export function ExportarPDFPaciente({
  plan,
  pacienteNombre,
  dietistaNombre,
  recomendaciones,
  horario,
  tema,
  brandName,
  logoDataUrl,
  clinica,
}: Props) {
  const safeHorario = Array.isArray(horario) ? horario : [];
  const [options, setOptions] = useState<PDFOptions>(() => ({
    ...DEFAULT_OPTIONS,
    horarioPaciente: safeHorario.length > 0,
    recomendaciones: recomendaciones.length > 0,
  }));
  const [applied, setApplied] = useState<PDFOptions>(options);

  const horarioHtml = useMemo(
    () => generateHorarioHTML(safeHorario, pacienteNombre, brandName || "Annonia"),
    [safeHorario, pacienteNombre, brandName]
  );

  const previewHtml = useMemo(() => {
    const html = generatePlanPDF({
      planNombre: plan.nombre,
      pacienteNombre,
      dietistaNombre,
      dias: plan.dias,
      recomendaciones,
      caloriasObjetivo: plan.caloriasObjetivo,
      tema,
      brandName,
      logoDataUrl,
      clinica,
      sections: toSections(applied),
    });
    const withHorario = applyHorario(html, applied, horarioHtml);
    return withHorario.replace(/<script[\s\S]*?<\/script>/gi, "");
  }, [plan, pacienteNombre, dietistaNombre, recomendaciones, tema, brandName, logoDataUrl, clinica, applied, horarioHtml]);

  const totalPages = Math.max(1, (previewHtml.match(/class="page/g) || []).length);
  const [previewPage, setPreviewPage] = useState(0);
  useEffect(() => setPreviewPage(0), [previewHtml]);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const update = () => setPreviewScale(el.clientWidth / 794);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [previewHtml]);

  const hasUnappliedChanges = JSON.stringify(options) !== JSON.stringify(applied);

  function toggleOption(key: keyof PDFOptions) {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleDescargar() {
    const html = generatePlanPDF({
      planNombre: plan.nombre,
      pacienteNombre,
      dietistaNombre,
      dias: plan.dias,
      recomendaciones,
      caloriasObjetivo: plan.caloriasObjetivo,
      tema,
      brandName,
      logoDataUrl,
      clinica,
      sections: toSections(applied),
    });
    const withHorario = applyHorario(html, applied, horarioHtml);
    const ventana = window.open("", "_blank");
    if (!ventana) return;
    ventana.document.write(withHorario);
    ventana.document.close();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      {/* Opciones */}
      <div className="rounded-xl border border-border bg-card p-5 lg:order-2">
        <div className="mb-5 pb-5 border-b border-border">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Plan alimenticio
          </label>
          <div className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted/30 text-sm">
            {plan.nombre} <span className="text-muted-foreground">(actual)</span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-foreground mb-4">Contenido del PDF</h3>
        <div className="space-y-1">
          {OPTION_LABELS.map((opt) => {
            const noData =
              (opt.key === "horarioPaciente" && safeHorario.length === 0) ||
              (opt.key === "recomendaciones" && !recomendaciones);
            const disabled = opt.disabled || noData;
            return (
              <label
                key={opt.key}
                className={cn(
                  "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/50 cursor-pointer"
                )}
              >
                <input
                  type="checkbox"
                  checked={options[opt.key]}
                  disabled={disabled}
                  onChange={() => !disabled && toggleOption(opt.key)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/20 shrink-0 accent-primary"
                />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-border space-y-3">
          <button
            type="button"
            onClick={() => setApplied(options)}
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
          <button
            type="button"
            onClick={handleDescargar}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white hover:bg-green-700 px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col lg:order-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-muted-foreground" />
            Vista previa
          </h3>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div
            ref={previewContainerRef}
            className="relative bg-muted/30 rounded-lg overflow-hidden w-full border-2 border-border shadow-xl"
            style={{
              aspectRatio: "794 / 1123",
              maxHeight: "calc(100vh - 200px)",
              maxWidth: "calc((100vh - 200px) * 794 / 1123)",
            }}
          >
            <div className="absolute inset-0 overflow-hidden">
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
                <div
                  style={{
                    width: "794px",
                    height: `${totalPages * 1123}px`,
                    transform: `translateY(-${previewPage * 1123}px)`,
                    transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  <iframe
                    ref={iframeRef}
                    srcDoc={previewHtml}
                    title="Vista previa del PDF"
                    className="border-0 block"
                    sandbox="allow-same-origin"
                    scrolling="no"
                    style={{
                      width: "794px",
                      height: `${totalPages * 1123}px`,
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
                      } catch {}
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-border w-full">
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
      </div>
    </div>
  );
}
