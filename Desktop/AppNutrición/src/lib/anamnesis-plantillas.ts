/**
 * #18 — Plantillas de anamnesis por especialidad.
 *
 * Una plantilla define la ESTRUCTURA de la anamnesis (secciones ordenadas, cada una con preguntas).
 * Una pregunta es:
 *   - "builtin": referencia a una pregunta fija del catálogo (PREGUNTAS_BUILTIN) → se renderiza con su
 *     mismo input/label/select de siempre. Permite incluirla, ocultarla (no incluirla) y reordenarla.
 *   - "custom": una pregunta propia del dietista (label + tipo + opciones), como los campos personalizados.
 *
 * Compatibilidad: un paciente SIN plantilla usa ESTRUCTURA_BASE (las 4 secciones con todas sus preguntas
 * fijas) + los campos personalizados globales del dietista, exactamente como antes de #18.
 */

import type { SeccionAnamnesis, TipoCampoAnamnesis, CampoPersonalizadoDefinicion } from "./ficha-informacion-types";
import {
  OPCION_VACIA,
  getSelectSiNoOcasion,
  getSelectEstadoCivil,
  getSelectFuncionIntestinal,
  getSelectCalidadSueno,
  getSelectTiposDieta,
  getSelectIngestaAgua,
  getSelectObjetivosClinicos,
} from "./ficha-informacion-types";

// --- Tipos de la estructura de una plantilla ---

/** Pregunta hija que aparece condicionalmente bajo otra (independiente del resto de la lista). */
export type PreguntaCondicionada = { id: string; label: string; tipo: TipoCampoAnamnesis; opciones?: string[] };

/** Si la pregunta madre se responde con alguno de `valores` (vacío = cualquier respuesta), aparece la
 * pregunta hija `pregunta` justo después. No afecta a las demás preguntas (cada una es independiente). */
export type CondicionVisibilidad = { valores: string[]; pregunta: PreguntaCondicionada };

export type PreguntaPlantilla =
  | { kind: "builtin"; ref: string; labelOverride?: string; condicion?: CondicionVisibilidad }
  | { kind: "custom"; id: string; label: string; tipo: TipoCampoAnamnesis; opciones?: string[]; condicion?: CondicionVisibilidad };

export type SeccionPlantilla = {
  id: string;
  /** Título literal (secciones propias). Para secciones base se usa `tituloKey`. */
  titulo?: string;
  /** Clave i18n bajo el namespace "patients" (secciones base, p.ej. "informacion.informacionesConsulta"). */
  tituloKey?: string;
  preguntas: PreguntaPlantilla[];
};

export type EstructuraPlantilla = {
  secciones: SeccionPlantilla[];
};

// --- Catálogo de preguntas FIJAS (built-in) ---

export type InputBuiltin = "texto" | "textarea" | "selector" | "hora";
export type SelectId =
  | "siNoOcasion"
  | "estadoCivil"
  | "funcionIntestinal"
  | "calidadSueno"
  | "tiposDieta"
  | "ingestaAgua"
  | "objetivosClinicos"
  | "raza"
  | "siNo";

export type PreguntaBuiltin = {
  /** id estable; también es el nombre del campo en FichaInformacionData[seccion]. */
  id: string;
  seccion: SeccionAnamnesis;
  /** Clave i18n del label, bajo el namespace "patients" (p.ej. "informacion.motivoConsulta"). */
  labelKey: string;
  input: InputBuiltin;
  selectId?: SelectId;
  /** Campo de detalle condicional (textarea/input que aparece según el valor del campo principal). */
  detalle?: {
    campo: string;
    visibleSi: string[]; // valores que muestran el detalle; [] = siempre que haya valor no vacío
    placeholderKey?: string; // clave i18n bajo "patients"
  };
};

