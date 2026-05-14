/** Datos de la pestaña Información (JSON en pacientes.fichaInformacion) */

export type TipoCampoAnamnesis = "texto" | "textarea" | "selector";

export type SeccionAnamnesis =
  | "consulta"
  | "personalSocial"
  | "clinica"
  | "alimentaria"
  | "personalizado";

export type CampoPersonalizadoDefinicion = {
  id: string;
  label: string;
  tipo: TipoCampoAnamnesis;
  opciones?: string[];
  seccion: SeccionAnamnesis;
};

export type FichaInformacionData = {
  consulta?: {
    motivo?: string;
    expectativas?: string;
    objetivosClinicos?: string;
    objetivosClinicosDetalle?: string;
    otras?: string;
  };
  personalSocial?: {
    funcionIntestinal?: string;
    funcionIntestinalDetalle?: string;
    calidadSueno?: string;
    calidadSuenoDetalle?: string;
    fumador?: string;
    fumadorDetalle?: string;
    alcohol?: string;
    alcoholDetalle?: string;
    estadoCivil?: string;
    estadoCivilDetalle?: string;
    actividadFisica?: string;
    raza?: string;
    razaDetalle?: string;
    otrasPersonal?: string;
  };
  clinica?: {
    patologiasDetalle?: string;
    medicacion?: string;
    antecedentesPersonales?: string;
    antecedentesFamiliares?: string;
    otrasClinicas?: string;
  };
  alimentaria?: {
    horaLevantarse?: string;
    horaAcostarse?: string;
    tiposDieta?: string;
    tiposDietaDetalle?: string;
    alimentosFavoritos?: string;
    alimentosRechazados?: string;
    alergiasResumen?: string;
    alergiasDetalle?: string;
    intoleranciasResumen?: string;
    intoleranciasDetalle?: string;
    deficiencias?: string;
    deficienciasDetalle?: string;
    ingestaAgua?: string;
    otrasAlimentaria?: string;
  };
  camposPersonalizados?: Record<string, string>;
};

export const OPCION_VACIA = "__ninguno__";

export const SELECT_SI_NO_OCASION = [
  { value: OPCION_VACIA, label: "Selecciona una opción" },
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
  { value: "ocasional", label: "Ocasional" },
];

export const SELECT_ESTADO_CIVIL = [
  { value: OPCION_VACIA, label: "Selecciona una opción" },
  { value: "soltero", label: "Soltero/a" },
  { value: "pareja", label: "Pareja" },
  { value: "casado", label: "Casado/a" },
  { value: "divorciado", label: "Divorciado/a" },
  { value: "viudo", label: "Viudo/a" },
  { value: "otro", label: "Otro" },
];

export const SELECT_FUNCION_INTESTINAL = [
  { value: OPCION_VACIA, label: "Selecciona una opción" },
  { value: "normal", label: "Normal" },
  { value: "estrenimiento", label: "Estreñimiento" },
  { value: "diarrea", label: "Diarrea" },
  { value: "alterna", label: "Alterna" },
  { value: "otro", label: "Otro" },
];

export const SELECT_CALIDAD_SUENO = [
  { value: OPCION_VACIA, label: "Selecciona una opción" },
  { value: "buena", label: "Buena" },
  { value: "regular", label: "Regular" },
  { value: "mala", label: "Mala" },
];

export const SELECT_TIPOS_DIETA = [
  { value: OPCION_VACIA, label: "Ninguno" },
  { value: "mediterranea", label: "Mediterránea" },
  { value: "vegetariana", label: "Vegetariana" },
  { value: "vegana", label: "Vegana" },
  { value: "keto", label: "Cetogénica / baja en HC" },
  { value: "hipocalorica", label: "Hipocalórica" },
  { value: "otra", label: "Otra" },
];

export const SELECT_INGESTA_AGUA = [
  { value: OPCION_VACIA, label: "Selecciona una opción" },
  { value: "baja", label: "Baja" },
  { value: "adecuada", label: "Adecuada" },
  { value: "alta", label: "Alta" },
];

export const SELECT_OBJETIVOS_CLINICOS = [
  { value: OPCION_VACIA, label: "Ninguno" },
  { value: "control_peso", label: "Control de peso" },
  { value: "patologia", label: "Patología metabólica" },
  { value: "deportivo", label: "Rendimiento deportivo" },
  { value: "otro", label: "Otro" },
];
