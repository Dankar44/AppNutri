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
          color="bg-amber-500"
          trackColor="bg-amber-100"
          unit="kcal"
          icon="⚡"
        />
        <MacroBarra
          label="Grasa"
          actual={grasas}
          objetivo={grasasObj}
          color="bg-orange-500"
          trackColor="bg-orange-100"
          icon="🔴"
        />
        <MacroBarra
          label="H. Carbono"
          actual={carbohidratos}
          objetivo={carbohidratosObj}
          color="bg-green-500"
          trackColor="bg-green-100"
          icon="🟢"
        />
        <MacroBarra
          label="Proteína"
          actual={proteinas}
          objetivo={proteinasObj}
          color="bg-blue-500"
          trackColor="bg-blue-100"
          icon="🔵"
        />
        <MacroBarra
          label="Fibra"
          actual={fibra}
          objetivo={fibraObj}
          color="bg-teal-500"
          trackColor="bg-teal-100"
          icon="🟣"
        />
      </div>
    </div>
  );
}
