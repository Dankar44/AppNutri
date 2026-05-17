"use client";

import { FileDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatQuantity } from "@/lib/pdf/generate-plan-pdf";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface DietaDia {
  dia: string;
  comidas: {
    tipo: string;
    alimentos: { nombre: string; cantidad: number; unidad?: string; enlaceProducto?: string | null; imagenUrl?: string | null }[];
  }[];
}

interface Branding {
  brandName?: string;
  linkColor?: string;
}

interface Props {
  branding?: Branding;
  paciente: {
    nombre: string;
    apellidos: string;
    email?: string | null;
    telefono?: string | null;
    peso?: number | null;
    altura?: number | null;
    objetivo: string;
  };
  medidas: {
    fecha: string;
    peso: number | null;
    imc: number | null;
    grasa: number | null;
  }[];
  consultas: {
    fecha: string;
    motivo: string | null;
    notas: string | null;
  }[];
  dieta?: { nombre: string; dias: DietaDia[] } | null;
}

const OBJETIVO_KEYS: Record<string, string> = {
  PERDER_PESO: "PERDER_PESO",
  GANAR_MASA: "GANAR_MASA",
  MANTENIMIENTO: "MANTENIMIENTO",
  PATOLOGIA: "PATOLOGIA",
  DEPORTIVO: "DEPORTIVO",
  OTRO: "OTRO",
};

