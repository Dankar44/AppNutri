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

type TFunc = (key: string) => string;

function buildOptions(keys: readonly string[], tKey: string, t?: TFunc): { value: string; label: string }[] {
  return keys.map((k) => ({
    value: k,
    label: t ? t(`${tKey}.${k}`) : k,
  }));
}

export const SELECT_SI_NO_OCASION_KEYS = [OPCION_VACIA, "si", "no", "ocasional"] as const;
export function getSelectSiNoOcasion(t?: TFunc) {
  return buildOptions(SELECT_SI_NO_OCASION_KEYS, "selectSiNoOcasion", t);
}
/** @deprecated Use getSelectSiNoOcasion(t) instead */
export const SELECT_SI_NO_OCASION = getSelectSiNoOcasion();

export const SELECT_ESTADO_CIVIL_KEYS = [OPCION_VACIA, "soltero", "pareja", "casado", "divorciado", "viudo", "otro"] as const;
export function getSelectEstadoCivil(t?: TFunc) {
  return buildOptions(SELECT_ESTADO_CIVIL_KEYS, "selectEstadoCivil", t);
}
/** @deprecated Use getSelectEstadoCivil(t) instead */
export const SELECT_ESTADO_CIVIL = getSelectEstadoCivil();

export const SELECT_FUNCION_INTESTINAL_KEYS = [OPCION_VACIA, "normal", "estrenimiento", "diarrea", "alterna", "otro"] as const;
export function getSelectFuncionIntestinal(t?: TFunc) {
  return buildOptions(SELECT_FUNCION_INTESTINAL_KEYS, "selectFuncionIntestinal", t);
}
/** @deprecated Use getSelectFuncionIntestinal(t) instead */
export const SELECT_FUNCION_INTESTINAL = getSelectFuncionIntestinal();

export const SELECT_CALIDAD_SUENO_KEYS = [OPCION_VACIA, "buena", "regular", "mala"] as const;
export function getSelectCalidadSueno(t?: TFunc) {
  return buildOptions(SELECT_CALIDAD_SUENO_KEYS, "selectCalidadSueno", t);
}
/** @deprecated Use getSelectCalidadSueno(t) instead */
export const SELECT_CALIDAD_SUENO = getSelectCalidadSueno();

export const SELECT_TIPOS_DIETA_KEYS = [OPCION_VACIA, "mediterranea", "vegetariana", "vegana", "keto", "hipocalorica", "otra"] as const;
export function getSelectTiposDieta(t?: TFunc) {
  return buildOptions(SELECT_TIPOS_DIETA_KEYS, "selectTiposDieta", t);
}
/** @deprecated Use getSelectTiposDieta(t) instead */
export const SELECT_TIPOS_DIETA = getSelectTiposDieta();

export const SELECT_INGESTA_AGUA_KEYS = [OPCION_VACIA, "baja", "adecuada", "alta"] as const;
export function getSelectIngestaAgua(t?: TFunc) {
  return buildOptions(SELECT_INGESTA_AGUA_KEYS, "selectIngestaAgua", t);
}
/** @deprecated Use getSelectIngestaAgua(t) instead */
export const SELECT_INGESTA_AGUA = getSelectIngestaAgua();

export const SELECT_OBJETIVOS_CLINICOS_KEYS = [OPCION_VACIA, "control_peso", "patologia", "deportivo", "otro"] as const;
export function getSelectObjetivosClinicos(t?: TFunc) {
  return buildOptions(SELECT_OBJETIVOS_CLINICOS_KEYS, "selectObjetivosClinicos", t);
}
/** @deprecated Use getSelectObjetivosClinicos(t) instead */
export const SELECT_OBJETIVOS_CLINICOS = getSelectObjetivosClinicos();
