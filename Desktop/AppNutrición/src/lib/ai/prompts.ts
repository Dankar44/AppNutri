import type { MacroObjetivos } from "./types";

export const SYSTEM_PROMPT = `Eres un nutricionista. Genera un plan semanal en JSON.

FORMATO OBLIGATORIO (responde SOLO este JSON, nada mas):
{"nombre":"string","dias":[{"dia":"LUNES","comidas":[{"tipo":"DESAYUNO","alimentos":[{"nombre":"string","cantidadGramos":100,"estimacion":{"calorias":0,"proteinas":0,"carbohidratos":0,"grasas":0}}]}]}]}

REGLAS CRITICAS:
1. SIEMPRE 7 dias: LUNES,MARTES,MIERCOLES,JUEVES,VIERNES,SABADO,DOMINGO
2. SIEMPRE 6 comidas por dia: DESAYUNO,MEDIA_MANANA,ALMUERZO,MERIENDA,CENA,RECENA
3. CUMPLIR las calorias y macros objetivo que pide el usuario - es lo MAS importante. Ajusta cantidades de alimentos para llegar al total diario pedido
4. Respetar TODAS las alergias, intolerancias y patologias
5. Respetar las preferencias alimentarias del paciente
6. Seguir las instrucciones del dietista al pie de la letra
7. Dieta mediterranea española, nombres cortos
8. Variar entre dias
9. Las estimaciones de macros deben ser realistas y sumar el total diario pedido`;

export function buildUserPrompt(
  paciente: {
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
  },
  objetivos: MacroObjetivos,
  instrucciones: string
): string {
  return `OBJETIVO CALORICO DIARIO: ${objetivos.calorias} kcal (OBLIGATORIO cumplir este total)
Macros diarios: Proteinas ${objetivos.proteinas}g, Carbohidratos ${objetivos.carbohidratos}g, Grasas ${objetivos.grasas}g

Paciente: ${paciente.nombre}
Sexo: ${paciente.sexo || "No especificado"}
Peso: ${paciente.peso ? `${paciente.peso} kg` : "No especificado"}
Altura: ${paciente.altura ? `${paciente.altura} cm` : "No especificada"}
Objetivo: ${paciente.objetivo} ${paciente.objetivoDetalle || ""}
Alergias: ${paciente.alergias.length > 0 ? paciente.alergias.join(", ") : "Ninguna"}
Intolerancias: ${paciente.intolerancias.length > 0 ? paciente.intolerancias.join(", ") : "Ninguna"}
Patologias: ${paciente.patologias.length > 0 ? paciente.patologias.join(", ") : "Ninguna"}
Preferencias: ${paciente.preferencias.length > 0 ? paciente.preferencias.join(", ") : "Sin preferencias"}

Instrucciones del dietista:
${instrucciones || "Ninguna"}

RECUERDA: cada dia debe sumar aproximadamente ${objetivos.calorias} kcal totales.`;
}
