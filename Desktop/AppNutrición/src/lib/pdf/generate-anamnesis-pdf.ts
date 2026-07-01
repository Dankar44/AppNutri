import type { PdfColorTheme } from "./pdf-themes";
import type { FichaInformacionData } from "@/lib/ficha-informacion-types";
import {
  OPCION_VACIA,
  getSelectSiNoOcasion,
  getSelectEstadoCivil,
  getSelectFuncionIntestinal,
  getSelectCalidadSueno,
  getSelectTiposDieta,
  getSelectIngestaAgua,
  getSelectObjetivosClinicos,
} from "@/lib/ficha-informacion-types";
import { getBuiltin, parseCheckboxValue, condicionCumplida, ESCALA_MAX, type EstructuraPlantilla, type SelectId } from "@/lib/anamnesis-plantillas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunc = (key: string, values?: Record<string, any>) => string;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function labelFor(options: { value: string; label: string }[], value: string | undefined): string | null {
  if (!value || value === OPCION_VACIA) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

export interface AnamnesisPDFData {
  pacienteNombre: string;
  dietistaNombre: string;
  clinica?: string | null;
  ficha: FichaInformacionData;
  estructura: EstructuraPlantilla;
  patologias?: string[];
  medicamentos?: string[];
  alergias?: string[];
  intolerancias?: string[];
  suplementos?: string[];
  theme: PdfColorTheme;
  logoUrl?: string | null;
  brandName?: string | null;
  locale?: string;
}

function fila(label: string, value: string | undefined | null): string {
  if (!value || value === OPCION_VACIA) return "";
  // Respuestas largas (texto libre) o con saltos → pregunta arriba y respuesta debajo a todo el ancho,
  // sin truncar la pregunta. Respuestas cortas (selector, sí/no…) → dos columnas.
  const largo = value.length > 55 || value.includes("\n");
  if (largo) {
    return `<tr>
    <td colspan="2" style="padding:9px 12px 11px">
      <div style="font-weight:600;font-size:13px;margin-bottom:3px">${esc(label)}</div>
      <div style="font-size:13px;line-height:1.5;white-space:pre-wrap">${esc(value)}</div>
    </td>
  </tr>`;
  }
  return `<tr>
    <td style="padding:7px 12px;font-weight:600;vertical-align:top;width:38%;font-size:13px">${esc(label)}</td>
    <td style="padding:7px 12px;font-size:13px;white-space:pre-wrap">${esc(value)}</td>
  </tr>`;
}

function seccionHtml(title: string, rows: string, theme: PdfColorTheme): string {
  if (!rows.trim()) return "";
  return `
    <div style="margin-bottom:20px">
      <div style="background:${theme.sectionBg};padding:10px 14px;border-radius:6px;margin-bottom:2px">
        <span style="font-size:15px;font-weight:700;color:${theme.primary}">${esc(title)}</span>
      </div>
      <table width="100%" style="border-collapse:collapse;color:${theme.textMedium}">
        ${rows}
      </table>
    </div>`;
}

