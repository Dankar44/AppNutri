import type { Macros } from "@/lib/macros";

interface AlimentoParaSugerir {
  id: string;
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  porcion: number;
}

export interface AlimentoSugerido extends AlimentoParaSugerir {
  razon: string;
  score: number;
}

export function sugerirComplementos(
  macrosActuales: Macros,
  macrosObjetivo: Macros,
  alimentosDisponibles: AlimentoParaSugerir[]
): AlimentoSugerido[] {
  const deficit = {
    proteinas: Math.max(0, macrosObjetivo.proteinas - macrosActuales.proteinas),
    carbohidratos: Math.max(0, macrosObjetivo.carbohidratos - macrosActuales.carbohidratos),
    grasas: Math.max(0, macrosObjetivo.grasas - macrosActuales.grasas),
    calorias: Math.max(0, macrosObjetivo.calorias - macrosActuales.calorias),
  };

  const mayorDeficit = Object.entries(deficit)
    .filter(([k]) => k !== "calorias")
    .sort(([, a], [, b]) => b - a)[0];

  const scored = alimentosDisponibles.map((alimento) => {
    let score = 0;
    let razon = "";

    const factor = alimento.porcion / 100;

    if (mayorDeficit[0] === "proteinas" && deficit.proteinas > 5) {
      score = alimento.proteinas * factor;
      razon = "Alto en proteínas";
    } else if (mayorDeficit[0] === "carbohidratos" && deficit.carbohidratos > 10) {
      score = alimento.carbohidratos * factor;
      razon = "Fuente de carbohidratos";
    } else if (mayorDeficit[0] === "grasas" && deficit.grasas > 5) {
      score = alimento.grasas * factor;
      razon = "Fuente de grasas saludables";
    } else {
      const calPorPorcion = alimento.calorias * factor;
      if (deficit.calorias > 100 && calPorPorcion > 50) {
        score = calPorPorcion / 10;
        razon = "Aporta calorías";
      }
    }

    if (alimento.calorias * factor > deficit.calorias * 0.5 && deficit.calorias > 0) {
      score *= 0.5;
    }

    return { ...alimento, razon, score };
  });

  return scored
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
