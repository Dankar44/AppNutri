import { callWithRetry, getGroqModel } from "@/lib/openai";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import type { AIPlanGenerado, AIDia, MacroObjetivos } from "./types";

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
  categoria?: string;
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

function extractJSON(text: string): string {
  const jsonBlock = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlock) text = jsonBlock[1].trim();
  else {
    const codeBlock = text.match(/```\s*([\s\S]*?)```/);
    if (codeBlock) text = codeBlock[1].trim();
    else {
      const firstBrace = text.indexOf("{");
      const lastBrace = text.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.slice(firstBrace, lastBrace + 1);
      }
    }
  }

  text = text.replace(/:\s*\([\d\s.*\/+\-()]+\)/g, (match) => {
    try {
      const expr = match.slice(1).trim();
      const result = Function(`"use strict"; return (${expr})`)();
      return `: ${Math.round(result * 10) / 10}`;
    } catch { return ": 0"; }
  });
  text = text.replace(/\/\/[^\n]*/g, "");
  text = text.replace(/,\s*([}\]])/g, "$1");

  // Intentar cerrar JSON truncado
  try { JSON.parse(text); } catch {
    text = text.replace(/,\s*$/, "");
    const opens = (text.match(/\[/g) || []).length - (text.match(/\]/g) || []).length;
    const braces = (text.match(/\{/g) || []).length - (text.match(/\}/g) || []).length;
    text += "}".repeat(Math.max(0, braces));
    text += "]".repeat(Math.max(0, opens));
  }

  return text;
}

// Lista deduplicada de los alimentos ya usados en lotes anteriores, para
// pedirle a la IA que varíe (antes se pasaban descripciones truncadas a 300
// chars, que no llegaban a cubrir lo generado y por eso repetía).
function alimentosUsados(dias: AIDia[]): string {
  const set = new Set<string>();
  for (const d of dias) {
    for (const c of d.comidas) {
      for (const a of c.alimentos) set.add(a.nombre);
    }
  }
  return [...set].join(", ");
}

async function generateDays(
  dias: string[],
  userPromptBase: string,
  yaUsados: string,
): Promise<AIDia[]> {
  const model = getGroqModel();
  const diasStr = dias.join(", ");

  let extraPrompt = `\n\nGenera SOLO ${dias.length} días: ${diasStr}. Estos ${dias.length} días deben ser DISTINTOS entre sí: distinta proteína principal y distinto desayuno en cada uno (no copies un día en otro). JSON compacto sin espacios.`;
  if (yaUsados) {
    extraPrompt += ` En días anteriores ya se usaron estos alimentos: ${yaUsados.slice(0, 1200)}. Para dar variedad, prioriza alimentos DISTINTOS de la tabla y no repitas los mismos platos (puedes reutilizar básicos como el aceite si hace falta).`;
  }

  return callWithRetry(async (client) => {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPromptBase + extraPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      // Cada lote genera solo 2-3 días (~2.5k tokens). 4096 da margen de sobra y
      // mantiene la petición (entrada + salida) por debajo del límite de 12.000
      // tokens/min del tier gratuito de Groq (un 413 si se supera).
      max_tokens: 4096,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("La IA no generó respuesta");

    const jsonStr = extractJSON(content);
    const parsed = JSON.parse(jsonStr) as AIPlanGenerado;
    return parsed.dias || [];
  });
}

export async function generateDietPlan(
  paciente: PacienteData,
  objetivos: MacroObjetivos,
  instrucciones: string,
  alimentos: AlimentoDB[],
  recetas: RecetaDB[],
  comidas: string[]
): Promise<{ plan: AIPlanGenerado; promptUsado: string }> {
  const userPrompt = buildUserPrompt(paciente, objetivos, instrucciones, alimentos, recetas, comidas);

  // Generar en 3 lotes pequeños para forzar variedad y evitar truncamiento.
  // Cada lote recibe los alimentos ya usados en los anteriores para no repetir.
  const lote1 = ["LUNES", "MARTES", "MIERCOLES"];
  const dias1 = await generateDays(lote1, userPrompt, "");

  const lote2 = ["JUEVES", "VIERNES"];
  const dias2 = await generateDays(lote2, userPrompt, alimentosUsados(dias1));

  const lote3 = ["SABADO", "DOMINGO"];
  const dias3 = await generateDays(lote3, userPrompt, alimentosUsados([...dias1, ...dias2]));

  const allDias = [...dias1, ...dias2, ...dias3];

  return {
    plan: { nombre: "Plan semanal", dias: allDias },
    promptUsado: userPrompt,
  };
}
