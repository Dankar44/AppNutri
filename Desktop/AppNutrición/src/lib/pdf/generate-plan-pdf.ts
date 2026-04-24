import { generarListaCompra } from "@/lib/shopping-list";
import { calcularMacrosPorcion, sumarMacros, macrosVacios } from "@/lib/macros";

const DIA_LABELS: Record<string, string> = {
  LUNES: "Lunes", MARTES: "Martes", MIERCOLES: "Miércoles",
  JUEVES: "Jueves", VIERNES: "Viernes", SABADO: "Sábado", DOMINGO: "Domingo",
};
const DIAS_ORDEN = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

const TIPO_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno", MEDIA_MANANA: "Media mañana", ALMUERZO: "Almuerzo",
  MERIENDA: "Merienda", CENA: "Cena", RECENA: "Recena",
};
const TIPOS_ORDEN = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"];

const HORA_DEFAULT: Record<string, string> = {
  DESAYUNO: "09:00", MEDIA_MANANA: "11:00", ALMUERZO: "14:00",
  MERIENDA: "17:00", CENA: "21:00", RECENA: "23:00",
};

// Types
interface AlimentoEnComida {
  cantidad: number;
  unidad: string;
  alimento: {
    id: string; nombre: string; categoria: string;
    calorias: number; proteinas: number; carbohidratos: number; grasas: number; fibra: number; porcion: number;
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

export interface PlanPDFData {
  planNombre: string;
  pacienteNombre: string;
  dietistaNombre: string;
  dias: Dia[];
  recomendaciones: string;
  caloriasObjetivo?: number | null;
}

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #2c3e33; font-size: 11px; line-height: 1.4; }

  .page { page-break-after: always; padding: 30px 40px; min-height: 100vh; position: relative; }
  .page:last-child { page-break-after: avoid; }

  .header { background: #6b9e80; color: white; padding: 8px 20px; display: flex; justify-content: space-between; align-items: center; margin: -30px -40px 20px; padding: 12px 40px; }
  .header-name { font-weight: 700; font-size: 13px; letter-spacing: 0.3px; }
  .header-sub { font-size: 10px; opacity: 0.9; }
  .header-logo { font-weight: 800; font-size: 16px; letter-spacing: -0.5px; }

  .section-title { background: #eaf3ec; padding: 10px 20px; text-align: center; font-weight: 700; font-size: 14px; color: #3d5a48; margin: 20px 0 16px; border-radius: 6px; border: 1px solid #d4e4d9; }

  .day-title { background: #e8d8a8; color: #6b5932; padding: 8px 16px; text-align: center; font-weight: 700; font-size: 13px; border-radius: 6px; margin-bottom: 12px; }

  /* Cover */
  .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; text-align: center; }
  .cover-box { background: #f5f9f6; border-radius: 16px; padding: 60px 80px; max-width: 500px; border: 1px solid #dce8df; }
  .cover-title { font-size: 28px; color: #3d5a48; font-weight: 300; margin-bottom: 4px; }
  .cover-title strong { font-weight: 800; color: #6b9e80; }
  .cover-name { background: #6b9e80; color: white; padding: 8px 24px; font-weight: 700; font-size: 14px; margin-top: 16px; display: inline-block; letter-spacing: 0.5px; border-radius: 4px; }
  .cover-logo { margin-top: 60px; font-size: 24px; font-weight: 800; color: #6b9e80; }

  /* Summary table */
  .summary-table { width: 100%; border-collapse: collapse; font-size: 9px; }
  .summary-table th { background: #6b9e80; color: white; padding: 8px 4px; text-align: center; font-weight: 700; font-size: 10px; }
  .summary-table td { padding: 6px 4px; border: 1px solid #e2ebe5; vertical-align: top; text-align: center; font-size: 9px; color: #3d5a48; }
  .summary-table .meal-label { background: #8bb39a; color: white; font-weight: 700; font-size: 9px; padding: 6px 8px; text-align: center; writing-mode: vertical-rl; transform: rotate(180deg); min-width: 30px; }
  .summary-table tr:nth-child(even) td:not(.meal-label) { background: #f5f9f6; }

  /* Day detail table */
  .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .detail-table th { background: #6b9e80; color: white; padding: 8px; font-size: 10px; text-align: left; font-weight: 600; }
  .detail-table td { padding: 8px; border: 1px solid #e2ebe5; vertical-align: top; font-size: 10px; }
  .detail-table .meal-cell { background: #8bb39a; color: white; font-weight: 700; text-align: center; width: 90px; font-size: 11px; }
  .detail-table .meal-cell .hora { font-weight: 400; font-size: 9px; opacity: 0.85; }
  .detail-table .plato-cell { width: 160px; font-weight: 600; font-size: 10px; color: #3d5a48; }
  .detail-table .ingredientes-cell { font-size: 10px; color: #55695c; }
  .detail-table tr:nth-child(even) td:not(.meal-cell) { background: #f5f9f6; }

  /* Macros */
  .macros-row { display: flex; justify-content: center; gap: 20px; margin-top: 12px; padding: 12px; background: #eef5f0; border-radius: 8px; border: 1px solid #dce8df; }
  .macro-item { text-align: center; }
  .macro-value { font-weight: 800; font-size: 16px; }
  .macro-label { font-size: 9px; color: #7a8a80; margin-top: 2px; }
  .macro-cal { color: #c88a5c; }
  .macro-prot { color: #7d9bb5; }
  .macro-carb { color: #6b9e80; }
  .macro-fat { color: #c97e79; }

  /* Shopping list */
  .shop-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .shop-cat { break-inside: avoid; }
  .shop-cat-title { background: #6b9e80; color: white; padding: 6px 10px; font-weight: 700; font-size: 10px; border-radius: 4px 4px 0 0; }
  .shop-item { padding: 4px 10px; font-size: 10px; border-bottom: 1px solid #eaf0ec; display: flex; align-items: center; gap: 6px; background: #f5f9f6; color: #3d5a48; }
  .shop-item:last-child { border-radius: 0 0 4px 4px; }
  .shop-check { width: 10px; height: 10px; border: 1.5px solid #bcc9c0; border-radius: 2px; flex-shrink: 0; }

  /* Recommendations */
  .reco-text { font-size: 11px; line-height: 1.6; white-space: pre-line; color: #3d5a48; }

  .footer { text-align: center; color: #a3b0a6; font-size: 9px; padding: 10px 0; border-top: 1px solid #e2ebe5; margin-top: 20px; }

  @media print {
    body { margin: 0; }
    .page { padding: 20px 30px; }
    .header { margin: -20px -30px 16px; padding: 10px 30px; }
  }
`;

function getMacrosForItem(a: AlimentoEnComida) {
  if (a.alimento) {
    return calcularMacrosPorcion(a.alimento, a.cantidad);
  }
  if (a.receta) {
    return {
      calorias: Math.round(a.receta.calorias / a.receta.porciones * a.cantidad / 100),
      proteinas: Math.round(a.receta.proteinas / a.receta.porciones * a.cantidad / 100),
      carbohidratos: Math.round(a.receta.carbohidratos / a.receta.porciones * a.cantidad / 100),
      grasas: Math.round(a.receta.grasas / a.receta.porciones * a.cantidad / 100),
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

export function generatePlanPDF(data: PlanPDFData): string {
  const sortedDias = DIAS_ORDEN.map((d) => data.dias.find((dia) => dia.dia === d)).filter(Boolean) as Dia[];
  const fecha = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const listaCompra = generarListaCompra(sortedDias as unknown as Parameters<typeof generarListaCompra>[0]);

  const header = `<div class="header"><div><span class="header-name">${data.pacienteNombre.toUpperCase()}</span><br><span class="header-sub">PLAN DIETÉTICO SEMANAL DE ${data.pacienteNombre.toUpperCase()}</span></div><div class="header-logo">Annonia</div></div>`;

  // === PORTADA ===
  let html = `<div class="page cover"><div class="cover-box"><div class="cover-title">PLAN DIETÉTICO<br><strong>PERSONALIZADO</strong></div><div class="cover-name">${data.pacienteNombre.toUpperCase()}</div></div><div class="cover-logo">Annonia</div></div>`;

  // === RESUMEN SEMANAL ===
  html += `<div class="page">${header}<div class="section-title">PLAN DIETÉTICO SEMANAL</div>`;
  html += `<table class="summary-table"><thead><tr><th></th>`;
  for (const d of DIAS_ORDEN) html += `<th>${DIA_LABELS[d]}</th>`;
  html += `</tr></thead><tbody>`;

  for (const tipo of TIPOS_ORDEN) {
    html += `<tr><td class="meal-label">${TIPO_LABELS[tipo]}</td>`;
    for (const dia of sortedDias) {
      const comida = dia.comidas.find((c) => c.tipo === tipo);
      const items = comida?.alimentos.map((a) => getItemName(a)).join("<br>") || "-";
      const desc = comida?.descripcion || "";
      html += `<td>${desc ? `<strong style="font-size:8px;">${desc}</strong><br>` : ""}${items}</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table><div class="footer">Annonia &mdash; ${fecha}</div></div>`;

  // === DETALLE POR DÍA ===
  for (const dia of sortedDias) {
    const macros = getDayMacros(dia);
    html += `<div class="page">${header}<div class="day-title">${DIA_LABELS[dia.dia]}</div>`;
    html += `<table class="detail-table"><thead><tr><th style="width:90px">Comida</th><th style="width:160px">Platos</th><th>Ingredientes y cantidades</th></tr></thead><tbody>`;

    for (const tipo of TIPOS_ORDEN) {
      const comida = dia.comidas.find((c) => c.tipo === tipo);
      if (!comida || comida.alimentos.length === 0) continue;

      const rows = comida.alimentos.map((a) => {
        const name = getItemName(a);
        const qty = `${Math.round(a.cantidad)}g`;
        let detail = `${name}: ${qty}`;
        if (a.receta?.ingredientes && a.receta.ingredientes.length > 0) {
          const ingList = a.receta.ingredientes.map((i) => `${i.alimento.nombre}: ${Math.round(i.cantidad)}g`).join(", ");
          detail = `<strong>INGREDIENTES:</strong> ${ingList}`;
          if (a.receta.instrucciones) {
            detail += `<br><strong>RECETA:</strong> ${a.receta.instrucciones.replace(/\n/g, "<br>")}`;
          }
        }
        return { name, qty, detail };
      });

      const firstRow = rows[0];
      const desc = comida.descripcion || rows.map((r) => r.name).join(", ");

      html += `<tr>`;
      html += `<td class="meal-cell" rowspan="${rows.length}"><strong>${TIPO_LABELS[tipo]}</strong><br><span class="hora">${HORA_DEFAULT[tipo]}</span></td>`;
      html += `<td class="plato-cell">${desc}</td>`;
      html += `<td class="ingredientes-cell">${firstRow.detail}</td></tr>`;

      for (let i = 1; i < rows.length; i++) {
        html += `<tr><td class="plato-cell">${rows[i].name}</td><td class="ingredientes-cell">${rows[i].detail}</td></tr>`;
      }
    }

    html += `</tbody></table>`;
    html += `<div class="macros-row">
      <div class="macro-item"><div class="macro-value macro-cal">${macros.calorias}</div><div class="macro-label">kcal</div></div>
      <div class="macro-item"><div class="macro-value macro-prot">${macros.proteinas}g</div><div class="macro-label">Proteínas</div></div>
      <div class="macro-item"><div class="macro-value macro-carb">${macros.carbohidratos}g</div><div class="macro-label">Carbohidratos</div></div>
      <div class="macro-item"><div class="macro-value macro-fat">${macros.grasas}g</div><div class="macro-label">Grasas</div></div>
    </div>`;
    html += `<div class="footer">Annonia &mdash; ${fecha}</div></div>`;
  }

  // === RECOMENDACIONES ===
  if (data.recomendaciones.trim()) {
    html += `<div class="page">${header}<div class="section-title">RECOMENDACIONES</div><div class="reco-text">${data.recomendaciones}</div><div class="footer">Annonia &mdash; ${fecha}</div></div>`;
  }

  // === LISTA DE LA COMPRA ===
  if (listaCompra.length > 0) {
    html += `<div class="page">${header}<div class="section-title">LISTA DE LA COMPRA</div><div class="shop-grid">`;
    for (const cat of listaCompra) {
      html += `<div class="shop-cat"><div class="shop-cat-title">${cat.label}</div>`;
      for (const item of cat.items) {
        html += `<div class="shop-item"><div class="shop-check"></div>${Math.round(item.cantidadTotal)}g ${item.nombre}</div>`;
      }
      html += `</div>`;
    }
    html += `</div><div class="footer">Annonia &mdash; ${fecha}</div></div>`;
  }

  // === CONTRAPORTADA ===
  html += `<div class="page cover"><div class="cover-logo" style="font-size:32px;">Annonia</div><p style="color:#666; margin-top:12px; font-size:12px;">Generado por ${data.dietistaNombre}</p></div>`;

  return `<!DOCTYPE html><html><head><title>Plan Dietético - ${data.pacienteNombre}</title><style>${CSS}</style></head><body>${html}<script>window.onload=function(){window.print();}</script></body></html>`;
}
