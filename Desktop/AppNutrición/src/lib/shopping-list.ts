import type { DisplayOverrides } from "@/lib/pdf/generate-plan-pdf";
import { vecesAPreparar } from "@/lib/receta-porciones";

type TFunc = (key: string) => string;

export const CATEGORIA_KEYS = [
  "FRUTAS", "VERDURAS", "CEREALES", "LEGUMBRES", "CARNES", "PESCADOS",
  "LACTEOS", "HUEVOS", "FRUTOS_SECOS", "ACEITES", "BEBIDAS", "CONDIMENTOS",
  "DULCES", "OTROS",
] as const;

function getCategoriaLabel(cat: string, t?: TFunc): string {
  if (t) return t(cat);
  return cat;
}

interface AlimentoEnPlan {
  cantidad: number;
  unidad?: string;
  alimento: { id: string; nombre: string; categoria: string; porcion: number; enlaceProducto?: string | null; imagenUrl?: string | null } | null;
  receta: {
    id: string;
    nombre: string;
    /** Para cuántas personas están escritos sus ingredientes (1 = una ración). */
    porciones?: number;
    /** Si vienen, la receta se desglosa en la compra en vez de salir como una línea suelta. */
    ingredientes?: IngredienteDeReceta[];
  } | null;
}

interface IngredienteDeReceta {
  alimento: {
    id?: string; nombre: string; categoria?: string | null;
    /** Gramos que pesa una unidad casera; permite unificar "3 cucharadas" con "40 g". */
    porcion?: number | null;
    enlaceProducto?: string | null; imagenUrl?: string | null;
  };
  cantidad: number;
  unidad?: string;
}

/**
 * Medidas de cocina que se pueden pasar a gramos sin perder utilidad al comprar.
 * Las de pieza (UNIDAD, LONCHA, REBANADA…) se quedan como están: "3 unidades" se
 * compra mejor que "180 g", aunque eso deje dos líneas del mismo alimento.
 */
const MEDIDAS_COCINA = new Set(["CUCHARADA", "CUCHARADITA", "TAZA", "MILILITROS"]);

function fusionableAGramos(a: string, b: string): boolean {
  const conv = (u: string) => u === "GRAMOS" || MEDIDAS_COCINA.has(u);
  return conv(a) && conv(b);
}

function aGramos(cantidad: number, unidad: string, porcion?: number | null): number {
  if (unidad === "GRAMOS" || unidad === "MILILITROS") return cantidad;
  return cantidad * (porcion && porcion > 0 ? porcion : 100);
}

interface ComidaEnPlan {
  tipo?: string;
  alimentos: AlimentoEnPlan[];
}

interface DiaEnPlan {
  dia?: string;
  comidas: ComidaEnPlan[];
}

export interface ItemCompra {
  nombre: string;
  cantidadTotal: number;
  unidad: string;
  categoria: string;
  enlaceProducto?: string | null;
  imagenUrl?: string | null;
}

export interface CategoriaCompra {
  categoria: string;
  label: string;
  items: ItemCompra[];
}

