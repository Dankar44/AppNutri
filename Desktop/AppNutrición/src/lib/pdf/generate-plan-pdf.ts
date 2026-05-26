import { generarListaCompra } from "@/lib/shopping-list";
import { calcularMacrosPorcion, sumarMacros, macrosVacios, convertirAGramos } from "@/lib/macros";
import { type PdfColorTheme, TEMAS_PDF } from "./pdf-themes";

import { UNIDAD_LABELS, UNIDAD_LABELS_FULL, formatQuantity } from "@/lib/units";
export { UNIDAD_LABELS, UNIDAD_LABELS_FULL, formatQuantity };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunc = (key: string, values?: Record<string, any>) => string;

const DIA_KEY_MAP: Record<string, string> = {
  LUNES: "lunes", MARTES: "martes", MIERCOLES: "miercoles",
  JUEVES: "jueves", VIERNES: "viernes", SABADO: "sabado", DOMINGO: "domingo",
};
const DIAS_ORDEN = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

const TIPO_KEY_MAP: Record<string, string> = {
  DESAYUNO: "desayuno", MEDIA_MANANA: "mediaManana", ALMUERZO: "almuerzo",
  MERIENDA: "merienda", CENA: "cena", RECENA: "recena",
};
const TIPOS_ORDEN = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"];

export interface QuantityOverride {
  cantidad?: number | null;
  unidad?: string | null;
  libre?: boolean;
}

export type DisplayOverrides = Record<string, QuantityOverride>;


function resolveDisplay(
  original: { cantidad: number; unidad: string },
  override: QuantityOverride | undefined,
  t: TFunc,
): string {
  if (!override) return formatQuantity(original.cantidad, original.unidad);
  if (override.libre) return t("planDietetico.libre");
  const qty = override.cantidad ?? original.cantidad;
  const unit = override.unidad ?? original.unidad;
  return formatQuantity(qty, unit);
}

function overrideKey(dia: string, tipo: string, idx: number): string {
  return `${dia}-${tipo}-${idx}`;
}

// Types
interface AlimentoEnComida {
  cantidad: number;
  unidad: string;
  alimento: {
    id: string; nombre: string; categoria: string;
    calorias: number; proteinas: number; carbohidratos: number; grasas: number; fibra: number; porcion: number;
    enlaceProducto?: string | null;
    imagenUrl?: string | null;
  } | null;
  receta: {
    id: string; nombre: string; descripcion?: string | null; instrucciones?: string | null;
    porciones: number; calorias: number; proteinas: number; carbohidratos: number; grasas: number;
    ingredientes: { alimento: { nombre: string }; cantidad: number; unidad: string }[];
  } | null;
}

interface Comida {
  tipo: string;
  descripcion?: string | null;
  alimentos: AlimentoEnComida[];
}

interface Dia {
  dia: string;
  comidas: Comida[];
}

export interface PDFSectionOptions {
  portada?: boolean;
  planSemanal?: boolean;
  detalleDiario?: boolean;
  recomendaciones?: boolean;
  listaCompra?: boolean;
  cantidadesSemanal?: boolean;
  valoresNutricionales?: boolean;
}

export interface PlanPDFData {
  planNombre: string;
  pacienteNombre: string;
  dietistaNombre: string;
  dias: Dia[];
  recomendaciones: string;
  caloriasObjetivo?: number | null;
  tema?: PdfColorTheme;
  brandName?: string;
  logoDataUrl?: string;
  clinica?: string;
  sections?: PDFSectionOptions;
  displayOverrides?: DisplayOverrides;
  locale?: string;
}