export const PREGUNTAS_BUILTIN: PreguntaBuiltin[] = [
  // ── Consulta ──
  { id: "motivo", seccion: "consulta", labelKey: "informacion.motivoConsulta", input: "textarea" },
  { id: "expectativas", seccion: "consulta", labelKey: "informacion.expectativas", input: "textarea" },
  {
    id: "objetivosClinicos",
    seccion: "consulta",
    labelKey: "informacion.objetivosClinicos",
    input: "selector",
    selectId: "objetivosClinicos",
    detalle: { campo: "objetivosClinicosDetalle", visibleSi: [], placeholderKey: "informacion.detallaObjetivo" },
  },
  { id: "otras", seccion: "consulta", labelKey: "informacion.otrasInformaciones", input: "textarea" },

  // ── Personal y social ──
  {
    id: "funcionIntestinal",
    seccion: "personalSocial",
    labelKey: "informacion.funcionIntestinal",
    input: "selector",
    selectId: "funcionIntestinal",
    detalle: { campo: "funcionIntestinalDetalle", visibleSi: ["otro"], placeholderKey: "informacion.especifica" },
  },
  {
    id: "calidadSueno",
    seccion: "personalSocial",
    labelKey: "informacion.calidadSueno",
    input: "selector",
    selectId: "calidadSueno",
    detalle: { campo: "calidadSuenoDetalle", visibleSi: ["regular", "mala"], placeholderKey: "informacion.describeProblemaSueno" },
  },
  {
    id: "fumador",
    seccion: "personalSocial",
    labelKey: "informacion.fumador",
    input: "selector",
    selectId: "siNoOcasion",
    detalle: { campo: "fumadorDetalle", visibleSi: ["si", "ocasional"], placeholderKey: "informacion.frecuenciaCantidad" },
  },
  {
    id: "alcohol",
    seccion: "personalSocial",
    labelKey: "informacion.bebeAlcohol",
    input: "selector",
    selectId: "siNoOcasion",
    detalle: { campo: "alcoholDetalle", visibleSi: ["si", "ocasional"], placeholderKey: "informacionExtra.frecuenciaTipoBebida" },
  },
  {
    id: "estadoCivil",
    seccion: "personalSocial",
    labelKey: "informacion.estadoCivil",
    input: "selector",
    selectId: "estadoCivil",
    detalle: { campo: "estadoCivilDetalle", visibleSi: ["otro"], placeholderKey: "informacion.especifica" },
  },
  { id: "actividadFisica", seccion: "personalSocial", labelKey: "informacion.actividadFisica", input: "textarea" },
  {
    id: "raza",
    seccion: "personalSocial",
    labelKey: "informacion.razaEtnia",
    input: "selector",
    selectId: "raza",
    detalle: { campo: "razaDetalle", visibleSi: ["otra"], placeholderKey: "informacion.especifica" },
  },
  { id: "otrasPersonal", seccion: "personalSocial", labelKey: "informacion.otrasInformaciones", input: "textarea" },

  // ── Clínica ──
  { id: "patologiasDetalle", seccion: "clinica", labelKey: "informacionExtra.detallePatologias", input: "textarea" },
  { id: "medicacion", seccion: "clinica", labelKey: "informacionExtra.medicacionTextoLibre", input: "textarea" },
  { id: "antecedentesPersonales", seccion: "clinica", labelKey: "informacionExtra.antecedentesPersonales", input: "texto" },
  { id: "antecedentesFamiliares", seccion: "clinica", labelKey: "informacionExtra.antecedentesFamiliares", input: "texto" },
  { id: "otrasClinicas", seccion: "clinica", labelKey: "informacion.otrasInformaciones", input: "textarea" },

  // ── Alimentaria ──
  { id: "horaLevantarse", seccion: "alimentaria", labelKey: "informacionExtra.horaLevantarse", input: "hora" },
  { id: "horaAcostarse", seccion: "alimentaria", labelKey: "informacionExtra.horaAcostarse", input: "hora" },
  {
    id: "tiposDieta",
    seccion: "alimentaria",
    labelKey: "informacionExtra.tiposDieta",
    input: "selector",
    selectId: "tiposDieta",
    detalle: { campo: "tiposDietaDetalle", visibleSi: ["otra"], placeholderKey: "informacionExtra.describeTipoDieta" },
  },
  { id: "alimentosFavoritos", seccion: "alimentaria", labelKey: "informacionExtra.alimentosFavoritos", input: "texto" },
  { id: "alimentosRechazados", seccion: "alimentaria", labelKey: "informacionExtra.alimentosRechazados", input: "texto" },
  {
    id: "alergiasResumen",
    seccion: "alimentaria",
    labelKey: "informacionExtra.alergias",
    input: "selector",
    selectId: "siNo",
    detalle: { campo: "alergiasDetalle", visibleSi: ["si"], placeholderKey: "informacionExtra.detallaAlergias" },
  },
  {
    id: "intoleranciasResumen",
    seccion: "alimentaria",
    labelKey: "informacionExtra.intoleranciasAlimentarias",
    input: "selector",
    selectId: "siNo",
    detalle: { campo: "intoleranciasDetalle", visibleSi: ["si"], placeholderKey: "informacionExtra.detallaIntolerancias" },
  },
  {
    id: "deficiencias",
    seccion: "alimentaria",
    labelKey: "informacionExtra.deficienciasNutricionales",
    input: "selector",
    selectId: "siNo",
    detalle: { campo: "deficienciasDetalle", visibleSi: ["si"], placeholderKey: "informacionExtra.detallaDeficiencias" },
  },
  { id: "ingestaAgua", seccion: "alimentaria", labelKey: "informacionExtra.ingestaAgua", input: "selector", selectId: "ingestaAgua" },
  { id: "otrasAlimentaria", seccion: "alimentaria", labelKey: "informacion.otrasInformaciones", input: "textarea" },
];

