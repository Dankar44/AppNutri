const CATEGORIA_LABELS: Record<string, string> = {
  FRUTAS: "Frutas", VERDURAS: "Verduras", CEREALES: "Cereales",
  LEGUMBRES: "Legumbres", CARNES: "Carnes", PESCADOS: "Pescados",
  LACTEOS: "Lácteos", HUEVOS: "Huevos", FRUTOS_SECOS: "Frutos secos",
  ACEITES: "Aceites", BEBIDAS: "Bebidas", CONDIMENTOS: "Condimentos",
  DULCES: "Dulces", OTROS: "Otros",
};

interface AlimentoEnPlan {
  cantidad: number;
  alimento: { id: string; nombre: string; categoria: string; porcion: number } | null;
  receta: { id: string; nombre: string } | null;
}

interface ComidaEnPlan {
  alimentos: AlimentoEnPlan[];
}

interface DiaEnPlan {
  comidas: ComidaEnPlan[];
}

export interface ItemCompra {
  nombre: string;
  cantidadTotal: number;
  categoria: string;
}

export interface CategoriaCompra {
  categoria: string;
  label: string;
  items: ItemCompra[];
}

export function generarListaCompra(dias: DiaEnPlan[]): CategoriaCompra[] {
  const acumulado = new Map<string, ItemCompra>();

  for (const dia of dias) {
    for (const comida of dia.comidas) {
      for (const a of comida.alimentos) {
        if (a.alimento) {
          const key = a.alimento.id;
          const existing = acumulado.get(key);
          if (existing) {
            existing.cantidadTotal += a.cantidad;
          } else {
            acumulado.set(key, {
              nombre: a.alimento.nombre,
              cantidadTotal: a.cantidad,
              categoria: a.alimento.categoria,
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