export function generateAnamnesisPDF(data: AnamnesisPDFData, t?: TFunc): string {
  const tt =
    t ??
    ((key: string) => {
      const parts = key.split(".");
      return parts[parts.length - 1];
    });
  // Resolutor relativo al namespace "patients" (igual que el renderer en pantalla).
  const tp: TFunc = (key, values) => tt("patients." + key, values);

  const { ficha, theme, estructura } = data;
  const cp = ficha.camposPersonalizados ?? {};


  function opcionesDe(selectId: SelectId): { value: string; label: string }[] {
    switch (selectId) {
      case "siNoOcasion": return getSelectSiNoOcasion(tp);
      case "estadoCivil": return getSelectEstadoCivil(tp);
      case "funcionIntestinal": return getSelectFuncionIntestinal(tp);
      case "calidadSueno": return getSelectCalidadSueno(tp);
      case "tiposDieta": return getSelectTiposDieta(tp);
      case "ingestaAgua": return getSelectIngestaAgua(tp);
      case "objetivosClinicos": return getSelectObjetivosClinicos(tp);
      case "raza":
        return [
          { value: "caucasica", label: tp("informacion.razaCaucasica") },
          { value: "hispana", label: tp("informacion.razaHispana") },
          { value: "afrodescendiente", label: tp("informacion.razaAfrodescendiente") },
          { value: "asiatica", label: tp("informacion.razaAsiatica") },
          { value: "arabe", label: tp("informacion.razaArabe") },
          { value: "indigena", label: tp("informacion.razaIndigena") },
          { value: "mestiza", label: tp("informacion.razaMestiza") },
          { value: "otra", label: tp("informacion.razaOtra") },
        ];
      case "siNo":
        return [{ value: "si", label: tp("informacionExtra.siDetallar") }];
    }
  }

  function valorBuiltin(seccion: string, campo: string): string {
    const sec = (ficha as unknown as Record<string, Record<string, string> | undefined>)[seccion];
    return sec?.[campo] ?? "";
  }

  function valorDePregunta(p: EstructuraPlantilla["secciones"][number]["preguntas"][number]): string {
    if (p.kind === "custom") return cp[p.id] ?? "";
    const bb = getBuiltin(p.ref);
    return bb ? valorBuiltin(bb.seccion, bb.id) : "";
  }

  // Valor formateado de una pregunta propia (o hija condicional) para el PDF.
  function filaCustom(label: string, tipo: string, raw: string): string {
    let v: string | null = raw || null;
    if (tipo === "checkbox") {
      const marcadas = parseCheckboxValue(raw);
      v = marcadas.length ? marcadas.join(", ") : null;
    } else if (tipo === "escala") {
      v = raw ? `${raw} / ${ESCALA_MAX}` : null;
    }
    return fila(label, v);
  }

  // Filas de una sección. Cada pregunta puede arrastrar una pregunta hija condicional.
  function filasSeccion(preguntas: EstructuraPlantilla["secciones"][number]["preguntas"]): string {
    const filas: string[] = [];
    for (const p of preguntas) {
      if (p.kind === "custom") {
        filas.push(filaCustom(p.label, p.tipo, cp[p.id] ?? ""));
      } else {
        const b = getBuiltin(p.ref);
        if (b) {
          const label = p.labelOverride || tp(b.labelKey);
          let valor: string | null = valorBuiltin(b.seccion, b.id);
          if (b.input === "selector" && b.selectId) {
            valor = labelFor(opcionesDe(b.selectId), valorBuiltin(b.seccion, b.id));
          }
          // Detalle condicional: se concatena al valor principal.
          if (b.detalle) {
            const det = valorBuiltin(b.seccion, b.detalle.campo);
            if (det) valor = valor ? `${valor} — ${det}` : det;
          }
          filas.push(fila(label, valor));
        }
      }
      // Pregunta hija condicional: aparece bajo la madre si se cumple su condición.
      if (p.condicion && condicionCumplida(p.condicion, valorDePregunta(p))) {
        const h = p.condicion.pregunta;
        filas.push(filaCustom(h.label, h.tipo, cp[h.id] ?? ""));
      }
    }
    return filas.join("");
  }

  const brand = data.brandName || "Annonia";
  const locale = data.locale || "es-ES";
  const fecha = new Date().toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });

  const hasLogo = data.logoUrl && data.logoUrl.startsWith("data:image/");
  const logoHtml = hasLogo
    ? `<img src="${data.logoUrl}" style="max-height:48px;max-width:180px;object-fit:contain" />`
    : `<span style="font-size:20px;font-weight:700;color:${theme.primary}">${esc(brand)}</span>`;

  // Sección "Historial médico" con las listas del paciente (arrays del modelo), si hay algo.
  const tag = (arr?: string[]) => (arr && arr.length > 0 ? arr.join(", ") : null);
  const secHistorial = seccionHtml(
    tp("preconsulta.historialMedico"),
    [
      fila(tp("form.alergias"), tag(data.alergias)),
      fila(tp("form.intolerancias"), tag(data.intolerancias)),
      fila(tp("form.patologias"), tag(data.patologias)),
      fila(tp("form.medicamentos"), tag(data.medicamentos)),
      fila(tp("form.suplementos"), tag(data.suplementos)),
    ].join(""),
    theme,
  );

  // Secciones según la estructura efectiva del paciente.
  const seccionesHtml = estructura.secciones
    .map((s) => {
      const titulo = s.titulo ? s.titulo : s.tituloKey ? tp(s.tituloKey) : "";
      return seccionHtml(titulo, filasSeccion(s.preguntas), theme);
    })
    .join("");

  const langAttr = locale.startsWith("pt") ? "pt" : "es";

  return `<!DOCTYPE html>
<html lang="${langAttr}">
<head>
<meta charset="utf-8">
<title>${esc(tt("pdf.anamnesis.titulo"))} — ${esc(data.pacienteNombre)}</title>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 18mm 16mm;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: ${theme.textDark};
    background: #fff;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  table { page-break-inside: auto; }
  tr { page-break-inside: avoid; page-break-after: auto; }
</style>
</head>
<body>
  <div style="max-width:720px;margin:0 auto">
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:2px solid ${theme.primary};margin-bottom:24px">
      <div>${logoHtml}</div>
      <div style="text-align:right;font-size:12px;color:${theme.textLight}">
        <div>${esc(fecha)}</div>
        ${data.clinica ? `<div>${esc(data.clinica)}</div>` : ""}
      </div>
    </div>

    <div style="margin-bottom:24px">
      <h1 style="margin:0 0 4px;font-size:22px;color:${theme.primary}">${esc(tt("pdf.anamnesis.titulo"))}</h1>
      <p style="margin:0;font-size:14px;color:${theme.textLight}">
        ${esc(tt("pdf.anamnesis.pacienteLabel"))} <strong style="color:${theme.textDark}">${esc(data.pacienteNombre)}</strong>
        &nbsp;·&nbsp; ${esc(tt("pdf.anamnesis.nutricionistaLabel"))} <strong style="color:${theme.textDark}">${esc(data.dietistaNombre)}</strong>
      </p>
    </div>

    ${secHistorial}
    ${seccionesHtml}

    <div style="margin-top:32px;padding-top:12px;border-top:1px solid ${theme.border};text-align:center;color:${theme.textLight};font-size:11px">
      ${esc(tt("pdf.anamnesis.footer.texto", { brand, fecha }))}
      <div style="color:#c0c8c3;font-size:8px;margin-top:2px">${esc(tt("pdf.anamnesis.footer.plataforma"))}</div>
    </div>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}
