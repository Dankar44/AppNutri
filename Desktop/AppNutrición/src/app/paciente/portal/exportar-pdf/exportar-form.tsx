"use client";

import { useState } from "react";
import { FileDown, UtensilsCrossed, Clock, ShoppingCart, MessageSquareText, Check } from "lucide-react";
import { generatePlanPDF, type PlanPDFData } from "@/lib/pdf/generate-plan-pdf";

interface HorarioEntry {
  dia: string;
  hora: string;
  actividad: string;
  color?: string;
  nota?: string;
}

interface Props {
  plan: PlanPDFData["dias"] extends (infer T)[] ? { nombre: string; dias: T[]; caloriasObjetivo?: number | null } : never;
  pacienteNombre: string;
  dietistaNombre: string;
  recomendaciones: string;
  horario: HorarioEntry[];
}

const DIAS_LABELS: Record<string, string> = {
  Lunes: "Lunes", Martes: "Martes", Miércoles: "Miércoles",
  Jueves: "Jueves", Viernes: "Viernes", Sábado: "Sábado", Domingo: "Domingo",
};

const HORAS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00",
];

const COLOR_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  trabajo: { label: "Trabajo", bg: "#dbeafe", text: "#1d4ed8" },
  ejercicio: { label: "Ejercicio", bg: "#dcfce7", text: "#16a34a" },
  comida: { label: "Comida", bg: "#fef3c7", text: "#d97706" },
  descanso: { label: "Descanso", bg: "#f3e8ff", text: "#7c3aed" },
  otro: { label: "Otro", bg: "#f3f4f6", text: "#374151" },
};

function generateHorarioHTML(horario: HorarioEntry[]): string {
  const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const horasConDatos = HORAS.filter((h) => horario.some((e) => e.hora === h));
  if (horasConDatos.length === 0) return "";

  let html = `<table style="width:100%;border-collapse:collapse;font-size:9px;margin-top:12px;">`;
  html += `<tr><th style="background:#16a34a;color:white;padding:6px;font-size:9px;">Hora</th>`;
  for (const d of dias) html += `<th style="background:#16a34a;color:white;padding:6px;font-size:9px;">${d}</th>`;
  html += `</tr>`;

  for (const hora of horasConDatos) {
    html += `<tr>`;
    html += `<td style="padding:4px 6px;border:1px solid #e5e5e5;font-weight:600;text-align:center;">${hora}</td>`;
    for (const dia of dias) {
      const entry = horario.find((e) => e.dia === dia && e.hora === hora);
      if (entry) {
        const c = COLOR_LABELS[entry.color || "otro"];
        html += `<td style="padding:3px 5px;border:1px solid #e5e5e5;background:${c.bg};color:${c.text};font-size:8px;">${entry.actividad}${entry.nota ? `<br><span style="opacity:0.7">${entry.nota}</span>` : ""}</td>`;
      } else {
        html += `<td style="border:1px solid #e5e5e5;"></td>`;
      }
    }
    html += `</tr>`;
  }
  html += `</table>`;
  return html;
}

export function ExportarPDFPaciente({ plan, pacienteNombre, dietistaNombre, recomendaciones, horario }: Props) {
  const [options, setOptions] = useState({
    dieta: true,
    horarioSemanal: horario.length > 0,
    listaCompra: true,
    recomendacionesIncluir: recomendaciones.length > 0,
  });

  function toggle(key: keyof typeof options) {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleGenerar() {
    // Build custom recomendaciones with optional horario
    let recoText = "";
    if (options.recomendacionesIncluir) recoText = recomendaciones;

    // Generate base PDF
    const html = generatePlanPDF({
      planNombre: plan.nombre,
      pacienteNombre,
      dietistaNombre,
      dias: options.dieta ? plan.dias : [],
      recomendaciones: recoText,
      caloriasObjetivo: plan.caloriasObjetivo,
    });

    // Inject horario section before </body> if selected
    let finalHtml = html;
    if (options.horarioSemanal && horario.length > 0) {
      const horarioPage = `<div class="page"><div class="header"><div><span class="header-name">${pacienteNombre.toUpperCase()}</span><br><span class="header-sub">PLAN DIETÉTICO SEMANAL</span></div><div class="header-logo">NutriApp</div></div><div class="section-title">MI HORARIO SEMANAL</div>${generateHorarioHTML(horario)}<div class="footer">NutriApp</div></div>`;
      finalHtml = finalHtml.replace("</body>", `${horarioPage}</body>`);
    }

    // Remove dieta pages if not selected (keep cover, reco, shopping, back)
    if (!options.dieta) {
      // The PDF generator already handles empty dias array
    }

    if (!options.listaCompra) {
      // Remove shopping list section
      finalHtml = finalHtml.replace(/LISTA DE LA COMPRA[\s\S]*?<div class="footer">NutriApp[^<]*<\/div><\/div>/g, "");
    }

    const ventana = window.open("", "_blank");
    if (!ventana) return;
    ventana.document.write(finalHtml);
    ventana.document.close();
  }

  const SECTIONS = [
    {
      key: "dieta" as const,
      icon: UtensilsCrossed,
      title: "Plan dietético semanal",
      desc: `${plan.nombre} — resumen semanal + detalle por día con ingredientes`,
      always: false,
    },
    {
      key: "horarioSemanal" as const,
      icon: Clock,
      title: "Horario semanal",
      desc: horario.length > 0 ? `${horario.length} actividades registradas` : "Sin horario configurado",
      always: false,
      disabled: horario.length === 0,
    },
    {
      key: "listaCompra" as const,
      icon: ShoppingCart,
      title: "Lista de la compra",
      desc: "Ingredientes agrupados por categoría con cantidades totales",
      always: false,
    },
    {
      key: "recomendacionesIncluir" as const,
      icon: MessageSquareText,
      title: "Recomendaciones del nutricionista",
      desc: recomendaciones ? `${recomendaciones.slice(0, 80)}...` : "Sin recomendaciones",
      always: false,
      disabled: !recomendaciones,
    },
  ];

  const anySelected = Object.values(options).some(Boolean);

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold mb-1">Contenido del PDF</h2>
        <p className="text-sm text-muted-foreground mb-4">Selecciona las secciones que quieres incluir</p>

        <div className="space-y-2">
          {SECTIONS.map((s) => {
            const checked = options[s.key];
            const disabled = s.disabled;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => !disabled && toggle(s.key)}
                disabled={disabled}
                className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                  disabled
                    ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                    : checked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.desc}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  checked ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                  {checked && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleGenerar}
        disabled={!anySelected}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
      >
        <FileDown className="w-5 h-5" />
        Generar PDF
      </button>
    </div>
  );
}
