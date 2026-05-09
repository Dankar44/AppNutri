import type { DisplayOverrides } from "@/lib/pdf/generate-plan-pdf";

const CATEGORIA_LABELS: Record<string, string> = {
  FRUTAS: "Frutas", VERDURAS: "Verduras", CEREALES: "Cereales",
  LEGUMBRES: "Legumbres", CARNES: "Carnes", PESCADOS: "Pescados",
  LACTEOS: "Lácteos", HUEVOS: "Huevos", FRUTOS_SECOS: "Frutos secos",
  ACEITES: "Aceites", BEBIDAS: "Bebidas", CONDIMENTOS: "Condimentos",
  DULCES: "Dulces", OTROS: "Otros",
};

interface AlimentoEnPlan {
  cantidad: number;
  unidad?: string;
  alimento: { id: string; nombre: string; categoria: string; porcion: number; enlaceProducto?: string | null; imagenUrl?: string | null } | null;
  receta: { id: string; nombre: string } | null;
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

export function generarListaCompra(dias: DiaEnPlan[], overrides?: DisplayOverrides): CategoriaCompra[] {
  const acumulado = new Map<string, ItemCompra>();

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
          const key = `${a.alimento.id}-${displayUnit}`;
          const existing = acumulado.get(key);
          if (existing) {
            existing.cantidadTotal += displayQty;
          } else {
            acumulado.set(key, {
              nombre: a.alimento.nombre,
              cantidadTotal: displayQty,
              unidad: displayUnit,
              categoria: a.alimento.categoria,
              enlaceProducto: a.alimento.enlaceProducto || null,
              imagenUrl: a.alimento.imagenUrl || null,
            });
          }
        } else if (a.receta) {
          const key = `receta-${a.receta.id}`;
          const existing = acumulado.get(key);
          if (existing) {
            existing.cantidadTotal += 1;
          } else {
            acumulado.set(key, {
              nombre: `${a.receta.nombre} (receta)`,
              cantidadTotal: 1,
              unidad: "UNIDAD",
              categoria: "OTROS",
            });
          }
        }
      }
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
      label: CATEGORIA_LABELS[cat] || cat,
      items: items.sort((a, b) => a.nombre.localeCompare(b.nombre)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
