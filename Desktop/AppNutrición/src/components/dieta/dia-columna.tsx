"use client";

import { ComidaSlot } from "./comida-slot";
import { ResumenDiario } from "./resumen-diario";
import { calcularMacrosPorcion, sumarMacros } from "@/lib/macros";

const DIA_LABELS: Record<string, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

interface AlimentoData {
  id: string;
  nombre: string;
  cantidad: number;
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
}

export function DiaColumna({
  dia,
  comidas,
  objetivos,
  onAddAlimento,
  onRemoveAlimento,
  onCantidadChange,
}: DiaColumnaProps) {
  const todosAlimentos = comidas.flatMap((c) => c.alimentos);
  const macrosDia = sumarMacros(
    todosAlimentos.map((a) =>
      calcularMacrosPorcion(
        {
          calorias: a.calorias,
          proteinas: a.proteinas,
          carbohidratos: a.carbohidratos,
          grasas: a.grasas,
          fibra: 0,
        },
        a.cantidad
      )
    )
  );

  return (
    <div className="min-w-[220px] flex flex-col">
      <div className="text-center font-semibold text-sm py-2 border-b border-border bg-muted/50 rounded-t-lg sticky top-0">
        {DIA_LABELS[dia] || dia}
      </div>
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
