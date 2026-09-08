import { macrosDeItem, sumarMacros, type Macros } from "@/lib/macros";
import type { EntregaCongelada } from "@/lib/entrega-congelada";

/**
 * La comparativa entre alumnos: mirar de un tirón qué ha hecho cada uno con el mismo caso.
 *
 * Con veinte alumnos, leer veinte planes no es viable. Lo que ahorra tiempo de verdad son dos
 * preguntas, y por eso la tabla trae las dos (acordado con Guillermo el 8 sep 2026):
 *
 *   1. ¿Cada alumno es coherente CONSIGO MISMO? Si se puso 1.900 kcal de objetivo y entrega un
 *      plan de 1.640, se contradice, y eso es un error objetivo que se ve sin abrir nada.
 *   2. ¿Quién se sale de la CLASE? Comparando cada uno con la mediana: si veinte rondan las 1.900
 *      y uno pone 2.800, salta a la vista.
 *
 * Todo sale de la foto de la entrega, no del trabajo vivo del alumno: así los números son los del
 * día que entregó y no cambian aunque él siga tocando. Aquí no se califica nada — la nota la pone
 * el profesor; esto solo señala dónde mirar.
 */

export interface FilaComparativa {
  alumnoId: string;
  alumno: string;
  estado: string;
  /** Lo que el propio alumno se puso como objetivo diario, de su planificación. */
  objetivoKcal: number | null;
  /** Lo que de verdad suma su plan, por día. */
  planKcal: number | null;
  /** Cuánto se desvía de SU objetivo, en %. Negativo = se queda corto. */
  desvio: number | null;
  /** Reparto real del plan, en % de las calorías. */
  reparto: { proteinas: number; carbohidratos: number; grasas: number } | null;
  nota: number | null;
}

export interface Comparativa {
  filas: FilaComparativa[];
  /** La mediana de la clase, para ver quién se sale. Null si nadie ha entregado. */
  medianaKcal: number | null;
  /**
   * Lo que hizo el profesor en su propio caso, si lo hizo.
   *
   * Va arriba y destacada: es la referencia contra la que él quiere leer la clase (Guillermo, 8 sep
   * 2026: "que apareciera también el tuyo, lo que has hecho tú de tu objetivo, como profesor").
   */
  referencia: FilaComparativa | null;
}

/** Lo mínimo que hace falta para contar un plan: da igual si viene de la foto o de la base. */
export type PlanParaContar = {
  caloriasObjetivo?: number | null;
  dias?: { comidas: { alimentos: Parameters<typeof macrosDeItem>[0][] }[] }[];
};

/** Media diaria de un plan: se divide por los días que tienen algo, no por siete. */
function mediaDiaria(plan: PlanParaContar | undefined): Macros | null {
  if (!plan?.dias?.length) return null;
  const porDia = plan.dias
    .map((d) => sumarMacros(d.comidas.flatMap((c) => c.alimentos.map((a) => macrosDeItem(a)))))
    .filter((m) => m.calorias > 0);
  if (porDia.length === 0) return null;
  const total = sumarMacros(porDia);
  const n = porDia.length;
  return {
    calorias: Math.round(total.calorias / n),
    proteinas: Math.round(total.proteinas / n),
    carbohidratos: Math.round(total.carbohidratos / n),
    grasas: Math.round(total.grasas / n),
    fibra: Math.round(total.fibra / n),
  };
}

/** El % de calorías que aporta cada macro: 4 kcal/g de proteína y carbo, 9 de grasa. */
function repartoEnPorcentaje(m: Macros) {
  const kcal = m.proteinas * 4 + m.carbohidratos * 4 + m.grasas * 9;
  if (kcal <= 0) return null;
  return {
    proteinas: Math.round((m.proteinas * 4 * 100) / kcal),
    carbohidratos: Math.round((m.carbohidratos * 4 * 100) / kcal),
    grasas: Math.round((m.grasas * 9 * 100) / kcal),
  };
}

function medianaDe(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : Math.round((orden[medio - 1] + orden[medio]) / 2);
}

/**
 * Una fila a partir de un plan y de las planificaciones de quien lo hizo.
 *
 * La misma cuenta para el alumno (leyendo su foto) y para el profesor (leyendo su caso en vivo):
 * si cada uno se calculara por su lado, la referencia no sería comparable con la clase.
 */
export function filaDe(
  identidad: { alumnoId: string; alumno: string; estado: string; nota: number | null },
  plan: PlanParaContar | undefined,
  planificaciones: { esDefecto?: boolean; estado?: string; datos?: { kcalObjetivo?: unknown } | null }[],
): FilaComparativa {
  const real = mediaDiaria(plan);

  // ¿Cuál es "su objetivo"? Por orden de lo más específico a lo más general:
  //   1. Las calorías grabadas en el propio plan, si las tiene.
  //   2. Su planificación activa, siempre que tenga un objetivo puesto.
  //   3. Cualquier planificación suya con objetivo.
  // La planificación POR DEFECTO no vale como criterio: se crea sola y vacía al abrir la ficha, así
  // que cogerla dejaba la columna en «—» aunque tuviera sus 1.900 kcal en otra (8 sep 2026).
  const conObjetivo = planificaciones.filter((p) => Number(p.datos?.kcalObjetivo) > 0);
  const suya = conObjetivo.find((p) => p.estado === "activa") ?? conObjetivo[0];
  const objetivoKcal = plan?.caloriasObjetivo || Number(suya?.datos?.kcalObjetivo) || null;

  return {
    ...identidad,
    objetivoKcal,
    planKcal: real?.calorias ?? null,
    desvio: objetivoKcal && real ? Math.round(((real.calorias - objetivoKcal) / objetivoKcal) * 100) : null,
    reparto: real ? repartoEnPorcentaje(real) : null,
  };
}

export function construirComparativa(
  entregas: {
    alumnoId: string;
    alumno: string;
    estado: string;
    nota: number | null;
    /** La foto tal cual está guardada; si no entregó, no hay. */
    foto: unknown | null;
    /** El plan que eligió entregar, para no coger otro cualquiera de su ficha. */
    entregablePlanId: string | null;
  }[],
): Comparativa {
  const filas = entregas.map((e): FilaComparativa => {
    const foto = e.foto as EntregaCongelada | null;
    const plan = foto?.planes?.find((p) => p.id === e.entregablePlanId) ?? foto?.planes?.[0];
    return filaDe(
      { alumnoId: e.alumnoId, alumno: e.alumno, estado: e.estado, nota: e.nota },
      plan,
      foto?.planificaciones ?? [],
    );
  });

  return {
    filas,
    medianaKcal: medianaDe(filas.map((f) => f.planKcal).filter((n): n is number => n != null)),
    referencia: null,
  };
}
