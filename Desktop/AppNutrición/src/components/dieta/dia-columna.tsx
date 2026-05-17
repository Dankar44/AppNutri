"use client";

import { useTranslations } from "next-intl";
import { ComidaSlot } from "./comida-slot";
import { ResumenDiario } from "./resumen-diario";
import { calcularMacrosPorcion, sumarMacros, convertirAGramos } from "@/lib/macros";

interface AlimentoData {
  id: string;
  nombre: string;
  cantidad: number;
  unidad?: string;
  porcion?: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  esReceta?: boolean;
}

interface ComidaData {
  id: string;
  tipo: string;
  descripcion?: string | null;
  alimentos: AlimentoData[];
}

interface DiaColumnaProps {
  dia: string;
  comidas: ComidaData[];
  objetivos?: {
    calorias?: number;
    proteinas?: number;
    carbohidratos?: number;
    grasas?: number;
  };
  onAddAlimento: (comidaId: string) => void;
  onRemoveAlimento: (alimentoEnComidaId: string) => void;
  onCantidadChange: (alimentoEnComidaId: string, cantidad: number) => void;
  compactHeader?: boolean;
  showDayHeader?: boolean;
}

export function DiaColumna({
  dia,
  comidas,
  objetivos,
  onAddAlimento,
  onRemoveAlimento,
  onCantidadChange,
  compactHeader = false,
  showDayHeader = true,
}: DiaColumnaProps) {
  const t = useTranslations("diets");
  const todosAlimentos = comidas.flatMap((c) => c.alimentos);
  const macrosDia = sumarMacros(
    todosAlimentos.map((a) => {
      if (a.esReceta) {
        // Recetas: macros son por porción, cantidad = nº porciones
        return {
          calorias: Math.round(a.calorias * a.cantidad * 10) / 10,
          proteinas: Math.round(a.proteinas * a.cantidad * 10) / 10,
          carbohidratos: Math.round(a.carbohidratos * a.cantidad * 10) / 10,
          grasas: Math.round(a.grasas * a.cantidad * 10) / 10,
          fibra: 0,
        };
      }
      return calcularMacrosPorcion(
        { calorias: a.calorias, proteinas: a.proteinas, carbohidratos: a.carbohidratos, grasas: a.grasas, fibra: 0 },
        convertirAGramos(a.cantidad, a.unidad || "GRAMOS", a.porcion || 100)
      );
    })
  );

  return (
    <div className="flex-1 min-w-0 flex flex-col snap-start">
      {showDayHeader && (
        <div className="text-center font-semibold text-sm py-2 border-b border-border bg-muted/50 rounded-t-lg sticky top-0">
          {t(`editor.dayLabels.${dia}` as any) || dia}
        </div>
      )}
      <div className="flex-1 p-2 space-y-3 border-x border-border">
        {comidas.map((comida) => (
          <ComidaSlot
            key={comida.id}
            comidaId={comida.id}
            tipo={comida.tipo}
            descripcion={comida.descripcion}
            alimentos={comida.alimentos}
            onAdd={onAddAlimento}
            onRemove={onRemoveAlimento}
            onCantidadChange={onCantidadChange}
            compactHeader={compactHeader}
          />
        ))}
      </div>
      <div className="border border-border rounded-b-lg">
        <ResumenDiario
          calorias={macrosDia.calorias}
          proteinas={macrosDia.proteinas}
          carbohidratos={macrosDia.carbohidratos}
          grasas={macrosDia.grasas}
          caloriasObj={objetivos?.calorias}
          proteinasObj={objetivos?.proteinas}
          carbohidratosObj={objetivos?.carbohidratos}
          grasasObj={objetivos?.grasas}
        />
      </div>
    </div>
  );
}