function abrirVentanaPDF(titulo: string, contenidoHTML: string, brandName = "Annonia", footerDate = "") {
  const ventana = window.open("", "_blank");
  if (!ventana) return;

  ventana.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${titulo}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.5; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        .meta { color: #666; font-size: 13px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
        th, td { padding: 6px 10px; border: 1px solid #ddd; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .consulta { margin-bottom: 16px; padding: 10px; border: 1px solid #eee; border-radius: 6px; }
        .consulta-fecha { font-weight: 600; font-size: 14px; }
        .consulta-motivo { color: #666; font-size: 13px; }
        .consulta-notas { margin-top: 6px; font-size: 13px; white-space: pre-wrap; }
        .footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #ddd; padding-top: 10px; }
        @page { margin: 0; }
        @media print { body { margin: 20px; } }
      </style>
    </head>
    <body>
      ${contenidoHTML}
      <div class="footer">${brandName} &mdash; ${footerDate}<div style="color:#c0c8c3;font-size:8px;margin-top:2px;">annonia.com</div></div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  ventana.document.close();
}

const DIA_KEYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;
const TIPO_COMIDA_KEYS = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"] as const;

export function GenerarPDFButtons({ paciente, medidas, consultas, dieta, branding }: Props) {
  const t = useTranslations("reports");
  const brand = branding?.brandName || "Annonia";
  const linkCol = branding?.linkColor || "#6b9e80";
  function generarInformeEvolucion() {
    let html = `
      <h1>${escapeHtml(t("pdfContent.informeEvolucionTitulo"))}</h1>
      <p class="meta">
        <strong>${escapeHtml(paciente.nombre)} ${escapeHtml(paciente.apellidos)}</strong><br>
        ${escapeHtml(t("pdfContent.objetivo"))}: ${OBJETIVO_KEYS[paciente.objetivo] ? escapeHtml(t(`objetivoLabels.${OBJETIVO_KEYS[paciente.objetivo]}`)) : escapeHtml(paciente.objetivo)}
      </p>
    `;

    if (paciente.peso || paciente.altura) {
      html += `<h2>${escapeHtml(t("pdfContent.datosActuales"))}</h2><p>`;
      if (paciente.peso) html += `${escapeHtml(t("pdfContent.peso"))}: ${paciente.peso} kg<br>`;
      if (paciente.altura) html += `${escapeHtml(t("pdfContent.altura"))}: ${paciente.altura} cm`;
      html += `</p>`;
    }

    if (medidas.length > 0) {
      html += `<h2>${escapeHtml(t("pdfContent.historialMedidas"))}</h2>
        <table>
          <tr><th>${escapeHtml(t("pdfContent.fecha"))}</th><th>${escapeHtml(t("pdfContent.pesoKg"))}</th><th>${escapeHtml(t("pdfContent.imc"))}</th><th>${escapeHtml(t("pdfContent.porcentajeGrasa"))}</th></tr>
          ${medidas.map((m) => `
            <tr>
              <td>${m.fecha}</td>
              <td>${m.peso ?? "-"}</td>
              <td>${m.imc ?? "-"}</td>
              <td>${m.grasa ? m.grasa + "%" : "-"}</td>
            </tr>
          `).join("")}
        </table>`;
    }

    if (consultas.length > 0) {
      html += `<h2>${escapeHtml(t("pdfContent.historialConsultas"))}</h2>`;
      for (const c of consultas) {
        html += `<div class="consulta">
          <div class="consulta-fecha">${escapeHtml(c.fecha)}${c.motivo ? ` - ${escapeHtml(c.motivo)}` : ""}</div>
          ${c.notas ? `<div class="consulta-notas">${escapeHtml(c.notas)}</div>` : ""}
        </div>`;
      }
    }

    abrirVentanaPDF(
      `Evolución - ${paciente.nombre} ${paciente.apellidos}`,
      html,
      brand,
      escapeHtml(t("pdfContent.generadoEl", { fecha: new Date().toLocaleDateString() }))
    );
  }

  function generarFichaPaciente() {
    let html = `
      <h1>${escapeHtml(t("pdfContent.fichaPacienteTitulo"))}</h1>
      <h2>${escapeHtml(paciente.nombre)} ${escapeHtml(paciente.apellidos)}</h2>
      <p>
        ${paciente.email ? `${escapeHtml(t("pdfContent.email"))}: ${escapeHtml(paciente.email)}<br>` : ""}
        ${paciente.telefono ? `${escapeHtml(t("pdfContent.telefono"))}: ${escapeHtml(paciente.telefono)}<br>` : ""}
        ${escapeHtml(t("pdfContent.objetivo"))}: ${OBJETIVO_KEYS[paciente.objetivo] ? escapeHtml(t(`objetivoLabels.${OBJETIVO_KEYS[paciente.objetivo]}`)) : escapeHtml(paciente.objetivo)}<br>
        ${paciente.peso ? `${escapeHtml(t("pdfContent.peso"))}: ${paciente.peso} kg<br>` : ""}
        ${paciente.altura ? `${escapeHtml(t("pdfContent.altura"))}: ${paciente.altura} cm` : ""}
      </p>
    `;

    if (medidas.length > 0) {
      const ultima = medidas[medidas.length - 1];
      html += `<h2>${escapeHtml(t("pdfContent.ultimaMedicion", { fecha: ultima.fecha }))}</h2><p>`;
      if (ultima.peso) html += `${escapeHtml(t("pdfContent.peso"))}: ${ultima.peso} kg<br>`;
      if (ultima.imc) html += `${escapeHtml(t("pdfContent.imc"))}: ${ultima.imc}<br>`;
      if (ultima.grasa) html += `${escapeHtml(t("pdfContent.porcentajeGrasa"))}: ${ultima.grasa}%`;
      html += `</p>`;
    }

    abrirVentanaPDF(
      `Ficha - ${paciente.nombre} ${paciente.apellidos}`,
      html,
      brand,
      escapeHtml(t("pdfContent.generadoEl", { fecha: new Date().toLocaleDateString() }))
    );
  }

  function generarDietaSemanal() {
    if (!dieta) return;

    let html = `
      <h1>${escapeHtml(t("pdfContent.planAlimenticioSemanal"))}</h1>
      <p class="meta">
        <strong>${escapeHtml(paciente.nombre)} ${escapeHtml(paciente.apellidos)}</strong><br>
        ${escapeHtml(t("pdfContent.plan"))}: ${escapeHtml(dieta.nombre)}
      </p>
    `;

    for (const dia of dieta.dias) {
      html += `<h2>${DIA_KEYS.includes(dia.dia as typeof DIA_KEYS[number]) ? escapeHtml(t(`diaLabels.${dia.dia}`)) : escapeHtml(dia.dia)}</h2>`;
      for (const comida of dia.comidas) {
        if (comida.alimentos.length === 0) continue;
        html += `<p style="margin-bottom:2px;"><strong>${TIPO_COMIDA_KEYS.includes(comida.tipo as typeof TIPO_COMIDA_KEYS[number]) ? escapeHtml(t(`tipoComidaLabels.${comida.tipo}`)) : escapeHtml(comida.tipo)}</strong></p>`;
        html += `<table><tr><th>${escapeHtml(t("pdfContent.alimento"))}</th><th>${escapeHtml(t("pdfContent.cantidad"))}</th></tr>`;
        for (const a of comida.alimentos) {
          const imgLink = a.imagenUrl ? ` <a href="${escapeHtml(a.imagenUrl)}" target="_blank" style="color:#7c3aed;font-size:9px;text-decoration:underline;">${escapeHtml(t("pdfContent.verImagen"))}</a>` : "";
          const nombreHtml = a.enlaceProducto
            ? `<a href="${escapeHtml(a.enlaceProducto)}" target="_blank" style="color:${linkCol};text-decoration:underline;">${escapeHtml(a.nombre)}</a>${imgLink}`
            : `${escapeHtml(a.nombre)}${imgLink}`;
          html += `<tr><td>${nombreHtml}</td><td>${formatQuantity(a.cantidad, a.unidad || "GRAMOS")}</td></tr>`;
        }
        html += `</table>`;
      }
    }

    abrirVentanaPDF(
      t("pdfContent.dietaTitulo", { nombre: paciente.nombre, apellidos: paciente.apellidos }),
      html,
      brand,
      escapeHtml(t("pdfContent.generadoEl", { fecha: new Date().toLocaleDateString() }))
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={generarInformeEvolucion}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
      >
        <FileDown className="w-4 h-4" />
        {t("generarPdf.informeEvolucion")}
      </button>
      <button
        onClick={generarFichaPaciente}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
      >
        <FileDown className="w-4 h-4" />
        {t("generarPdf.fichaPaciente")}
      </button>
      {dieta && (
        <button
          onClick={generarDietaSemanal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
        >
          <FileDown className="w-4 h-4" />
          {t("generarPdf.dietaSemanal")}
        </button>
      )}
    </div>
  );
}
