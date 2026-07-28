/**
 * Raciones de receta — única fuente de verdad del escalado y de cómo se lee.
 *
 * Convención: **1 ración = 1 persona**. `Receta.porciones` dice para cuántas personas
 * están puestos los ingredientes, y `AlimentoEnComida.cantidad` (cuando la línea es una
 * receta) dice cuántas raciones se sirven en esa comida. El catálogo está normalizado a
 * 1 ración salvo las tandas (ver scripts/data/recetas-tanda.ts).
 *
 * Dos reglas que hay que respetar en cualquier pantalla nueva:
 *
 * 1. Los ingredientes no se muestran tal cual — se pasan por `ingredientesDeReceta()`.
 *    Los macros de la receta (`calorias`, …) sí están guardados POR RACIÓN, así que esos
 *    solo se multiplican por las raciones servidas.
 * 2. La cantidad no se formatea con `formatQuantity`: las recetas se guardan con
 *    `unidad = GRAMOS` (default del schema), así que "0,5 raciones" salía como "1g".
 *    Se usa `etiquetaPorciones()`.
 */

function rindeDe(porcionesReceta: number | null | undefined): number {
  return Number(porcionesReceta) > 0 ? Number(porcionesReceta) : 1;
}

function servidas(porcionesServidas: number | null | undefined): number {
  const n = Number(porcionesServidas);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Cómo presentar los ingredientes de una receta: por cuánto multiplicarlos y, si es una
 * tanda, para cuántas raciones sale.
 *
 * Una receta que rinde más de una ración es una TANDA (un bizcocho, un tarro de pesto,
 * una olla de caldo): sus ingredientes NO se escalan, porque no se puede cocinar un
 * octavo de bizcocho — se muestran enteros diciendo cuántas raciones salen. Un plato
 * (rinde 1) sí se escala a lo que come el paciente.
 */
export function ingredientesDeReceta(
  porcionesServidas: number | null | undefined,
  porcionesReceta: number | null | undefined,
): { factor: number; rindeRaciones: number | null } {
  const rinde = rindeDe(porcionesReceta);
  if (rinde > 1) return { factor: 1, rindeRaciones: rinde };
  return { factor: servidas(porcionesServidas), rindeRaciones: null };
}

/**
 * Cuántas veces hay que preparar la receta —y por tanto comprar sus ingredientes— para
 * cubrir las raciones que se comen en el plan.
 *
 * Un plato se compra por la cantidad exacta (1,5 raciones = 1,5 veces los ingredientes).
 * Una tanda se compra entera: si come 3 raciones de un bizcocho de 8, hay que comprar
 * para UN bizcocho, no 3/8 de huevo.
 */
export function vecesAPreparar(
  porcionesTotales: number,
  porcionesReceta: number | null | undefined,
): number {
  const rinde = rindeDe(porcionesReceta);
  return rinde === 1 ? servidas(porcionesTotales) : Math.ceil(servidas(porcionesTotales) / rinde);
}

/** Redondeo de raciones para mostrar: 0,5 · 1 · 1,5 (nunca 1,3333). */
function redondearPorciones(cantidad: number): number {
  if (!Number.isFinite(cantidad)) return 0;
  return Number.isInteger(cantidad) ? cantidad : Math.round(cantidad * 10) / 10;
}

/**
 * Cómo se lee la cantidad de una línea de receta: "2 raciones", "media ración"…
 * **Devuelve null cuando es 1 ración**, que es el caso por defecto: "Ensalada César ·
 * 1 ración" no informa de nada; informa cuando NO es una. Los textos llegan de fuera
 * porque cada pantalla los traduce con su propio next-intl.
 */
export function etiquetaPorciones(
  cantidad: number,
  textos: { media: string; varias: (n: number) => string },
): string | null {
  const n = redondearPorciones(cantidad);
  if (n === 1) return null;
  if (n === 0.5) return textos.media;
  return textos.varias(n);
}