export function generarListaCompra(dias: DiaEnPlan[], overrides?: DisplayOverrides, t?: TFunc): CategoriaCompra[] {
  const acumulado = new Map<string, ItemCompra>();
  /** Porciones totales de cada receta en toda la semana, para comprar sus ingredientes una vez. */
  const recetasUsadas = new Map<string, { receta: NonNullable<AlimentoEnPlan["receta"]>; porciones: number }>();

  /**
   * Acumula por ALIMENTO, no por alimento+unidad: al desglosar las recetas el mismo
   * producto llega en gramos (línea suelta) y en cucharadas (ingrediente), y salían dos
   * líneas — "40 g de aceite" y "3 cda de aceite" son la misma botella. Cuando las dos
   * unidades se pueden pasar a gramos, se unifican.
   */
  function acumular(key: string, item: ItemCompra, porcionGramos?: number | null) {
    const existing = acumulado.get(key);
    if (!existing) { acumulado.set(key, item); return; }
    if (existing.unidad === item.unidad) {
      existing.cantidadTotal += item.cantidadTotal;
      return;
    }
    if (fusionableAGramos(existing.unidad, item.unidad)) {
      existing.cantidadTotal =
        aGramos(existing.cantidadTotal, existing.unidad, porcionGramos) +
        aGramos(item.cantidadTotal, item.unidad, porcionGramos);
      existing.unidad = "GRAMOS";
      return;
    }
    // Unidades no convertibles (2 unidades + 30 g): se dejan en líneas separadas, que
    // "3 unidades" se compra mejor que "180 g".
    acumulado.set(`${key}-${item.unidad}`, item);
  }

  for (const dia of dias) {
    for (const comida of dia.comidas) {
      for (let aIdx = 0; aIdx < comida.alimentos.length; aIdx++) {
        const a = comida.alimentos[aIdx];
        const ovKey = dia.dia && comida.tipo ? `${dia.dia}-${comida.tipo}-${aIdx}` : "";
        const ov = ovKey && overrides ? overrides[ovKey] : undefined;

        if (ov?.libre) continue;

        const displayQty = ov?.cantidad ?? a.cantidad;
        const displayUnit = ov?.unidad ?? a.unidad ?? "GRAMOS";

        if (a.alimento) {
          acumular(`${a.alimento.id}`, {
            nombre: a.alimento.nombre,
            cantidadTotal: displayQty,
            unidad: displayUnit,
            categoria: a.alimento.categoria,
            enlaceProducto: a.alimento.enlaceProducto || null,
            imagenUrl: a.alimento.imagenUrl || null,
          }, a.alimento.porcion);
        } else if (a.receta) {
          // En una receta la cantidad son PORCIONES: se suman las de toda la semana y
          // los ingredientes se resuelven después, de una vez.
          const prev = recetasUsadas.get(a.receta.id);
          if (prev) prev.porciones += displayQty;
          else recetasUsadas.set(a.receta.id, { receta: a.receta, porciones: displayQty });
        }
      }
    }
  }

  for (const { receta, porciones } of recetasUsadas.values()) {
    const ingredientes = receta.ingredientes ?? [];
    if (ingredientes.length === 0) {
      // Sin ingredientes a mano (consultas que no los traen): al menos la línea de la
      // receta con sus porciones reales, en vez de "1 ud" pusiera lo que pusiera.
      acumular(`receta-${receta.id}`, {
        nombre: `${receta.nombre} (receta)`,
        cantidadTotal: porciones,
        unidad: "PORCIONES",
        categoria: "OTROS",
      });
      continue;
    }

    // Plato: cantidad exacta. Tanda (bizcocho, tarro de salsa): se compra entera.
    const factor = vecesAPreparar(porciones, receta.porciones);

    for (const ing of ingredientes) {
      const unidad = ing.unidad || "GRAMOS";
      acumular(`${ing.alimento.id ?? ing.alimento.nombre}`, {
        nombre: ing.alimento.nombre,
        cantidadTotal: ing.cantidad * factor,
        unidad,
        categoria: ing.alimento.categoria || "OTROS",
        enlaceProducto: ing.alimento.enlaceProducto || null,
        imagenUrl: ing.alimento.imagenUrl || null,
      }, ing.alimento.porcion);
    }
  }

  const porCategoria = new Map<string, ItemCompra[]>();
  for (const item of acumulado.values()) {
    const cat = item.categoria;
    if (!porCategoria.has(cat)) porCategoria.set(cat, []);
    porCategoria.get(cat)!.push(item);
  }

  return Array.from(porCategoria.entries())
    .map(([cat, items]) => ({
      categoria: cat,
      label: getCategoriaLabel(cat, t),
      items: items.sort((a, b) => a.nombre.localeCompare(b.nombre)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
