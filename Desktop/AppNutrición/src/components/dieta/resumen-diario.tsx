"use client";

import { MacroBarra } from "./macro-barra";

interface ResumenDiarioProps {
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  caloriasObj?: number;
  proteinasObj?: number;
  carbohidratosObj?: number;
  grasasObj?: number;
}

export function ResumenDiario({
  calorias,
  proteinas,
  carbohidratos,
  grasas,
  caloriasObj = 2000,
  proteinasObj = 120,
  carbohidratosObj = 250,
  grasasObj = 70,
}: ResumenDiarioProps) {
  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/50">
      <MacroBarra
        label="Calorías"
        actual={calorias}
        objetivo={caloriasObj}
        color="bg-amber-500"
        unit="kcal"
      />
      <MacroBarra
        label="Proteínas"
        actual={proteinas}
        objetivo={proteinasObj}
        color="bg-blue-500"
      />
      <MacroBarra
        label="Carbohidratos"
        actual={carbohidratos}
        objetivo={carbohidratosObj}
        color="bg-green-500"
      />
      <MacroBarra
        label="Grasas"
        actual={grasas}
        objetivo={grasasObj}
        color="bg-red-500"
      />
    </div>
  );
}