const BUILTIN_POR_ID = new Map(PREGUNTAS_BUILTIN.map((p) => [p.id, p]));
export function getBuiltin(id: string): PreguntaBuiltin | undefined {
  return BUILTIN_POR_ID.get(id);
}

/** Opciones (value/label) de un selector fijo, SIN la opción vacía. Para los chips de las condiciones. */
export function opcionesDeSelect(selectId: SelectId, t: (key: string) => string): { value: string; label: string }[] {
  let opts: { value: string; label: string }[];
  switch (selectId) {
    case "siNoOcasion": opts = getSelectSiNoOcasion(t); break;
    case "estadoCivil": opts = getSelectEstadoCivil(t); break;
    case "funcionIntestinal": opts = getSelectFuncionIntestinal(t); break;
    case "calidadSueno": opts = getSelectCalidadSueno(t); break;
    case "tiposDieta": opts = getSelectTiposDieta(t); break;
    case "ingestaAgua": opts = getSelectIngestaAgua(t); break;
    case "objetivosClinicos": opts = getSelectObjetivosClinicos(t); break;
    case "raza":
      opts = [
        { value: "caucasica", label: t("informacion.razaCaucasica") },
        { value: "hispana", label: t("informacion.razaHispana") },
        { value: "afrodescendiente", label: t("informacion.razaAfrodescendiente") },
        { value: "asiatica", label: t("informacion.razaAsiatica") },
        { value: "arabe", label: t("informacion.razaArabe") },
        { value: "indigena", label: t("informacion.razaIndigena") },
        { value: "mestiza", label: t("informacion.razaMestiza") },
        { value: "otra", label: t("informacion.razaOtra") },
      ];
      break;
    case "siNo":
      opts = [{ value: "si", label: t("informacionExtra.siDetallar") }];
      break;
    default:
      opts = [];
  }
  return opts.filter((o) => o.value && o.value !== OPCION_VACIA);
}

// --- Secciones base (orden y títulos i18n) ---

type SeccionBaseDef = { id: SeccionAnamnesis; tituloKey: string };
export const SECCIONES_BASE: SeccionBaseDef[] = [
  { id: "consulta", tituloKey: "informacion.informacionesConsulta" },
  { id: "personalSocial", tituloKey: "informacion.historiaPersonalSocial" },
  { id: "clinica", tituloKey: "informacionExtra.historiaClinica" },
  { id: "alimentaria", tituloKey: "informacionExtra.historiaAlimentaria" },
];

/** Estructura por defecto: las 4 secciones base con TODAS sus preguntas fijas, en orden. */
export function estructuraBase(): EstructuraPlantilla {
  return {
    secciones: SECCIONES_BASE.map((s) => ({
      id: s.id,
      tituloKey: s.tituloKey,
      preguntas: PREGUNTAS_BUILTIN.filter((p) => p.seccion === s.id).map((p) => ({ kind: "builtin", ref: p.id } as PreguntaPlantilla)),
    })),
  };
}

// --- Presets por especialidad ---
// Parten de la estructura base completa y AÑADEN una sección propia con preguntas custom.
// Labels en español (datos editables por el dietista tras clonar la plantilla).

export type PresetId = "deportiva" | "digestivo" | "diabetico" | "embarazo" | "oncologia" | "pediatrica";

