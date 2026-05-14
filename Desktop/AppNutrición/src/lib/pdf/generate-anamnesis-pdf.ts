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

export function generateAnamnesisPDF(data: AnamnesisPDFData): string {
  const { ficha, theme, camposCustom = [] } = data;
  const c = ficha.consulta ?? {};
  const ps = ficha.personalSocial ?? {};
  const cl = ficha.clinica ?? {};
  const al = ficha.alimentaria ?? {};
  const cp = ficha.camposPersonalizados ?? {};

  const brand = data.brandName || "Annonia";
  const fecha = new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hasLogo = data.logoUrl && data.logoUrl.startsWith("data:image/");
  const logoHtml = hasLogo
    ? `<img src="${data.logoUrl}" style="max-height:48px;max-width:180px;object-fit:contain" onerror="this.parentNode.innerHTML='<span style=\\'font-size:20px;font-weight:700;color:${theme.primary}\\'>${esc(brand)}</span>'" />`
    : `<span style="font-size:20px;font-weight:700;color:${theme.primary}">${esc(brand)}</span>`;

  const secConsulta = seccion(
    "Informaciones de consulta",
    [
      fila("Motivo de consulta", c.motivo),
      fila("Expectativas", c.expectativas),
      fila("Objetivos clínicos", labelFor(SELECT_OBJETIVOS_CLINICOS, c.objetivosClinicos)),
      fila("Detalle objetivos", c.objetivosClinicosDetalle),
      fila("Otras informaciones", c.otras),
      ...camposCustom
        .filter((f) => f.seccion === "consulta")
        .map((f) => fila(f.label, cp[f.id])),
    ].join(""),
    theme
  );

  const secPersonal = seccion(
    "Historia personal y social",
    [
      fila("Función intestinal", labelFor(SELECT_FUNCION_INTESTINAL, ps.funcionIntestinal)),
      fila("Detalle", ps.funcionIntestinalDetalle),
      fila("Calidad del sueño", labelFor(SELECT_CALIDAD_SUENO, ps.calidadSueno)),
      fila("Detalle", ps.calidadSuenoDetalle),
      fila("Fumador", labelFor(SELECT_SI_NO_OCASION, ps.fumador)),
      fila("Detalle", ps.fumadorDetalle),
      fila("Bebe alcohol", labelFor(SELECT_SI_NO_OCASION, ps.alcohol)),
      fila("Detalle", ps.alcoholDetalle),
      fila("Estado civil", labelFor(SELECT_ESTADO_CIVIL, ps.estadoCivil)),
      fila("Detalle", ps.estadoCivilDetalle),
      fila("Actividad física", ps.actividadFisica),
      fila("Raza / etnia", ps.raza === "no_indica" ? "Prefiere no indicar" : ps.razaDetalle),
      fila("Otras informaciones", ps.otrasPersonal),
      ...camposCustom
        .filter((f) => f.seccion === "personalSocial")
        .map((f) => fila(f.label, cp[f.id])),
    ].join(""),
    theme
  );

  const tagList = (tags: string[]) =>
    tags.length > 0 ? tags.join(", ") : null;

  const secClinica = seccion(
    "Historia clínica",
    [
      fila("Patologías", tagList(data.patologias ?? [])),
      fila("Detalle patologías / evolución", cl.patologiasDetalle),
      fila("Medicamentos", tagList(data.medicamentos ?? [])),
      fila("Medicación (texto libre)", cl.medicacion),
      fila("Antecedentes personales", cl.antecedentesPersonales),
      fila("Antecedentes familiares", cl.antecedentesFamiliares),
      fila("Otras informaciones", cl.otrasClinicas),
      ...camposCustom
        .filter((f) => f.seccion === "clinica")
        .map((f) => fila(f.label, cp[f.id])),
    ].join(""),
    theme
  );

  const secAlimentaria = seccion(
    "Historia alimentaria",
    [
      fila("Alergias", tagList(data.alergias ?? [])),
      fila("Intolerancias", tagList(data.intolerancias ?? [])),
      fila("Hora habitual para levantarse", al.horaLevantarse),
      fila("Hora habitual para acostarse", al.horaAcostarse),
      fila("Tipo de dieta", labelFor(SELECT_TIPOS_DIETA, al.tiposDieta)),
      fila("Detalle dieta", al.tiposDietaDetalle),
      fila("Alimentos favoritos", al.alimentosFavoritos),
      fila("Alimentos rechazados", al.alimentosRechazados),
      fila("Alergias (detalle)", al.alergiasDetalle),
      fila("Intolerancias (detalle)", al.intoleranciasDetalle),
      fila("Deficiencias nutricionales", al.deficienciasDetalle),
      fila("Ingesta de agua", labelFor(SELECT_INGESTA_AGUA, al.ingestaAgua)),
      fila("Otras informaciones", al.otrasAlimentaria),
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
          "Campos personalizados",
          camposPers.map((f) => fila(f.label, cp[f.id])).join(""),
          theme
        )
      : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Anamnesis — ${esc(data.pacienteNombre)}</title>
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
      <h1 style="margin:0 0 4px;font-size:22px;color:${theme.primary}">Anamnesis nutricional</h1>
      <p style="margin:0;font-size:14px;color:${theme.textLight}">
        Paciente: <strong style="color:${theme.textDark}">${esc(data.pacienteNombre)}</strong>
        &nbsp;·&nbsp; Nutricionista: <strong style="color:${theme.textDark}">${esc(data.dietistaNombre)}</strong>
      </p>
    </div>

    ${secConsulta}
    ${secPersonal}
    ${secClinica}
    ${secAlimentaria}
    ${secPersonalizado}

    <!-- Footer -->
    <div style="margin-top:32px;padding-top:12px;border-top:1px solid ${theme.border};text-align:center;color:${theme.textLight};font-size:11px">
      ${esc(brand)} · Generado el ${esc(fecha)}
      <div style="color:#c0c8c3;font-size:8px;margin-top:2px">annonia.com</div>
    </div>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;
}
