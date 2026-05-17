import type { PdfColorTheme } from "./pdf-themes";
import type {
  FichaInformacionData,
  CampoPersonalizadoDefinicion,
} from "@/lib/ficha-informacion-types";
import {
  OPCION_VACIA,
  SELECT_FUNCION_INTESTINAL,
  SELECT_CALIDAD_SUENO,
  SELECT_SI_NO_OCASION,
  SELECT_ESTADO_CIVIL,
  SELECT_OBJETIVOS_CLINICOS,
  SELECT_TIPOS_DIETA,
  SELECT_INGESTA_AGUA,
} from "@/lib/ficha-informacion-types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunc = (key: string, values?: Record<string, any>) => string;

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function labelFor(
  options: { value: string; label: string }[],
  value: string | undefined
): string | null {
  if (!value || value === OPCION_VACIA) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

export interface AnamnesisPDFData {
  pacienteNombre: string;
  dietistaNombre: string;
  clinica?: string | null;
  ficha: FichaInformacionData;
  camposCustom?: CampoPersonalizadoDefinicion[];
  patologias?: string[];
  medicamentos?: string[];
  alergias?: string[];
  intolerancias?: string[];
  theme: PdfColorTheme;
  logoUrl?: string | null;
  brandName?: string | null;
  locale?: string;
}

function fila(label: string, value: string | undefined | null): string {
  if (!value || value === OPCION_VACIA) return "";
  return `<tr>
    <td style="padding:7px 12px;font-weight:600;vertical-align:top;white-space:nowrap;width:40%;font-size:13px">${esc(label)}</td>
    <td style="padding:7px 12px;font-size:13px">${esc(value)}</td>
  </tr>`;
}

function seccion(title: string, rows: string, theme: PdfColorTheme): string {
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
  const tt = t ?? ((key: string) => {
    // Fallback: return the last segment of the key as readable label
    const parts = key.split(".");
    return parts[parts.length - 1];
  });

  const { ficha, theme, camposCustom = [] } = data;
  const c = ficha.consulta ?? {};
  const ps = ficha.personalSocial ?? {};
  const cl = ficha.clinica ?? {};
  const al = ficha.alimentaria ?? {};
  const cp = ficha.camposPersonalizados ?? {};

  const brand = data.brandName || "Annonia";
  const locale = data.locale || "es-ES";
  const fecha = new Date().toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hasLogo = data.logoUrl && data.logoUrl.startsWith("data:image/");
  const logoHtml = hasLogo
    ? `<img src="${data.logoUrl}" style="max-height:48px;max-width:180px;object-fit:contain" onerror="this.parentNode.innerHTML='<span style=\\'font-size:20px;font-weight:700;color:${theme.primary}\\'>${esc(brand)}</span>'" />`
    : `<span style="font-size:20px;font-weight:700;color:${theme.primary}">${esc(brand)}</span>`;

  const secConsulta = seccion(
    tt("pdf.anamnesis.secciones.consulta"),
    [
      fila(tt("pdf.anamnesis.labels.motivoConsulta"), c.motivo),
      fila(tt("pdf.anamnesis.labels.expectativas"), c.expectativas),
      fila(tt("pdf.anamnesis.labels.objetivosClinicos"), labelFor(SELECT_OBJETIVOS_CLINICOS, c.objetivosClinicos)),
      fila(tt("pdf.anamnesis.labels.detalleObjetivos"), c.objetivosClinicosDetalle),
      fila(tt("pdf.anamnesis.labels.otrasInformaciones"), c.otras),
      ...camposCustom
        .filter((f) => f.seccion === "consulta")
        .map((f) => fila(f.label, cp[f.id])),
    ].join(""),
    theme
  );

  const secPersonal = seccion(
    tt("pdf.anamnesis.secciones.personalSocial"),
    [
      fila(tt("pdf.anamnesis.labels.funcionIntestinal"), labelFor(SELECT_FUNCION_INTESTINAL, ps.funcionIntestinal)),
      fila(tt("pdf.anamnesis.labels.detalle"), ps.funcionIntestinalDetalle),
      fila(tt("pdf.anamnesis.labels.calidadSueno"), labelFor(SELECT_CALIDAD_SUENO, ps.calidadSueno)),
      fila(tt("pdf.anamnesis.labels.detalle"), ps.calidadSuenoDetalle),
      fila(tt("pdf.anamnesis.labels.fumador"), labelFor(SELECT_SI_NO_OCASION, ps.fumador)),
      fila(tt("pdf.anamnesis.labels.detalle"), ps.fumadorDetalle),
      fila(tt("pdf.anamnesis.labels.bebeAlcohol"), labelFor(SELECT_SI_NO_OCASION, ps.alcohol)),
      fila(tt("pdf.anamnesis.labels.detalle"), ps.alcoholDetalle),
      fila(tt("pdf.anamnesis.labels.estadoCivil"), labelFor(SELECT_ESTADO_CIVIL, ps.estadoCivil)),
      fila(tt("pdf.anamnesis.labels.detalle"), ps.estadoCivilDetalle),
      fila(tt("pdf.anamnesis.labels.actividadFisica"), ps.actividadFisica),
      fila(tt("pdf.anamnesis.labels.razaEtnia"), ps.raza === "no_indica" ? tt("pdf.anamnesis.labels.prefiereNoIndicar") : ps.razaDetalle),
      fila(tt("pdf.anamnesis.labels.otrasInformaciones"), ps.otrasPersonal),
      ...camposCustom
        .filter((f) => f.seccion === "personalSocial")
        .map((f) => fila(f.label, cp[f.id])),
    ].join(""),
    theme
  );

  const tagList = (tags: string[]) =>
    tags.length > 0 ? tags.join(", ") : null;

  const secClinica = seccion(
    tt("pdf.anamnesis.secciones.clinica"),
    [
      fila(tt("pdf.anamnesis.labels.patologias"), tagList(data.patologias ?? [])),
      fila(tt("pdf.anamnesis.labels.detallePatologias"), cl.patologiasDetalle),
      fila(tt("pdf.anamnesis.labels.medicamentos"), tagList(data.medicamentos ?? [])),
      fila(tt("pdf.anamnesis.labels.medicacion"), cl.medicacion),
      fila(tt("pdf.anamnesis.labels.antecedentesPersonales"), cl.antecedentesPersonales),
      fila(tt("pdf.anamnesis.labels.antecedentesFamiliares"), cl.antecedentesFamiliares),
      fila(tt("pdf.anamnesis.labels.otrasClinicas"), cl.otrasClinicas),
      ...camposCustom
        .filter((f) => f.seccion === "clinica")
        .map((f) => fila(f.label, cp[f.id])),
    ].join(""),
    theme
  );

  const secAlimentaria = seccion(
    tt("pdf.anamnesis.secciones.alimentaria"),
    [
      fila(tt("pdf.anamnesis.labels.alergias"), tagList(data.alergias ?? [])),
      fila(tt("pdf.anamnesis.labels.intolerancias"), tagList(data.intolerancias ?? [])),
      fila(tt("pdf.anamnesis.labels.horaLevantarse"), al.horaLevantarse),
      fila(tt("pdf.anamnesis.labels.horaAcostarse"), al.horaAcostarse),
      fila(tt("pdf.anamnesis.labels.tipoDieta"), labelFor(SELECT_TIPOS_DIETA, al.tiposDieta)),
      fila(tt("pdf.anamnesis.labels.detalleDieta"), al.tiposDietaDetalle),
      fila(tt("pdf.anamnesis.labels.alimentosFavoritos"), al.alimentosFavoritos),
      fila(tt("pdf.anamnesis.labels.alimentosRechazados"), al.alimentosRechazados),
      fila(tt("pdf.anamnesis.labels.alergiasDetalle"), al.alergiasDetalle),
      fila(tt("pdf.anamnesis.labels.intoleranciasDetalle"), al.intoleranciasDetalle),
      fila(tt("pdf.anamnesis.labels.deficienciasNutricionales"), al.deficienciasDetalle),
      fila(tt("pdf.anamnesis.labels.ingestaAgua"), labelFor(SELECT_INGESTA_AGUA, al.ingestaAgua)),
      fila(tt("pdf.anamnesis.labels.otrasAlimentaria"), al.otrasAlimentaria),
      ...camposCustom
        .filter((f) => f.seccion === "alimentaria")
        .map((f) => fila(f.label, cp[f.id])),
    ].join(""),
    theme
  );

  const camposPers = camposCustom.filter((f) => f.seccion === "personalizado");
  const secPersonalizado =
    camposPers.length > 0
      ? seccion(
          tt("pdf.anamnesis.secciones.camposPersonalizados"),
          camposPers.map((f) => fila(f.label, cp[f.id])).join(""),
          theme
        )
      : "";

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
    <!-- Header -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:2px solid ${theme.primary};margin-bottom:24px">
      <div>${logoHtml}</div>
      <div style="text-align:right;font-size:12px;color:${theme.textLight}">
        <div>${esc(fecha)}</div>
        ${data.clinica ? `<div>${esc(data.clinica)}</div>` : ""}
      </div>
    </div>

    <!-- Título -->
    <div style="margin-bottom:24px">
      <h1 style="margin:0 0 4px;font-size:22px;color:${theme.primary}">${esc(tt("pdf.anamnesis.titulo"))}</h1>
      <p style="margin:0;font-size:14px;color:${theme.textLight}">
        ${esc(tt("pdf.anamnesis.pacienteLabel"))} <strong style="color:${theme.textDark}">${esc(data.pacienteNombre)}</strong>
        &nbsp;·&nbsp; ${esc(tt("pdf.anamnesis.nutricionistaLabel"))} <strong style="color:${theme.textDark}">${esc(data.dietistaNombre)}</strong>
      </p>
    </div>

    ${secConsulta}
    ${secPersonal}
    ${secClinica}
    ${secAlimentaria}
    ${secPersonalizado}

    <!-- Footer -->
    <div style="margin-top:32px;padding-top:12px;border-top:1px solid ${theme.border};text-align:center;color:${theme.textLight};font-size:11px">
      ${esc(tt("pdf.anamnesis.footer.texto", { brand, fecha }))}
      <div style="color:#c0c8c3;font-size:8px;margin-top:2px">${esc(tt("pdf.anamnesis.footer.plataforma"))}</div>
    </div>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}
