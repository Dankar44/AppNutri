import { formatQuantity } from "@/lib/units";
import { type PdfColorTheme, TEMAS_PDF } from "./pdf-themes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunc = (key: string, values?: Record<string, any>) => string;

export const MAX_RECETAS_RECETARIO = 20;
export type DistribucionRecetarioPDF = "automatica" | "unaPorPagina";

export interface RecetaRecetarioPDF {
  id: string;
  nombre: string;
  descripcion?: string | null;
  instrucciones?: string | null;
  porciones: number;
  tiempoPreparacion?: number | null;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  ingredientes: {
    id: string;
    cantidad: number;
    unidad: string;
    alimento: { nombre: string };
  }[];
}

export interface OpcionesRecetarioPDF {
  portada?: boolean;
  indice?: boolean;
  valoresNutricionales?: boolean;
  distribucion?: DistribucionRecetarioPDF;
}

export interface RecetarioPDFData {
  titulo: string;
  dietistaNombre: string;
  recetas: RecetaRecetarioPDF[];
  tema?: PdfColorTheme;
  brandName?: string;
  logoDataUrl?: string;
  clinica?: string;
  locale?: string;
  isEmail?: boolean;
  opciones?: OpcionesRecetarioPDF;
}

interface RecetaPreparada {
  receta: RecetaRecetarioPDF;
  pasos: string[];
  alturaEstimada: number;
}

interface RecetaFuentePlan {
  id: string;
  nombre: string;
  descripcion?: string | null;
  instrucciones?: string | null;
  porciones: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  ingredientes: {
    cantidad: number;
    unidad: string;
    alimento: { nombre: string };
  }[];
}

interface FuenteRecetasPlan {
  comidas: {
    alimentos: {
      receta: RecetaFuentePlan | null;
      alternativas?: { receta?: RecetaFuentePlan | null }[];
    }[];
  }[];
}

function escapeHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pasosDe(instrucciones?: string | null): string[] {
  if (!instrucciones) return [];
  return instrucciones
    .split(/\r?\n+/)
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => linea.replace(/^\s*(?:\d+[.)\-:]|[-•*])\s*/, ""));
}

function estimarAltura(receta: RecetaRecetarioPDF, pasos: string[], conMacros: boolean): number {
  const lineasIngredientes = receta.ingredientes.reduce(
    (total, ingrediente) => total + Math.max(1, Math.ceil(ingrediente.alimento.nombre.length / 54)),
    0,
  );
  const lineasPasos = pasos.reduce(
    (total, paso) => total + Math.max(1, Math.ceil(paso.length / 84)),
    0,
  );
  const altoIngredientes = lineasIngredientes * 22;
  const altoPasos = lineasPasos * 17 + pasos.length * 10;
  const altoDescripcion = receta.descripcion ? Math.ceil(receta.descripcion.length / 95) * 17 + 8 : 0;
  return 145 + altoDescripcion + Math.max(altoIngredientes, altoPasos) + (conMacros ? 66 : 0);
}

function prepararRecetas(recetas: RecetaRecetarioPDF[], conMacros: boolean): RecetaPreparada[] {
  return recetas.map((receta) => {
    const pasos = pasosDe(receta.instrucciones);
    return { receta, pasos, alturaEstimada: estimarAltura(receta, pasos, conMacros) };
  });
}

function agruparRecetas(recetas: RecetaPreparada[], distribucion: DistribucionRecetarioPDF): RecetaPreparada[][] {
  if (distribucion === "unaPorPagina") return recetas.map((receta) => [receta]);

  const paginas: RecetaPreparada[][] = [];
  for (let indice = 0; indice < recetas.length; indice++) {
    const actual = recetas[indice];
    const siguiente = recetas[indice + 1];
    const puedenCompartir = !!siguiente
      && actual.alturaEstimada + siguiente.alturaEstimada <= 940;

    if (puedenCompartir) {
      paginas.push([actual, siguiente]);
      indice++;
    } else {
      paginas.push([actual]);
    }
  }
  return paginas;
}

