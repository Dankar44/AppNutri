export interface Macros {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
}

const UNITS_GRAMOS_DIRECTOS = new Set(["GRAMOS", "MILILITROS"]);

export function convertirAGramos(
  cantidad: number,
  unidad: string,
  porcionGramos: number,
): number {
  if (UNITS_GRAMOS_DIRECTOS.has(unidad)) return cantidad;
  return cantidad * (porcionGramos || 100);
}

export function calcularMacrosConUnidad(
  macrosPor100g: Macros,
  cantidad: number,
  unidad: string,
  porcionGramos: number,
): Macros {
  return calcularMacrosPorcion(macrosPor100g, convertirAGramos(cantidad, unidad, porcionGramos));
}

export function calcularMacrosPorcion(
  macrosPor100g: Macros,
  cantidadGramos: number
): Macros {
  const factor = cantidadGramos / 100;
  return {
    calorias: Math.round(macrosPor100g.calorias * factor * 10) / 10,
    proteinas: Math.round(macrosPor100g.proteinas * factor * 10) / 10,
    carbohidratos: Math.round(macrosPor100g.carbohidratos * factor * 10) / 10,
    grasas: Math.round(macrosPor100g.grasas * factor * 10) / 10,
    fibra: Math.round(macrosPor100g.fibra * factor * 10) / 10,
  };
}

export function sumarMacros(lista: Macros[]): Macros {
  return lista.reduce(
    (acc, m) => ({
      calorias: Math.round((acc.calorias + m.calorias) * 10) / 10,
      proteinas: Math.round((acc.proteinas + m.proteinas) * 10) / 10,
      carbohidratos: Math.round((acc.carbohidratos + m.carbohidratos) * 10) / 10,
      grasas: Math.round((acc.grasas + m.grasas) * 10) / 10,
      fibra: Math.round((acc.fibra + m.fibra) * 10) / 10,
    }),
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 }
  );
}

export function macrosVacios(): Macros {
  return { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 };
}
