import type { MacroObjetivos } from "./types";

// Tabla de referencia nutricional por 100g para que la IA calcule bien
const TABLA_NUTRICIONAL = `TABLA NUTRICIONAL (por 100g): nombre|kcal|P|C|G
Pollo|165|31|0|3.6
Ternera|250|26|0|15
Salmon|208|20|0|13
Merluza|86|17|0|1.3
Atun|130|29|0|1
Huevos|155|13|1|11
Arroz|130|2.7|28|0.3
Pasta|131|5|25|1.1
Patatas|77|2|17|0.1
Pan|265|9|49|3.2
Avena|389|17|66|7
Lentejas|116|9|20|0.4
Garbanzos|164|9|27|2.6
Yogur|59|10|3.6|0.7
Leche|42|3.4|5|1
Platano|89|1.1|23|0.3
Manzana|52|0.3|14|0.2
Fresa|33|0.7|8|0.3
Naranja|47|0.9|12|0.1
Tomate|18|0.9|3.9|0.2
Espinacas|23|2.9|3.6|0.4
Brocoli|34|2.8|7|0.4
Zanahoria|41|0.9|10|0.2
Pimiento|31|1|6|0.3
Aceite oliva|884|0|0|100
Almendras|579|21|22|49
Nueces|654|15|14|65
Aguacate|160|2|9|15
Queso fresco|174|12|3|13`;

export const SYSTEM_PROMPT = `Eres un nutricionista experto. Genera planes alimenticios semanales en JSON.

REGLAS CRÍTICAS DE MACROS:
1. Usa SOLO la tabla nutricional proporcionada para calcular macros
2. Los macros de cada alimento se calculan así: (cantidadGramos / 100) × valor_por_100g
3. La suma de macros de TODAS las comidas de un día DEBE estar dentro de ±10% del objetivo
4. Si el objetivo es 1400kcal, cada día debe tener entre 1260-1540kcal
5. Distribuye las calorías: Desayuno ~20%, Media mañana ~10%, Almuerzo ~30%, Merienda ~10%, Cena ~25%, Recena ~5%
6. Ajusta las cantidades en gramos para alcanzar los objetivos (no uses siempre cantidades redondas)

FORMATO JSON obligatorio:
{"nombre":"Plan semanal","dias":[{"dia":"LUNES","comidas":[{"tipo":"DESAYUNO","descripcion":"Nombre del plato","alimentos":[{"nombre":"Avena","cantidadGramos":60,"estimacion":{"calorias":233,"proteinas":10,"carbohidratos":40,"grasas":4}}]}]}]}

Dias: LUNES,MARTES,MIERCOLES,JUEVES,VIERNES,SABADO,DOMINGO
Comidas: DESAYUNO,MEDIA_MANANA,ALMUERZO,MERIENDA,CENA,RECENA

CADA DIA DEBE SER DIFERENTE. No repitas los mismos platos entre días.
Cada comida tiene 2-3 alimentos y una "descripcion" con el nombre del plato.
Nombres de alimentos: max 2 palabras, usa nombres simples que existan en una base de datos española (Pollo, Arroz, Salmon, Lentejas, Avena, Yogur, etc).

VERIFICACIÓN OBLIGATORIA antes de responder:
1. Para CADA alimento, calcula: (cantidadGramos / 100) × kcal_por_100g = calorias_estimadas
2. Suma las calorias de TODOS los alimentos del día
3. Si la suma NO está entre el mínimo y máximo permitido, AJUSTA las cantidades hasta que encaje
4. Los macros en "estimacion" DEBEN reflejar el cálculo correcto, NO valores inventados

Solo responde con JSON válido, sin texto adicional.`;

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
  instrucciones: string,
  _alimentos: { nombre: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number }[],
  _recetas: { nombre: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number; porciones: number }[]
): string {
  const tolerancia10 = Math.round(objetivos.calorias * 0.1);
  const minKcal = objetivos.calorias - tolerancia10;
  const maxKcal = objetivos.calorias + tolerancia10;

  // Distribución sugerida por comida
  const dist = {
    desayuno: Math.round(objetivos.calorias * 0.20),
    mediaMañana: Math.round(objetivos.calorias * 0.10),
    almuerzo: Math.round(objetivos.calorias * 0.30),
    merienda: Math.round(objetivos.calorias * 0.10),
    cena: Math.round(objetivos.calorias * 0.25),
    recena: Math.round(objetivos.calorias * 0.05),
  };

  let prompt = `${TABLA_NUTRICIONAL}

OBJETIVOS DIARIOS ESTRICTOS:
- Calorías: ${objetivos.calorias} kcal/día (rango permitido: ${minKcal}-${maxKcal} kcal)
- Proteínas: ${objetivos.proteinas}g (±15%)
- Carbohidratos: ${objetivos.carbohidratos}g (±15%)
- Grasas: ${objetivos.grasas}g (±15%)

DISTRIBUCIÓN POR COMIDA:
- Desayuno: ~${dist.desayuno} kcal
- Media mañana: ~${dist.mediaMañana} kcal
- Almuerzo: ~${dist.almuerzo} kcal
- Merienda: ~${dist.merienda} kcal
- Cena: ~${dist.cena} kcal
- Recena: ~${dist.recena} kcal

PACIENTE: ${paciente.sexo || "No especificado"}, ${paciente.peso ? paciente.peso + "kg" : "peso no especificado"}
Objetivo: ${paciente.objetivo}${paciente.objetivoDetalle ? " - " + paciente.objetivoDetalle : ""}
Alergias: ${paciente.alergias.length > 0 ? paciente.alergias.join(", ") : "ninguna"}
Intolerancias: ${paciente.intolerancias.length > 0 ? paciente.intolerancias.join(", ") : "ninguna"}
Preferencias: ${paciente.preferencias.length > 0 ? paciente.preferencias.join(", ") : "ninguna"}`;

  if (instrucciones.trim()) {
    prompt += `\n\nINSTRUCCIONES DEL DIETISTA (prioridad máxima):\n${instrucciones}`;
  }

  prompt += `\n\nIMPORTANTE: Calcula los macros de cada alimento usando la tabla (cantidadGramos/100 × valor). Verifica que la suma diaria está entre ${minKcal}-${maxKcal} kcal ANTES de responder. Ajusta las cantidades en gramos si es necesario.`;

  return prompt;
}