function custom(id: string, label: string, tipo: TipoCampoAnamnesis = "textarea", opciones?: string[]): PreguntaPlantilla {
  return { kind: "custom", id, label, tipo, ...(opciones ? { opciones } : {}) };
}

function conSeccionExtra(seccion: SeccionPlantilla): EstructuraPlantilla {
  return { secciones: [...estructuraBase().secciones, seccion] };
}

type PresetDef = { id: PresetId; nombre: string; estructura: EstructuraPlantilla };

export const PRESETS: PresetDef[] = [
  {
    id: "deportiva",
    nombre: "Deportiva",
    estructura: conSeccionExtra({
      id: "p_deportiva",
      titulo: "Evaluación deportiva",
      preguntas: [
        custom("dep_deporte", "Deporte / disciplina y nivel"),
        custom("dep_entrenos", "Entrenamientos: días, horas y si dobla sesiones"),
        custom("dep_pre_post", "Tomas pre y post entreno (qué y cuándo)"),
        custom("dep_suplementacion", "Suplementación deportiva"),
        custom("dep_competicion", "Objetivos de competición"),
        custom("dep_sensaciones", "Sensaciones entrenando (energía, fatiga, recuperación)"),
      ],
    }),
  },
  {
    id: "digestivo",
    nombre: "Digestivo",
    estructura: conSeccionExtra({
      id: "p_digestivo",
      titulo: "Screening digestivo",
      preguntas: [
        custom("dig_digestiones", "Digestiones e hinchazón (cuándo y con qué comidas)"),
        custom("dig_reflujo", "Ardor / reflujo / acidez"),
        custom("dig_gases", "Gases o eructos"),
        custom("dig_dolor", "Dolor abdominal (frecuencia y tipo)"),
        custom("dig_habito", "Hábito intestinal y escala de Bristol"),
        custom("dig_factores", "Factores: estrés, viajes, antibióticos, COVID…"),
      ],
    }),
  },
  {
    id: "diabetico",
    nombre: "Diabético / metabólico",
    estructura: conSeccionExtra({
      id: "p_diabetico",
      titulo: "Control metabólico",
      preguntas: [
        custom("dia_tipo", "Tipo de diabetes / alteración metabólica", "selector", [
          "Diabetes tipo 1",
          "Diabetes tipo 2",
          "Prediabetes / resistencia a la insulina",
          "Diabetes gestacional",
        ]),
        custom("dia_glucemias", "Control de glucemias (valores habituales)"),
        custom("dia_medicacion", "Medicación / insulina y pauta"),
        custom("dia_episodios", "Episodios de hipo o hiperglucemia"),
        custom("dia_hba1c", "Última HbA1c y fecha", "texto"),
      ],
    }),
  },
  {
    id: "embarazo",
    nombre: "Embarazo y fertilidad",
    estructura: conSeccionExtra({
      id: "p_embarazo",
      titulo: "Embarazo y fertilidad",
      preguntas: [
        custom("emb_estado", "Situación", "selector", [
          "Buscando embarazo",
          "Embarazada",
          "Posparto / lactancia",
          "Menopausia",
        ]),
        custom("emb_semana", "Semana de gestación / fecha probable de parto", "texto"),
        custom("emb_ciclo", "Ciclo menstrual (regularidad, dolor, abundancia)"),
        custom("emb_anticonceptivo", "Método anticonceptivo"),
        custom("emb_previos", "Embarazos previos y complicaciones"),
        custom("emb_suplementacion", "Suplementación (ácido fólico, hierro, yodo…)"),
      ],
    }),
  },
  {
    id: "oncologia",
    nombre: "Oncología",
    estructura: conSeccionExtra({
      id: "p_oncologia",
      titulo: "Oncología",
      preguntas: [
        custom("onc_tipo", "Tipo de cáncer y estadio", "texto"),
        custom("onc_tratamiento", "Tratamiento actual (quimio, radio, cirugía…)"),
        custom("onc_efectos", "Efectos secundarios (náuseas, mucositis, alteración del gusto…)"),
        custom("onc_peso", "Pérdida de peso reciente y apetito"),
        custom("onc_restricciones", "Restricciones o recomendaciones del oncólogo"),
      ],
    }),
  },
  {
    id: "pediatrica",
    nombre: "Pediátrica",
    estructura: conSeccionExtra({
      id: "p_pediatrica",
      titulo: "Pediátrica",
      preguntas: [
        custom("ped_percentiles", "Peso, talla y percentiles", "texto"),
        custom("ped_lactancia", "Lactancia y alimentación complementaria"),
        custom("ped_desarrollo", "Desarrollo y apetito"),
        custom("ped_alergias", "Alergias e intolerancias infantiles"),
        custom("ped_comedor", "Escolarización y comedor"),
      ],
    }),
  },
];