function generateCSS(t: PdfColorTheme): string {
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: ${t.textDark}; font-size: 11px; line-height: 1.4; }

  .page { page-break-after: always; padding: 30px 40px; min-height: 100vh; position: relative; }
  .page:last-child { page-break-after: avoid; }

  .header { background: ${t.primary}; color: white; padding: 8px 20px; display: flex; justify-content: space-between; align-items: center; margin: -30px -40px 20px; padding: 12px 40px; }
  .header-name { font-weight: 700; font-size: 13px; letter-spacing: 0.3px; }
  .header-sub { font-size: 10px; opacity: 0.9; }
  .header-logo { font-weight: 800; font-size: 16px; letter-spacing: -0.5px; }
  .header-logo-img { max-height: 28px; vertical-align: middle; }

  .section-title { background: ${t.sectionBg}; padding: 10px 20px; text-align: center; font-weight: 700; font-size: 14px; color: ${t.textMedium}; margin: 20px 0 16px; border-radius: 6px; border: 1px solid ${t.border}; }

  .day-title { background: ${t.dayHeaderBg}; color: ${t.dayHeaderText}; padding: 8px 16px; text-align: center; font-weight: 700; font-size: 13px; border-radius: 6px; margin-bottom: 12px; }

  /* Cover */
  .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; text-align: center; }
  .cover-box { background: ${t.lightBg}; border-radius: 16px; padding: 60px 80px; max-width: 500px; border: 1px solid ${t.borderLight}; }
  .cover-title { font-size: 28px; color: ${t.textMedium}; font-weight: 300; margin-bottom: 4px; }
  .cover-title strong { font-weight: 800; color: ${t.primary}; }
  .cover-name { background: ${t.primary}; color: white; padding: 8px 24px; font-weight: 700; font-size: 14px; margin-top: 16px; display: inline-block; letter-spacing: 0.5px; border-radius: 4px; }
  .cover-logo { margin-top: 60px; font-size: 24px; font-weight: 800; color: ${t.primary}; }
  .cover-logo-img { max-width: 180px; max-height: 80px; }
  .cover-platform { position: absolute; bottom: 40px; left: 0; right: 0; text-align: center; font-size: 18px; font-weight: 700; color: #c0c8c3; letter-spacing: 1px; }

  /* Summary table */
  .summary-table { width: 100%; border-collapse: collapse; font-size: 9px; }
  .summary-table th { background: ${t.primary}; color: white; padding: 8px 4px; text-align: center; font-weight: 700; font-size: 10px; }
  .summary-table td { padding: 6px 4px; border: 1px solid ${t.borderLight}; vertical-align: top; text-align: center; font-size: 9px; color: ${t.textMedium}; }
  .summary-table .meal-label { background: ${t.accent}; color: white; font-weight: 700; font-size: 9px; padding: 6px 8px; text-align: center; writing-mode: vertical-rl; transform: rotate(180deg); min-width: 30px; }
  .summary-table tr:nth-child(even) td:not(.meal-label) { background: ${t.lightBg}; }

  /* Day detail table */
  .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .detail-table th { background: ${t.primary}; color: white; padding: 8px; font-size: 10px; text-align: left; font-weight: 600; }
  .detail-table td { padding: 8px; border: 1px solid ${t.borderLight}; vertical-align: top; font-size: 10px; }
  .detail-table .meal-cell { background: ${t.accent}; color: white; font-weight: 700; text-align: center; width: 90px; font-size: 11px; }
  .detail-table .meal-cell .hora { font-weight: 400; font-size: 9px; opacity: 0.85; }
  .detail-table .plato-cell { width: 160px; font-weight: 600; font-size: 10px; color: ${t.textMedium}; }
  .detail-table .ingredientes-cell { font-size: 10px; color: ${t.textLight}; }
  .detail-table tr:nth-child(even) td:not(.meal-cell) { background: ${t.lightBg}; }

  /* Macros */
  .macros-row { display: flex; justify-content: center; gap: 20px; margin-top: 12px; padding: 12px; background: ${t.sectionBg}; border-radius: 8px; border: 1px solid ${t.borderLight}; }
  .macro-item { text-align: center; }
  .macro-value { font-weight: 800; font-size: 16px; }
  .macro-label { font-size: 9px; color: ${t.textLight}; margin-top: 2px; }
  .macro-cal { color: #c88a5c; }
  .macro-prot { color: #7d9bb5; }
  .macro-carb { color: #6b9e80; }
  .macro-fat { color: #c97e79; }

  /* Shopping list */
  .shop-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .shop-cat { break-inside: avoid; }
  .shop-cat-title { background: ${t.primary}; color: white; padding: 6px 10px; font-weight: 700; font-size: 10px; border-radius: 4px 4px 0 0; }
  .shop-item { padding: 4px 10px; font-size: 10px; border-bottom: 1px solid ${t.borderLight}; display: flex; align-items: center; gap: 6px; background: ${t.lightBg}; color: ${t.textMedium}; }
  .shop-item:last-child { border-radius: 0 0 4px 4px; }
  .shop-check { width: 10px; height: 10px; border: 1.5px solid ${t.border}; border-radius: 2px; flex-shrink: 0; }

  /* Food links */
  .food-link { color: ${t.linkColor}; text-decoration: underline; text-underline-offset: 2px; }

  /* Recommendations */
  .reco-text { font-size: 11px; line-height: 1.6; white-space: pre-line; color: ${t.textMedium}; }

  .footer { text-align: center; color: #a3b0a6; font-size: 9px; padding: 10px 0; border-top: 1px solid ${t.borderLight}; margin-top: 20px; }
  .footer-platform { color: #c0c8c3; font-size: 8px; margin-top: 2px; }

  @page { margin: 0; }
  @media print {
    * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    body { margin: 0; }
    .page { padding: 20px 30px; break-after: page; }
    .page:last-child { break-after: avoid; }
    .header { margin: -20px -30px 16px; padding: 10px 30px; }
    .cover-logo-img { max-width: 150px; }
    .header-logo-img { max-height: 24px; }
  }
`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function getItemNameHtml(a: AlimentoEnComida, t: TFunc): string {
  const name = a.alimento?.nombre || a.receta?.nombre || "?";
  const productLink = a.alimento?.enlaceProducto
    ? ` <a href="${escapeHtml(a.alimento.enlaceProducto)}" target="_blank" class="food-link" style="font-size:9px;">${t("planDietetico.enlaceProducto.ver")}</a>`
    : "";
  const imgLink = a.alimento?.imagenUrl
    ? ` <a href="${escapeHtml(a.alimento.imagenUrl)}" target="_blank" style="color:#7c3aed;font-size:9px;text-decoration:underline;">${t("planDietetico.enlaceProducto.verImagen")}</a>`
    : "";
  if (a.alimento?.enlaceProducto) {
    return `<a href="${escapeHtml(a.alimento.enlaceProducto)}" target="_blank" class="food-link">${escapeHtml(name)}</a>${imgLink}`;
  }
  return `${escapeHtml(name)}${productLink}${imgLink}`;
}

function getMacrosForItem(a: AlimentoEnComida) {
  if (a.alimento) {
    return calcularMacrosPorcion(a.alimento, convertirAGramos(a.cantidad, a.unidad, a.alimento.porcion));
  }
  if (a.receta) {
    return {
      calorias: Math.round(a.receta.calorias * a.cantidad * 10) / 10,
      proteinas: Math.round(a.receta.proteinas * a.cantidad * 10) / 10,
      carbohidratos: Math.round(a.receta.carbohidratos * a.cantidad * 10) / 10,
      grasas: Math.round(a.receta.grasas * a.cantidad * 10) / 10,
      fibra: 0,
    };
  }
  return macrosVacios();
}

function getItemName(a: AlimentoEnComida): string {
  return a.alimento?.nombre || a.receta?.nombre || "?";
}

function getDayMacros(dia: Dia) {
  const all = dia.comidas.flatMap((c) => c.alimentos.map(getMacrosForItem));
  return sumarMacros(all);
}

export function generatePlanPDF(data: PlanPDFData, t?: TFunc): string {
  const tt = t ?? ((key: string) => key);
  const theme = data.tema ?? TEMAS_PDF.verde;
  const sec = { portada: true, planSemanal: true, detalleDiario: true, recomendaciones: true, listaCompra: true, cantidadesSemanal: false, valoresNutricionales: true, ...data.sections };
  const brandName = escapeHtml(data.brandName || "Annonia");
  const ov = data.displayOverrides ?? {};
  const sortedDias = DIAS_ORDEN.map((d) => data.dias.find((dia) => dia.dia === d)).filter(Boolean) as Dia[];
  const fechaLocale = data.locale === "pt" ? "pt-BR" : "es-ES";
  const fecha = new Date().toLocaleDateString(fechaLocale, { day: "numeric", month: "long", year: "numeric" });
  const listaCompra = generarListaCompra(sortedDias as unknown as Parameters<typeof generarListaCompra>[0], ov);

  const logoHeaderHtml = data.logoDataUrl
    ? `<img src="${data.logoDataUrl}" alt="${brandName}" class="header-logo-img" onerror="this.style.display='none';this.parentNode.textContent='${brandName}'">`
    : brandName;
  const logoCoverHtml = data.logoDataUrl
    ? `<img src="${data.logoDataUrl}" alt="${brandName}" class="cover-logo-img" onerror="this.style.display='none';this.parentNode.textContent='${brandName}'">`
    : brandName;

  const footer = `<div class="footer">${brandName} &mdash; ${fecha}<div class="footer-platform">annonia.com</div></div>`;
  const pacNombre = escapeHtml(data.pacienteNombre).toUpperCase();
  const header = `<div class="header"><div><span class="header-name">${pacNombre}</span><br><span class="header-sub">${tt("planDietetico.header.subtitulo", { pacienteNombre: pacNombre })}</span></div><div class="header-logo">${logoHeaderHtml}</div></div>`;

  let html = "";

  // === PORTADA ===
  if (sec.portada) {
    html += `<div class="page cover"><div class="cover-box"><div class="cover-title">${tt("planDietetico.portada.titulo")}<br><strong>${tt("planDietetico.portada.subtitulo")}</strong></div><div class="cover-name">${pacNombre}</div></div><div class="cover-logo">${logoCoverHtml}</div><p class="cover-platform">Annonia</p></div>`;
  }

  // === RESUMEN SEMANAL ===
  if (sec.planSemanal) {
    html += `<div class="page">${header}<div class="section-title">${tt("planDietetico.secciones.planSemanal")}</div>`;
    html += `<table class="summary-table"><thead><tr><th></th>`;
    for (const d of DIAS_ORDEN) html += `<th>${tt("planDietetico.diaLabels." + DIA_KEY_MAP[d])}</th>`;
    html += `</tr></thead><tbody>`;

    for (const tipo of TIPOS_ORDEN) {
      html += `<tr><td class="meal-label">${tt("planDietetico.tipoLabels." + TIPO_KEY_MAP[tipo])}</td>`;
      for (const dia of sortedDias) {
        const comida = dia.comidas.find((c) => c.tipo === tipo);
        const items = comida?.alimentos.map((a, aIdx) => {
          const name = escapeHtml(getItemName(a));
          if (!sec.cantidadesSemanal) return name;
          const key = overrideKey(dia.dia, tipo, aIdx);
          const qty = resolveDisplay({ cantidad: a.cantidad, unidad: a.unidad }, ov[key], tt);
          return `${name} - ${qty}`;
        }).join("<br>") || "-";
        const desc = comida?.descripcion ? escapeHtml(comida.descripcion) : "";
        html += `<td>${desc ? `<strong style="font-size:8px;">${desc}</strong><br>` : ""}${items}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table>${footer}</div>`;
  }

  // === DETALLE POR DÍA ===
  if (sec.detalleDiario) {
    for (const dia of sortedDias) {
      const macros = getDayMacros(dia);
      html += `<div class="page">${header}<div class="day-title">${tt("planDietetico.diaLabels." + DIA_KEY_MAP[dia.dia])}</div>`;
      html += `<table class="detail-table"><thead><tr><th style="width:90px">${tt("planDietetico.tabla.comida")}</th><th style="width:160px">${tt("planDietetico.tabla.platos")}</th><th>${tt("planDietetico.tabla.ingredientesYCantidades")}</th></tr></thead><tbody>`;

      for (const tipo of TIPOS_ORDEN) {
        const comida = dia.comidas.find((c) => c.tipo === tipo);
        if (!comida || comida.alimentos.length === 0) continue;

        const rows = comida.alimentos.map((a, aIdx) => {
          const name = getItemName(a);
          const nameHtml = getItemNameHtml(a, tt);
          const key = overrideKey(dia.dia, tipo, aIdx);
          const qty = resolveDisplay({ cantidad: a.cantidad, unidad: a.unidad }, ov[key], tt);
          let detail = `${nameHtml}: ${qty}`;
          if (a.receta?.ingredientes && a.receta.ingredientes.length > 0) {
            const ingList = a.receta.ingredientes.map((i) => `${escapeHtml(i.alimento.nombre)}: ${formatQuantity(i.cantidad, i.unidad)}`).join(", ");
            detail = `<strong>${tt("planDietetico.receta.ingredientes")}</strong> ${ingList}`;
            if (a.receta.instrucciones) {
              detail += `<br><strong>${tt("planDietetico.receta.receta")}</strong> ${escapeHtml(a.receta.instrucciones).replace(/\n/g, "<br>")}`;
            }
          }
          return { name, nameHtml, qty, detail };
        });

        const hasDesc = !!comida.descripcion;
        const totalRows = hasDesc ? rows.length + 1 : rows.length;

        html += `<tr>`;
        html += `<td class="meal-cell" rowspan="${totalRows}"><strong>${tt("planDietetico.tipoLabels." + TIPO_KEY_MAP[tipo])}</strong><br><span class="hora">${tt("planDietetico.horaDefault." + TIPO_KEY_MAP[tipo])}</span></td>`;

        if (hasDesc) {
          html += `<td class="plato-cell" colspan="2"><strong>${escapeHtml(comida.descripcion!)}</strong></td></tr>`;
          for (const row of rows) {
            html += `<tr><td class="plato-cell">${row.nameHtml}</td><td class="ingredientes-cell">${row.detail}</td></tr>`;
          }
        } else {
          html += `<td class="plato-cell">${rows[0].nameHtml}</td><td class="ingredientes-cell">${rows[0].detail}</td></tr>`;
          for (let i = 1; i < rows.length; i++) {
            html += `<tr><td class="plato-cell">${rows[i].nameHtml}</td><td class="ingredientes-cell">${rows[i].detail}</td></tr>`;
          }
        }
      }

      html += `</tbody></table>`;
      if (sec.valoresNutricionales) {
        html += `<div class="macros-row">
          <div class="macro-item"><div class="macro-value macro-cal">${macros.calorias}</div><div class="macro-label">${tt("planDietetico.macros.kcal")}</div></div>
          <div class="macro-item"><div class="macro-value macro-prot">${macros.proteinas}g</div><div class="macro-label">${tt("planDietetico.macros.proteinas")}</div></div>
          <div class="macro-item"><div class="macro-value macro-carb">${macros.carbohidratos}g</div><div class="macro-label">${tt("planDietetico.macros.carbohidratos")}</div></div>
          <div class="macro-item"><div class="macro-value macro-fat">${macros.grasas}g</div><div class="macro-label">${tt("planDietetico.macros.grasas")}</div></div>
        </div>`;
      }
      html += `${footer}</div>`;
    }
  }

  // === RECOMENDACIONES ===
  if (sec.recomendaciones && data.recomendaciones.trim()) {
    html += `<div class="page">${header}<div class="section-title">${tt("planDietetico.secciones.recomendaciones")}</div><div class="reco-text">${escapeHtml(data.recomendaciones)}</div>${footer}</div>`;
  }

  // === LISTA DE LA COMPRA ===
  if (sec.listaCompra && listaCompra.length > 0) {
    html += `<div class="page">${header}<div class="section-title">${tt("planDietetico.secciones.listaCompra")}</div><div class="shop-grid">`;
    for (const cat of listaCompra) {
      html += `<div class="shop-cat"><div class="shop-cat-title">${cat.label}</div>`;
      for (const item of cat.items) {
        const linkHtml = item.enlaceProducto
          ? ` <a href="${escapeHtml(item.enlaceProducto)}" target="_blank" class="food-link" style="font-size:9px;">${tt("planDietetico.enlaceProducto.ver")}</a>`
          : "";
        const imgLink = (item as { imagenUrl?: string | null }).imagenUrl
          ? ` <a href="${escapeHtml((item as { imagenUrl?: string | null }).imagenUrl!)}" target="_blank" style="color:#7c3aed;font-size:9px;text-decoration:underline;">${tt("planDietetico.enlaceProducto.verImagen")}</a>`
          : "";
        html += `<div class="shop-item"><div class="shop-check"></div>${formatQuantity(item.cantidadTotal, item.unidad)} ${escapeHtml(item.nombre)}${linkHtml}${imgLink}</div>`;
      }
      html += `</div>`;
    }
    html += `</div>${footer}</div>`;
  }

  // === CONTRAPORTADA ===
  const clinicaLine = data.clinica ? ` &mdash; ${escapeHtml(data.clinica)}` : "";
  html += `<div class="page cover"><div class="cover-logo" style="font-size:32px;">${logoCoverHtml}</div><p style="color:#666; margin-top:12px; font-size:12px;">${tt("planDietetico.contraportada.generadoPor", { dietistaNombre: escapeHtml(data.dietistaNombre) })}${clinicaLine}</p><p style="color:#b0b8b3; margin-top:24px; font-size:10px;">${tt("planDietetico.contraportada.plataforma")}</p></div>`;

  return `<!DOCTYPE html><html><head><title>Plan Dietético - ${data.pacienteNombre}</title><style>${generateCSS(theme)}</style></head><body>${html}<script>window.onload=function(){window.print();}</script></body></html>`;
}
