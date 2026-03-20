export interface AIAlimento {
  nombre: string;
  cantidadGramos: number;
  estimacion: {
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
  };
}

export interface AIComida {
  tipo: string;
  alimentos: AIAlimento[];
}

export interface AIDia {
  dia: string;
  comidas: AIComida[];
}

export interface AIPlanGenerado {
  nombre: string;
  dias: AIDia[];
}

export interface MacroObjetivos {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}
