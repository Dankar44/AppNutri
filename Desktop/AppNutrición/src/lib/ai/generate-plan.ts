import { callWithRetry, getGroqModel } from "@/lib/openai";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type { AIPlanGenerado, MacroObjetivos } from "./types";

interface PacienteData {
  nombre: string;
  sexo?: string | null;
  peso?: number | null;
  altura?: number | null;
  objetivo: string;
  objetivoDetalle?: string | null;
  alergias: string[];
  intolerancias: string[];
  patologias: string[];
  preferencias: string[];
}

interface AlimentoDB {
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

interface RecetaDB {
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  porciones: number;
}

export async function generateDietPlan(
  paciente: PacienteData,
  objetivos: MacroObjetivos,
  instrucciones: string,
  alimentos: AlimentoDB[],
  recetas: RecetaDB[]
): Promise<{ plan: AIPlanGenerado; promptUsado: string }> {
  const userPrompt = buildUserPrompt(paciente, objetivos, instrucciones, alimentos, recetas);
  const model = getGroqModel();

  const plan = await callWithRetry(async (client) => {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 8192,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("La IA no generó respuesta");

    const parsed = JSON.parse(content) as AIPlanGenerado;
    if (!parsed.dias || !Array.isArray(parsed.dias) || parsed.dias.length < 7) {
      throw new Error(`La IA solo generó ${parsed.dias?.length || 0} días. Inténtalo de nuevo.`);
    }

    return parsed;
  });

  return { plan, promptUsado: userPrompt };
}
