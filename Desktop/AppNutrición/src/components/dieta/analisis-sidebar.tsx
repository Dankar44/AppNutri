"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("diets");

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          {t("analisisSidebar.title")}
        </h3>
      </div>
      <div className="px-5 py-4 space-y-4">
        <MacroBarra
          label={t("analisisSidebar.energy")}
          actual={calorias}
          objetivo={caloriasObj}
          color="bg-purple-400"
          trackColor="bg-purple-50 dark:bg-purple-500/10"
          unit="kcal"
          icon="⚡"
        />
        <MacroBarra
          label={t("analisisSidebar.fat")}
          actual={grasas}
          objetivo={grasasObj}
          color="bg-yellow-400"
          trackColor="bg-yellow-50 dark:bg-yellow-500/10"
          icon="◎"
        />
        <MacroBarra
          label={t("analisisSidebar.carbs")}
          actual={carbohidratos}
          objetivo={carbohidratosObj}
          color="bg-orange-300"
          trackColor="bg-orange-50 dark:bg-orange-500/10"
          icon="◯"
        />
        <MacroBarra
          label={t("analisisSidebar.protein")}
          actual={proteinas}
          objetivo={proteinasObj}
          color="bg-blue-400"
          trackColor="bg-blue-50 dark:bg-blue-500/10"
          icon="◇"
        />
        <MacroBarra
          label={t("analisisSidebar.fiber")}
          actual={fibra}
          objetivo={fibraObj}
          color="bg-emerald-400"
          trackColor="bg-emerald-50 dark:bg-emerald-500/10"
          icon="△"
        />
      </div>
    </div>
  );
}