const PRESET_POR_ID = new Map<string, PresetDef>(PRESETS.map((p) => [p.id, p]));
export function getPreset(id: string): PresetDef | undefined {
  return PRESET_POR_ID.get(id);
}

/** Lista compacta de presets (id + nombre) para selectores de UI, sin arrastrar la estructura completa. */
export const PRESETS_LISTA: { id: PresetId; nombre: string }[] = PRESETS.map((p) => ({ id: p.id, nombre: p.nombre }));

// --- Saneamiento de una estructura que llega de fuera (cliente) ---

const TIPOS_CAMPO: TipoCampoAnamnesis[] = ["texto", "textarea", "selector", "checkbox", "escala"];

/** Nº de puntos de una pregunta tipo "escala" (1..ESCALA_MAX). */
export const ESCALA_MAX = 5;

/** El valor de un "checkbox" se guarda como JSON array de strings. Devuelve las opciones marcadas. */
export function parseCheckboxValue(raw: string | undefined | null): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter((x): x is string => typeof x === "string");
  } catch {
    // Compat: valores antiguos separados por comas.
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export function serializeCheckboxValue(opciones: string[]): string {
  return JSON.stringify(opciones);
}

/**
 * ¿Debe mostrarse la pregunta hija de `condicion`? `valorPropio` es la respuesta de la pregunta madre.
 * Si está vacía, no se muestra. Si `valores` está vacío, basta con cualquier respuesta; si no, debe
 * coincidir con alguno de `valores`.
 */
export function condicionCumplida(condicion: CondicionVisibilidad | undefined, valorPropio: string): boolean {
  if (!condicion) return false;
  if (!valorPropio) return false;
  if (condicion.valores.length === 0) return true; // sin valores concretos: basta con cualquier respuesta
  const actuales = parseCheckboxValue(valorPropio); // cubre casillas (JSON) y valor simple (selector/escala)
  return condicion.valores.some((v) => actuales.includes(v));
}

function sanitizeCondicion(raw: unknown): CondicionVisibilidad | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const c = raw as Record<string, unknown>;
  const pr = c.pregunta && typeof c.pregunta === "object" ? (c.pregunta as Record<string, unknown>) : undefined;
  if (!pr) return undefined;
  const id = typeof pr.id === "string" ? pr.id.trim().slice(0, 50) : "";
  const label = typeof pr.label === "string" ? pr.label.trim().slice(0, 100) : "";
  if (!id || !label) return undefined; // sin pregunta hija válida, no hay condición que aplicar
  const tipo = TIPOS_CAMPO.includes(pr.tipo as TipoCampoAnamnesis) ? (pr.tipo as TipoCampoAnamnesis) : "texto";
  let opciones: string[] | undefined;
  if ((tipo === "selector" || tipo === "checkbox") && Array.isArray(pr.opciones)) {
    const f = pr.opciones
      .filter((o): o is string => typeof o === "string" && !!o.trim())
      .map((o) => o.trim().slice(0, 100))
      .slice(0, 20);
    if (f.length) opciones = f;
  }
  const valores = Array.isArray(c.valores)
    ? c.valores
        .filter((v): v is string => typeof v === "string" && !!v.trim())
        .map((v) => v.trim().slice(0, 100))
        .slice(0, 30)
    : [];
  return { valores, pregunta: { id, label, tipo, ...(opciones ? { opciones } : {}) } };
}