/** Obtiene una sola copia de cada receta principal o alternativa incluida en el plan. */
export function extraerRecetasDelPlan(dias: FuenteRecetasPlan[]): RecetaRecetarioPDF[] {
  const recetas = new Map<string, RecetaRecetarioPDF>();
  const registrarReceta = (receta?: RecetaFuentePlan | null) => {
    if (!receta || recetas.has(receta.id)) return;
    recetas.set(receta.id, {
      ...receta,
      ingredientes: receta.ingredientes.map((ingrediente, indice) => ({
        id: `${receta.id}-${indice}`,
        cantidad: ingrediente.cantidad,
        unidad: ingrediente.unidad,
        alimento: { nombre: ingrediente.alimento.nombre },
      })),
    });
  };

  for (const dia of dias) {
    for (const comida of dia.comidas) {
      for (const alimento of comida.alimentos) {
        registrarReceta(alimento.receta);
        for (const alternativa of alimento.alternativas ?? []) {
          registrarReceta(alternativa.receta);
        }
      }
    }
  }

  return [...recetas.values()];
}

/** Estilos del apéndice, aislados para poder reutilizarlos dentro del PDF del paciente. */
export function generateRecetarioCSS(
  tema: PdfColorTheme,
  opciones?: { densidad?: "normal" | "compacta" },
): string {
  const esCompacta = opciones?.densidad === "compacta";
  const margenHorizontal = esCompacta ? "30px" : "40px";
  const margenVertical = esCompacta ? "22px" : "30px";
  const rellenoImpresion = esCompacta ? "16px 24px" : "20px 30px";
  return `
  .recetario-page { background: white; display: flex; flex-direction: column; }
  .recetario-header { background: ${tema.primary}; color: white; margin: -${margenVertical} -${margenHorizontal} 18px; border-spacing: 0; width: calc(100% + ${esCompacta ? "60px" : "80px"}); }
  .recetario-header td { padding: ${esCompacta ? "9px 30px" : "12px 40px"}; vertical-align: middle; }
  .recetario-header-name { font-weight: 700; font-size: 13px; letter-spacing: 0.3px; }
  .recetario-header-sub { font-size: 10px; opacity: 0.9; }
  .recetario-header-logo { font-weight: 800; font-size: 16px; letter-spacing: -0.5px; text-align: right; }
  .recetario-header-logo-img { max-height: 28px; max-width: 150px; vertical-align: middle; }

  .recetario-cover { text-align: center; padding-top: 80px; padding-bottom: 40px; }
  .recetario-cover-box { background: ${tema.lightBg}; border-radius: 16px; padding: 58px 70px; max-width: 540px; border: 1px solid ${tema.borderLight}; margin: 0 auto; }
  .recetario-cover-kicker { color: ${tema.textLight}; font-size: 12px; font-weight: 700; letter-spacing: 2px; margin-bottom: 12px; }
  .recetario-cover-title { font-size: 30px; line-height: 1.2; color: ${tema.primary}; font-weight: 800; overflow-wrap: anywhere; }
  .recetario-cover-name { background: ${tema.primary}; color: white; padding: 8px 24px; font-weight: 700; font-size: 13px; margin-top: 20px; display: inline-block; border-radius: 4px; }
  .recetario-cover-logo { margin-top: 60px; font-size: 24px; font-weight: 800; color: ${tema.primary}; }
  .recetario-cover-logo-img { max-width: 180px; max-height: 80px; }
  .recetario-cover-platform { color: #c0c8c3; font-size: 18px; font-weight: 700; letter-spacing: 1px; margin-top: 60px; }

  .recetario-section-title { background: ${tema.sectionBg}; padding: 10px 20px; text-align: center; font-weight: 700; font-size: 14px; color: ${tema.textMedium}; margin: 0 0 14px; border-radius: 6px; border: 1px solid ${tema.border}; overflow-wrap: anywhere; }
  .recetario-index-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 18px; list-style: none; counter-reset: receta; }
  .recetario-index-item { counter-increment: receta; display: flex; align-items: baseline; gap: 9px; padding: 10px 12px; border: 1px solid ${tema.borderLight}; border-radius: 6px; background: ${tema.lightBg}; color: ${tema.textMedium}; break-inside: avoid; }
  .recetario-index-item::before { content: counter(receta, decimal-leading-zero); color: ${tema.primary}; font-size: 10px; font-weight: 800; }
  .recetario-index-name { font-size: 11px; font-weight: 600; overflow-wrap: anywhere; }

  .recetario-stack { display: flex; flex: 1; flex-direction: column; gap: 16px; }
  .recetario-card { border: 1px solid ${tema.borderLight}; border-radius: 10px; padding: 14px 16px; break-inside: avoid-page; page-break-inside: avoid; }
  .recetario-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 7px; margin: -3px 0 12px; }
  .recetario-meta-item { background: ${tema.lightBg}; border: 1px solid ${tema.borderLight}; border-radius: 999px; color: ${tema.textMedium}; font-size: 9.5px; font-weight: 600; padding: 4px 9px; }
  .recetario-description { color: ${tema.textLight}; font-size: 10.5px; line-height: 1.45; margin: 0 auto 13px; max-width: 620px; text-align: center; white-space: pre-line; }
  .recetario-grid { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.35fr); gap: 20px; align-items: start; }
  .recetario-block-title { color: ${tema.primary}; font-size: 10.5px; font-weight: 800; letter-spacing: 0.7px; padding-bottom: 6px; margin-bottom: 4px; border-bottom: 2px solid ${tema.border}; }
  .recetario-ingredients-table { width: 100%; border-collapse: collapse; }
  .recetario-ingredients-table tr { break-inside: avoid; page-break-inside: avoid; }
  .recetario-ingredients-table td { padding: 6px 4px; border-bottom: 1px solid ${tema.borderLight}; font-size: 9.5px; vertical-align: top; }
  .recetario-ingredient-name { color: ${tema.textMedium}; font-weight: 600; overflow-wrap: anywhere; }
  .recetario-ingredient-quantity { color: ${tema.textLight}; text-align: right; white-space: nowrap; }
  .recetario-steps-list { list-style: none; counter-reset: paso; }
  .recetario-step { counter-increment: paso; display: grid; grid-template-columns: 22px 1fr; gap: 7px; margin-bottom: 8px; break-inside: avoid; page-break-inside: avoid; }
  .recetario-step::before { content: counter(paso); width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${tema.primary}; color: white; font-size: 8.5px; font-weight: 800; }
  .recetario-step-text { color: ${tema.textMedium}; font-size: 10px; line-height: 1.45; padding-top: 2px; overflow-wrap: anywhere; }
  .recetario-empty-text { color: ${tema.textLight}; font-size: 10px; font-style: italic; padding: 8px 0; }

  .recetario-macros-row { margin-top: 14px; background: ${tema.sectionBg}; border-radius: 8px; border: 1px solid ${tema.borderLight}; border-spacing: 0; }
  .recetario-macro-item { text-align: center; padding: 8px 12px; }
  .recetario-macro-value { font-weight: 800; font-size: 14px; }
  .recetario-macro-label { font-size: 8.5px; color: ${tema.textLight}; margin-top: 1px; }
  .recetario-macro-cal { color: #c88a5c; }
  .recetario-macro-prot { color: #7d9bb5; }
  .recetario-macro-carb { color: #6b9e80; }
  .recetario-macro-fat { color: #c97e79; }
  .recetario-macros-caption { color: ${tema.textLight}; font-size: 8.5px; margin-top: 4px; text-align: center; }

  .recetario-card--compacta { padding: 11px 13px; }
  .recetario-card--compacta .recetario-section-title { padding: 8px 16px; margin-bottom: 10px; }
  .recetario-card--compacta .recetario-description { margin-bottom: 9px; }
  .recetario-card--compacta .recetario-grid { gap: 15px; }
  .recetario-card--compacta .recetario-ingredients-table td { padding: 4px 3px; font-size: 9px; }
  .recetario-card--compacta .recetario-step { margin-bottom: 5px; }
  .recetario-card--compacta .recetario-step-text { font-size: 9.5px; line-height: 1.35; }
  .recetario-card--muy-compacta { padding: 9px 11px; }
  .recetario-card--muy-compacta .recetario-section-title { font-size: 12px; padding: 7px 14px; margin-bottom: 8px; }
  .recetario-card--muy-compacta .recetario-meta { margin-bottom: 7px; }
  .recetario-card--muy-compacta .recetario-description { font-size: 9px; line-height: 1.3; margin-bottom: 7px; }
  .recetario-card--muy-compacta .recetario-grid { gap: 12px; }
  .recetario-card--muy-compacta .recetario-block-title { padding-bottom: 4px; }
  .recetario-card--muy-compacta .recetario-ingredients-table td { padding: 3px; font-size: 8.5px; }
  .recetario-card--muy-compacta .recetario-step { grid-template-columns: 19px 1fr; gap: 5px; margin-bottom: 4px; }
  .recetario-card--muy-compacta .recetario-step::before { width: 18px; height: 18px; font-size: 8px; }
  .recetario-card--muy-compacta .recetario-step-text { font-size: 8.8px; line-height: 1.25; }
  .recetario-card--muy-compacta .recetario-macros-row { margin-top: 8px; }
  .recetario-card--muy-compacta .recetario-macro-item { padding: 6px 9px; }

  .recetario-footer { text-align: center; color: #a3b0a6; font-size: 9px; padding: 10px 0 0; border-top: 1px solid ${tema.borderLight}; margin-top: auto; }
  .recetario-footer-platform { color: #c0c8c3; font-size: 8px; margin-top: 2px; }

  @media print {
    .recetario-page { padding: ${rellenoImpresion}; }
    .recetario-cover { padding-top: 200px; }
    .recetario-header { margin: -${esCompacta ? "16px -24px" : "20px -30px"} ${esCompacta ? "12px" : "16px"}; width: calc(100% + ${esCompacta ? "48px" : "60px"}); }
    .recetario-header td { padding: ${esCompacta ? "8px 24px" : "10px 30px"}; }
    .recetario-cover-logo-img { max-width: 150px; }
    .recetario-header-logo-img { max-height: 24px; }
  }
  @page { size: A4 portrait; margin: 0; }
`;
}

