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

export async function generateDietPlan(
  paciente: PacienteData,
  objetivos: MacroObjetivos,
  instrucciones: string
): Promise<{ plan: AIPlanGenerado; promptUsado: string }> {
  const userPrompt = buildUserPrompt(paciente, objetivos, instrucciones);
  const model = getGroqModel();

  const plan = await callWithRetry(async (client) => {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 8000,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("La IA no generó respuesta");

    const parsed = JSON.parse(content) as AIPlanGenerado;
    if (!parsed.dias || !Array.isArray(parsed.dias)) {
      throw new Error("Formato de respuesta incorrecto");
    }

    return parsed;
  });

  return { plan, promptUsado: userPrompt };
}