/** Valida/normaliza una EstructuraPlantilla arbitraria. Si no es válida, devuelve la estructura base. */
export function sanitizeEstructura(raw: unknown): EstructuraPlantilla {
  const rawSecs = (raw as { secciones?: unknown } | null)?.secciones;
  if (!Array.isArray(rawSecs)) return estructuraBase();

  const secciones: SeccionPlantilla[] = [];
  for (const s of rawSecs.slice(0, 30)) {
    if (!s || typeof s !== "object") continue;
    const sec = s as Record<string, unknown>;
    const id = typeof sec.id === "string" ? sec.id.trim().slice(0, 50) : "";
    if (!id) continue;
    const titulo = typeof sec.titulo === "string" ? sec.titulo.trim().slice(0, 100) : undefined;
    const tituloKey = typeof sec.tituloKey === "string" ? sec.tituloKey.trim().slice(0, 100) : undefined;

    const preguntas: PreguntaPlantilla[] = [];
    const rawPregs = Array.isArray(sec.preguntas) ? sec.preguntas : [];
    for (const p of rawPregs.slice(0, 60)) {
      if (!p || typeof p !== "object") continue;
      const pr = p as Record<string, unknown>;
      const cond = sanitizeCondicion(pr.condicion);
      if (pr.kind === "builtin") {
        const ref = typeof pr.ref === "string" ? pr.ref : "";
        if (getBuiltin(ref)) {
          const lo = typeof pr.labelOverride === "string" ? pr.labelOverride.trim().slice(0, 100) : "";
          preguntas.push({ kind: "builtin", ref, ...(lo ? { labelOverride: lo } : {}), ...(cond ? { condicion: cond } : {}) });
        }
      } else if (pr.kind === "custom") {
        const cid = typeof pr.id === "string" ? pr.id.trim().slice(0, 50) : "";
        const label = typeof pr.label === "string" ? pr.label.trim().slice(0, 100) : "";
        if (!cid || !label) continue;
        const tipo = TIPOS_CAMPO.includes(pr.tipo as TipoCampoAnamnesis) ? (pr.tipo as TipoCampoAnamnesis) : "texto";
        let opciones: string[] | undefined;
        if ((tipo === "selector" || tipo === "checkbox") && Array.isArray(pr.opciones)) {
          const f = pr.opciones
            .filter((o): o is string => typeof o === "string" && !!o.trim())
            .map((o) => o.trim().slice(0, 100))
            .slice(0, 20);
          if (f.length) opciones = f;
        }
        preguntas.push({ kind: "custom", id: cid, label, tipo, ...(opciones ? { opciones } : {}), ...(cond ? { condicion: cond } : {}) });
      }
    }
    secciones.push({ id, ...(titulo ? { titulo } : {}), ...(tituloKey ? { tituloKey } : {}), preguntas });
  }

  return { secciones: secciones.length ? secciones : estructuraBase().secciones };
}

/**
 * Estructura EFECTIVA de la anamnesis de un paciente:
 * - Si tiene plantilla → su estructura (saneada).
 * - Si no → estructura base + los campos personalizados globales del dietista (compat. pre-#18),
 *   colocados en su sección o, si es "personalizado", en una sección propia al final.
 */
export function estructuraEfectiva(
  estructuraPropia: unknown | null,
  estructuraTipo: unknown | null,
  camposGlobales: CampoPersonalizadoDefinicion[],
): EstructuraPlantilla {
  if (estructuraPropia) return sanitizeEstructura(estructuraPropia);
  if (estructuraTipo) return sanitizeEstructura(estructuraTipo);

  const base = estructuraBase();
  if (!camposGlobales.length) return base;

  const seccionExtra: SeccionPlantilla = {
    id: "personalizado",
    tituloKey: "informacionExtra.camposPersonalizados",
    preguntas: [],
  };
  for (const c of camposGlobales) {
    const pregunta: PreguntaPlantilla = {
      kind: "custom",
      id: c.id,
      label: c.label,
      tipo: c.tipo,
      ...(c.opciones ? { opciones: c.opciones } : {}),
    };
    const target = base.secciones.find((s) => s.id === c.seccion);
    if (target) target.preguntas.push(pregunta);
    else seccionExtra.preguntas.push(pregunta);
  }
  if (seccionExtra.preguntas.length) base.secciones.push(seccionExtra);
  return base;
}

/** IDs de los campos custom presentes en una estructura (para sanear los valores guardados). */
export function idsCustomDeEstructura(est: EstructuraPlantilla): string[] {
  const ids: string[] = [];
  for (const s of est.secciones) {
    for (const p of s.preguntas) {
      if (p.kind === "custom") ids.push(p.id);
    }
  }
  return ids;
}
