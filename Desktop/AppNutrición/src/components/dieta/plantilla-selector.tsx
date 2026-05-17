"use client";

import { useTranslations } from "next-intl";

interface Plantilla {
  id: string;
  nombre: string;
}

interface PlantillaSelectorProps {
  plantillas: Plantilla[];
  value: string;
  onChange: (plantillaId: string) => void;
}

export function PlantillaSelector({
  plantillas,
  value,
  onChange,
}: PlantillaSelectorProps) {
  const t = useTranslations("diets");

  if (plantillas.length === 0) return null;

  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {t("plantillaSelector.title")}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
      >
        <option value="">{t("plantillaSelector.noTemplate")}</option>
        {plantillas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
