export type Observacion = {
  id: string;
  fecha: string;
  texto: string;
};

export type DiarioAlimentario = {
  id: string;
  fecha: string;
  comida: string;
  observaciones: string;
};

export type ComportamientoAlimentario = {
  id: string;
  fecha: string;
  texto: string;
};

export type Objetivo = {
  id: string;
  tipo: "generico" | "medicion";
  descripcion: string;
  fechaLimite: string;
  tipoMedicion?: string;
  valor?: number;
  unidad?: string;
};

export type FichaSidebarData = {
  observaciones?: Observacion[];
  diarios?: DiarioAlimentario[];
  comportamientos?: ComportamientoAlimentario[];
  objetivos?: Objetivo[];
};

type TFunc = (key: string) => string;

function buildOptions(keys: readonly string[], tKey: string, t?: TFunc): { value: string; label: string }[] {
  return keys.map((k) => ({
    value: k,
    label: t ? t(`${tKey}.${k}`) : k,
  }));
}

export const TIPOS_OBJETIVO_KEYS = ["generico", "medicion"] as const;
export function getTiposObjetivo(t?: TFunc) {
  return buildOptions(TIPOS_OBJETIVO_KEYS, "tiposObjetivo", t);
}
/** @deprecated Use getTiposObjetivo(t) instead */
export const TIPOS_OBJETIVO = getTiposObjetivo();

export const TIPOS_MEDICION_KEYS = ["peso", "grasa_corporal", "masa_muscular", "perimetro_cintura", "perimetro_cadera", "glucosa", "colesterol", "trigliceridos", "otro"] as const;
export function getTiposMedicion(t?: TFunc) {
  return buildOptions(TIPOS_MEDICION_KEYS, "tiposMedicion", t);
}
/** @deprecated Use getTiposMedicion(t) instead */
export const TIPOS_MEDICION = getTiposMedicion();

export const UNIDADES_MEDICION: Record<string, string> = {
  peso: "kg",
  grasa_corporal: "%",
  masa_muscular: "kg",
  perimetro_cintura: "cm",
  perimetro_cadera: "cm",
  glucosa: "mg/dL",
  colesterol: "mg/dL",
  trigliceridos: "mg/dL",
  otro: "",
};

export const COMIDAS_KEYS = ["desayuno", "media_manana", "almuerzo", "merienda", "cena", "otro"] as const;
export function getComidas(t?: TFunc) {
  return buildOptions(COMIDAS_KEYS, "comidas", t);
}
/** @deprecated Use getComidas(t) instead */
export const COMIDAS = getComidas();
