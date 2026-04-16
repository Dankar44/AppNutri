"use client";

import { MacroBarra } from "./macro-barra";

interface AnalisisSidebarProps {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra?: number;
  caloriasObj?: number;
  proteinasObj?: number;
  carbohidratosObj?: number;
  grasasObj?: number;
  fibraObj?: number;
}

export function AnalisisSidebar({
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  fibra = 0,
  caloriasObj = 2000,
  proteinasObj = 120,
  carbohidratosObj = 250,
  grasasObj = 70,
  fibraObj = 32,
}: AnalisisSidebarProps) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          Análisis global
        </h3>
      </div>
      <div className="px-5 py-4 space-y-4">
        <MacroBarra
          label="Energía"
          actual={calorias}
          objetivo={caloriasObj}
          color="bg-purple-400"
          trackColor="bg-purple-50"
          unit="kcal"
          icon="⚡"
        />
        <MacroBarra
          label="Grasa"
          actual={grasas}
          objetivo={grasasObj}
          color="bg-yellow-400"
          trackColor="bg-yellow-50"
          icon="◎"
        />
        <MacroBarra
          label="H. Carbono"
          actual={carbohidratos}
          objetivo={carbohidratosObj}
          color="bg-orange-300"
          trackColor="bg-orange-50"
          icon="◯"
        />
        <MacroBarra
          label="Proteína"
          actual={proteinas}
          objetivo={proteinasObj}
          color="bg-blue-400"
          trackColor="bg-blue-50"
          icon="◇"
        />
        <MacroBarra
          label="Fibra"
          actual={fibra}
          objetivo={fibraObj}
          color="bg-emerald-400"
          trackColor="bg-emerald-50"
          icon="△"
        />
      </div>
    </div>
  );
}
