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

/**
 * Lo que aporta una línea de una comida: un alimento con su cantidad, o raciones de una receta.
 *
 * Vivía dentro de `plan-visual.tsx`, que es un componente de cliente, así que nada del servidor
 * podía usarla. Se movió aquí al hacer la comparativa entre alumnos (8 sep 2026): si cada pantalla
 * suma a su manera, los números que ve el profesor no cuadran con los que ve el alumno, y el
 * profesor corrige sobre cifras que el alumno no reconoce.
 *
 * El tipo es estructural a propósito —lo mínimo que hace falta— para no atar `lib/` a un componente.
 */
export interface ItemConMacros {
  cantidad: number;
  unidad: string;
  alimento?: { calorias: number; proteinas: number; carbohidratos: number; grasas: number; fibra?: number; porcion?: number } | null;
  /** La cantidad son raciones: los macros de la receta ya vienen por ración. */
  receta?: { calorias: number; proteinas: number; carbohidratos: number; grasas: number; fibra?: number } | null;
}

export function macrosDeItem(a: ItemConMacros): Macros {
  if (a.receta) {
    return {
      calorias: Math.round(a.receta.calorias * a.cantidad * 10) / 10,
      proteinas: Math.round(a.receta.proteinas * a.cantidad * 10) / 10,
      carbohidratos: Math.round(a.receta.carbohidratos * a.cantidad * 10) / 10,
      grasas: Math.round(a.receta.grasas * a.cantidad * 10) / 10,
      fibra: Math.round((a.receta.fibra || 0) * a.cantidad * 10) / 10,
    };
  }
  if (a.alimento) {
    return calcularMacrosPorcion(
      {
        calorias: a.alimento.calorias,
        proteinas: a.alimento.proteinas,
        carbohidratos: a.alimento.carbohidratos,
        grasas: a.alimento.grasas,
        fibra: a.alimento.fibra || 0,
      },
      convertirAGramos(a.cantidad, a.unidad, a.alimento.porcion || 100),
    );
  }
  return { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 };
}