function generateDocumentCSS(tema: PdfColorTheme): string {
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: ${tema.textDark}; font-size: 11px; line-height: 1.45; }
  .page { page-break-after: always; padding: 30px 40px; min-height: 100vh; position: relative; }
  .page:last-child { page-break-after: avoid; }
  @page { size: A4; margin: 0; }
  @media print {
    * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    body { margin: 0; }
    .page { padding: 20px 30px; break-after: page; }
    .page:last-child { break-after: avoid; }
  }
  ${generateRecetarioCSS(tema)}
`;
}

function generateRecetaHtml(preparada: RecetaPreparada, opciones: Required<OpcionesRecetarioPDF>, tt: TFunc): string {
  const { receta, pasos, alturaEstimada } = preparada;
  const meta = [
    receta.tiempoPreparacion !== null && receta.tiempoPreparacion !== undefined
      ? tt("recetario.receta.minutos", { count: receta.tiempoPreparacion })
      : null,
    receta.porciones > 1 ? tt("recetario.receta.rinde", { count: receta.porciones }) : null,
  ].filter(Boolean);
  const compacta = alturaEstimada > 560 ? " recetario-card--compacta" : "";
  const muyCompacta = alturaEstimada > 760 ? " recetario-card--muy-compacta" : "";

  let html = `<article class="recetario-card${compacta}${muyCompacta}"><div class="recetario-section-title">${escapeHtml(receta.nombre)}</div>`;
  if (meta.length > 0) {
    html += `<div class="recetario-meta">${meta.map((item) => `<span class="recetario-meta-item">${escapeHtml(String(item))}</span>`).join("")}</div>`;
  }
  if (receta.descripcion) {
    html += `<p class="recetario-description">${escapeHtml(receta.descripcion)}</p>`;
  }

  html += `<div class="recetario-grid"><section><h2 class="recetario-block-title">${tt("recetario.receta.ingredientes")}</h2>`;
  if (receta.ingredientes.length === 0) {
    html += `<p class="recetario-empty-text">${tt("recetario.receta.sinIngredientes")}</p>`;
  } else {
    html += `<table class="recetario-ingredients-table"><tbody>`;
    for (const ingrediente of receta.ingredientes) {
      html += `<tr><td class="recetario-ingredient-name">${escapeHtml(ingrediente.alimento.nombre)}</td><td class="recetario-ingredient-quantity">${escapeHtml(formatQuantity(ingrediente.cantidad, ingrediente.unidad))}</td></tr>`;
    }
    html += `</tbody></table>`;
  }
  html += `</section><section><h2 class="recetario-block-title">${tt("recetario.receta.preparacion")}</h2>`;
  if (pasos.length === 0) {
    html += `<p class="recetario-empty-text">${tt("recetario.receta.sinInstrucciones")}</p>`;
  } else {
    html += `<ol class="recetario-steps-list">${pasos.map((paso) => `<li class="recetario-step"><span class="recetario-step-text">${escapeHtml(paso)}</span></li>`).join("")}</ol>`;
  }
  html += `</section></div>`;

  if (opciones.valoresNutricionales) {
    html += `<table class="recetario-macros-row" width="100%"><tr>
      <td class="recetario-macro-item"><div class="recetario-macro-value recetario-macro-cal">${Math.round(receta.calorias)}</div><div class="recetario-macro-label">${tt("planDietetico.macros.kcal")}</div></td>
      <td class="recetario-macro-item"><div class="recetario-macro-value recetario-macro-prot">${Math.round(receta.proteinas * 10) / 10}g</div><div class="recetario-macro-label">${tt("planDietetico.macros.proteinas")}</div></td>
      <td class="recetario-macro-item"><div class="recetario-macro-value recetario-macro-carb">${Math.round(receta.carbohidratos * 10) / 10}g</div><div class="recetario-macro-label">${tt("planDietetico.macros.carbohidratos")}</div></td>
      <td class="recetario-macro-item"><div class="recetario-macro-value recetario-macro-fat">${Math.round(receta.grasas * 10) / 10}g</div><div class="recetario-macro-label">${tt("planDietetico.macros.grasas")}</div></td>
    </tr></table><p class="recetario-macros-caption">${tt("recetario.receta.macrosPorRacion")}</p>`;
  }

  return `${html}</article>`;
}

/** Genera las páginas del recetario para usarlas solas o como apéndice de otro PDF. */
export function generateRecetarioPages(data: RecetarioPDFData, t?: TFunc, incluirContraportada = true): string {
  const tt = t ?? ((key: string) => key);
  const opciones: Required<OpcionesRecetarioPDF> = { portada: true, indice: true, valoresNutricionales: true, distribucion: "automatica", ...data.opciones };
  const titulo = data.titulo.trim() || tt("recetario.tituloDefault");
  const tituloHtml = escapeHtml(titulo);
  const brandName = escapeHtml(data.brandName || "Annonia");
  const fechaLocale = data.locale === "pt" ? "pt-BR" : "es-ES";
  const fecha = new Date().toLocaleDateString(fechaLocale, { day: "numeric", month: "long", year: "numeric" });
  const showLogo = data.logoDataUrl && !data.isEmail;
  const logoSrc = data.logoDataUrl ? escapeHtml(data.logoDataUrl) : "";
  const logoHeaderHtml = showLogo
    ? `<img src="${logoSrc}" alt="${brandName}" class="recetario-header-logo-img" onerror="this.style.display='none';this.parentNode.textContent='${brandName}'">`
    : brandName;
  const logoCoverHtml = showLogo
    ? `<img src="${logoSrc}" alt="${brandName}" class="recetario-cover-logo-img" onerror="this.style.display='none';this.parentNode.textContent='${brandName}'">`
    : brandName;
  const footer = `<div class="recetario-footer">${tt("recetario.footer.texto", { brandName, fecha })}<div class="recetario-footer-platform">annonia.com</div></div>`;
  const header = `<table class="recetario-header"><tr><td><span class="recetario-header-name">${tituloHtml}</span><br><span class="recetario-header-sub">${tt("recetario.header.subtitulo")}</span></td><td class="recetario-header-logo">${logoHeaderHtml}</td></tr></table>`;

  let html = "";

  if (opciones.portada) {
    html += `<div class="page recetario-page recetario-cover"><div class="recetario-cover-box"><div class="recetario-cover-kicker">${tt("recetario.portada.sobretitulo")}</div><div class="recetario-cover-title">${tituloHtml}</div><div class="recetario-cover-name">${tt("recetario.portada.cantidad", { count: data.recetas.length })}</div></div><div class="recetario-cover-logo">${logoCoverHtml}</div><p class="recetario-cover-platform">Annonia</p></div>`;
  }

  if (opciones.indice) {
    html += `<div class="page recetario-page">${header}<div class="recetario-section-title">${tt("recetario.indice.titulo")}</div><ol class="recetario-index-list">`;
    for (const receta of data.recetas) {
      html += `<li class="recetario-index-item"><span class="recetario-index-name">${escapeHtml(receta.nombre)}</span></li>`;
    }
    html += `</ol>${footer}</div>`;
  }

  const recetasPreparadas = prepararRecetas(data.recetas, opciones.valoresNutricionales);
  for (const pagina of agruparRecetas(recetasPreparadas, opciones.distribucion)) {
    html += `<div class="page recetario-page">${header}<div class="recetario-stack">`;
    for (const receta of pagina) {
      html += generateRecetaHtml(receta, opciones, tt);
    }
    html += `</div>${footer}</div>`;
  }

  if (incluirContraportada) {
    const clinica = data.clinica ? ` &mdash; ${escapeHtml(data.clinica)}` : "";
    html += `<div class="page recetario-page recetario-cover"><div class="recetario-cover-logo" style="font-size:32px;">${logoCoverHtml}</div><p style="color:#666;margin-top:12px;font-size:12px;">${tt("recetario.contraportada.generadoPor", { dietistaNombre: escapeHtml(data.dietistaNombre) })}${clinica}</p><p style="color:#b0b8b3;margin-top:24px;font-size:10px;">annonia.com</p></div>`;
  }

  return html;
}

export function generateRecetarioPDF(data: RecetarioPDFData, t?: TFunc): string {
  const tt = t ?? ((key: string) => key);
  const tema = data.tema ?? TEMAS_PDF.verde;
  const titulo = data.titulo.trim() || tt("recetario.tituloDefault");
  const tituloHtml = escapeHtml(titulo);
  const html = generateRecetarioPages(data, tt);
  const printScript = data.isEmail ? "" : "<script>window.onload=function(){window.print();}</script>";
  const lang = data.locale === "pt" ? "pt" : "es";
  return `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><title>${tituloHtml}</title><style>${generateDocumentCSS(tema)}</style></head><body>${html}${printScript}</body></html>`;
}
