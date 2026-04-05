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

export const TIPOS_OBJETIVO = [
  { value: "generico", label: "Genérico (Hábitos deportivos, alimentarios y otros)" },
  { value: "medicion", label: "Medición (Datos antropométricos, analíticos, composición corporal)" },
];

export const TIPOS_MEDICION = [
  { value: "peso", label: "Peso" },
  { value: "grasa_corporal", label: "% Grasa corporal" },
  { value: "masa_muscular", label: "Masa muscular" },
  { value: "perimetro_cintura", label: "Perímetro cintura" },
  { value: "perimetro_cadera", label: "Perímetro cadera" },
  { value: "glucosa", label: "Glucosa" },
  { value: "colesterol", label: "Colesterol total" },
  { value: "trigliceridos", label: "Triglicéridos" },
  { value: "otro", label: "Otro" },
];

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

export const COMIDAS = [
  { value: "desayuno", label: "Desayuno" },
  { value: "media_manana", label: "Media mañana" },
  { value: "almuerzo", label: "Almuerzo" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
  { value: "otro", label: "Otro" },
];
