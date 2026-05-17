"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("diets");

  return (
    <div className="space-y-2 p-3 rounded-lg bg-muted/50">
      <MacroBarra
        label={t("resumenDiario.calories")}
        actual={calorias}
        objetivo={caloriasObj}
        color="bg-amber-500"
        unit="kcal"
      />
      <MacroBarra
        label={t("resumenDiario.proteins")}
        actual={proteinas}
        objetivo={proteinasObj}
        color="bg-blue-500"
      />
      <MacroBarra
        label={t("resumenDiario.carbs")}
        actual={carbohidratos}
        objetivo={carbohidratosObj}
        color="bg-green-500"
      />
      <MacroBarra
        label={t("resumenDiario.fats")}
        actual={grasas}
        objetivo={grasasObj}
        color="bg-red-500"
      />
    </div>
  );
}
