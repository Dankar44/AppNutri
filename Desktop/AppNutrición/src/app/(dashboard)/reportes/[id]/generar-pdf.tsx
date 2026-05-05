"use client";

import { FileDown } from "lucide-react";
import { formatQuantity } from "@/lib/pdf/generate-plan-pdf";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface DietaDia {
  dia: string;
  comidas: {
    tipo: string;
    alimentos: { nombre: string; cantidad: number; unidad?: string; enlaceProducto?: string | null }[];
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

const OBJETIVO_LABELS: Record<string, string> = {
  PERDER_PESO: "Perder peso",
  GANAR_MASA: "Ganar masa muscular",
  MANTENIMIENTO: "Mantenimiento",
  PATOLOGIA: "Patología",
  DEPORTIVO: "Rendimiento deportivo",
  OTRO: "Otro",
};

function abrirVentanaPDF(titulo: string, contenidoHTML: string, brandName = "Annonia") {
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
      <div class="footer">${brandName} &mdash; Generado el ${new Date().toLocaleDateString("es-ES")}<div style="color:#c0c8c3;font-size:8px;margin-top:2px;">annonia.com</div></div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `);
  ventana.document.close();
}

const DIA_LABELS: Record<string, string> = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles",
  JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo",
};

const TIPO_COMIDA_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno", MEDIA_MANANA: "Media mañana", ALMUERZO: "Almuerzo",
  MERIENDA: "Merienda", CENA: "Cena", RECENA: "Recena",
};

export function GenerarPDFButtons({ paciente, medidas, consultas, dieta, branding }: Props) {
  const brand = branding?.brandName || "Annonia";
  const linkCol = branding?.linkColor || "#6b9e80";
  function generarInformeEvolucion() {
    let html = `
      <h1>Informe de Evolución</h1>
      <p class="meta">
        <strong>${escapeHtml(paciente.nombre)} ${escapeHtml(paciente.apellidos)}</strong><br>
        Objetivo: ${OBJETIVO_LABELS[paciente.objetivo] || escapeHtml(paciente.objetivo)}
      </p>
    `;

    if (paciente.peso || paciente.altura) {
      html += `<h2>Datos actuales</h2><p>`;
      if (paciente.peso) html += `Peso: ${paciente.peso} kg<br>`;
      if (paciente.altura) html += `Altura: ${paciente.altura} cm`;
      html += `</p>`;
    }

    if (medidas.length > 0) {
      html += `<h2>Historial de medidas</h2>
        <table>
          <tr><th>Fecha</th><th>Peso (kg)</th><th>IMC</th><th>% Grasa</th></tr>
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
      html += `<h2>Historial de consultas</h2>`;
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
      brand
    );
  }

  function generarFichaPaciente() {
    let html = `
      <h1>Ficha del Paciente</h1>
      <h2>${escapeHtml(paciente.nombre)} ${escapeHtml(paciente.apellidos)}</h2>
      <p>
        ${paciente.email ? `Email: ${escapeHtml(paciente.email)}<br>` : ""}
        ${paciente.telefono ? `Teléfono: ${escapeHtml(paciente.telefono)}<br>` : ""}
        Objetivo: ${OBJETIVO_LABELS[paciente.objetivo] || escapeHtml(paciente.objetivo)}<br>
        ${paciente.peso ? `Peso: ${paciente.peso} kg<br>` : ""}
        ${paciente.altura ? `Altura: ${paciente.altura} cm` : ""}
      </p>
    `;

    if (medidas.length > 0) {
      const ultima = medidas[medidas.length - 1];
      html += `<h2>Última medición (${ultima.fecha})</h2><p>`;
      if (ultima.peso) html += `Peso: ${ultima.peso} kg<br>`;
      if (ultima.imc) html += `IMC: ${ultima.imc}<br>`;
      if (ultima.grasa) html += `% Grasa: ${ultima.grasa}%`;
      html += `</p>`;
    }

    abrirVentanaPDF(
      `Ficha - ${paciente.nombre} ${paciente.apellidos}`,
      html,
      brand
    );
  }

  function generarDietaSemanal() {
    if (!dieta) return;

    let html = `
      <h1>Plan Alimenticio Semanal</h1>
      <p class="meta">
        <strong>${paciente.nombre} ${paciente.apellidos}</strong><br>
        Plan: ${dieta.nombre}
      </p>
    `;

    for (const dia of dieta.dias) {
      html += `<h2>${DIA_LABELS[dia.dia] || dia.dia}</h2>`;
      for (const comida of dia.comidas) {
        if (comida.alimentos.length === 0) continue;
        html += `<p style="margin-bottom:2px;"><strong>${TIPO_COMIDA_LABELS[comida.tipo] || comida.tipo}</strong></p>`;
        html += `<table><tr><th>Alimento</th><th>Cantidad</th></tr>`;
        for (const a of comida.alimentos) {
          const nombreHtml = a.enlaceProducto
            ? `<a href="${escapeHtml(a.enlaceProducto)}" target="_blank" style="color:${linkCol};text-decoration:underline;">${escapeHtml(a.nombre)}</a>`
            : escapeHtml(a.nombre);
          html += `<tr><td>${nombreHtml}</td><td>${formatQuantity(a.cantidad, a.unidad || "GRAMOS")}</td></tr>`;
        }
        html += `</table>`;
      }
    }

    abrirVentanaPDF(
      `Dieta - ${paciente.nombre} ${paciente.apellidos}`,
      html,
      brand
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={generarInformeEvolucion}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
      >
        <FileDown className="w-4 h-4" />
        Informe de evolución
      </button>
      <button
        onClick={generarFichaPaciente}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
      >
        <FileDown className="w-4 h-4" />
        Ficha del paciente
      </button>
      {dieta && (
        <button
          onClick={generarDietaSemanal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
        >
          <FileDown className="w-4 h-4" />
          Dieta semanal
        </button>
      )}
    </div>
  );
}
