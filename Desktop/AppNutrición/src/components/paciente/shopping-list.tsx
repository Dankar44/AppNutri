"use client";

import { ShoppingCart } from "lucide-react";
import type { CategoriaCompra } from "@/lib/shopping-list";

interface ShoppingListProps {
  categorias: CategoriaCompra[];
}

export function ShoppingList({ categorias }: ShoppingListProps) {
  if (categorias.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No hay alimentos en el plan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categorias.map((cat) => (
        <div key={cat.categoria}>
          <h3 className="text-sm font-semibold mb-2">{cat.label}</h3>
          <div className="space-y-1">
            {cat.items.map((item) => (
              <div
                key={item.nombre}
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-border text-sm"
              >
                <span>{item.nombre}</span>
                <span className="text-muted-foreground text-xs">
                  {Math.round(item.cantidadTotal)}g
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
