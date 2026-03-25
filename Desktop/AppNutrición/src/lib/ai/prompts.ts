import type { MacroObjetivos } from "./types";

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

export const SYSTEM_PROMPT = `Genera un plan alimenticio semanal en JSON.

REGLA PRINCIPAL: El total de calorías de cada día DEBE coincidir con el objetivo (±5%). Si el objetivo es 2000kcal, cada día debe sumar entre 1900 y 2100kcal. NO menos.

Cómo calcular: calorías de un alimento = (cantidadGramos / 100) × kcal_por_100g_de_la_tabla

Ejemplo para 2000kcal/día:
- Desayuno: Avena 100g (389kcal) + Platano 150g (134kcal) + Leche 250g (105kcal) = 628kcal
- Media mañana: Yogur 200g (118kcal) + Almendras 20g (116kcal) = 234kcal
- Almuerzo: Pollo 200g (330kcal) + Arroz 150g (195kcal) + Tomate 100g (18kcal) = 543kcal
- Merienda: Pan 60g (159kcal) + Aguacate 80g (128kcal) = 287kcal
- Cena: Salmon 180g (374kcal) + Patatas 200g (154kcal) + Espinacas 100g (23kcal) = 551kcal
- Recena: Leche 200g (84kcal)
TOTAL: 628+234+543+287+551+84 = 2327kcal (ajustar cantidades para llegar a 2000)

IMPORTANTE: Usa cantidades GRANDES si el objetivo es alto. 200g de pollo, 150g de arroz, 250g de leche. NO pongas 50g de todo.

FORMATO JSON COMPACTO (sin espacios innecesarios):
{"nombre":"Plan","dias":[{"dia":"LUNES","comidas":[{"tipo":"DESAYUNO","descripcion":"Avena con platano","alimentos":[{"nombre":"Avena","cantidadGramos":100,"estimacion":{"calorias":389,"proteinas":17,"carbohidratos":66,"grasas":7}}]}]}]}
IMPORTANTE: Genera el JSON lo más compacto posible, sin saltos de línea ni indentación.

Dias: LUNES,MARTES,MIERCOLES,JUEVES,VIERNES,SABADO,DOMINGO
Comidas: DESAYUNO,MEDIA_MANANA,ALMUERZO,MERIENDA,CENA,RECENA

REGLAS:
- 7 días TODOS DIFERENTES (salvo que las instrucciones del dietista digan lo contrario). Cada desayuno, almuerzo y cena debe usar proteínas DISTINTAS:
  * Lunes: pollo, Martes: ternera, Miércoles: merluza, Jueves: atun, Viernes: salmon, Sábado: huevos+legumbres, Domingo: garbanzos
  * Varía desayunos: avena, huevos, pan con tomate, yogur con fruta, tortitas...
  * Varía meriendas: fruta+nueces, pan+aguacate, yogur+almendras, queso+pan...
  * Si las INSTRUCCIONES DEL DIETISTA contradicen algo de arriba, las instrucciones tienen prioridad
- 2-3 alimentos por comida con "descripcion" del plato
- Nombres de alimentos: max 2 palabras simples (Pollo, Arroz, Salmon, Lentejas, Avena, Yogur, Pan, Pasta, Huevos, Ternera, Merluza, Atun, Patatas, Platano, Manzana, Fresa, Naranja, Tomate, Espinacas, Brocoli, Zanahoria, Almendras, Nueces, Aguacate, Leche, Aceite oliva, Queso fresco, Garbanzos)
- Los macros en "estimacion" deben ser NÚMEROS ya calculados, NO fórmulas. Pon el resultado: 233 no (150/100)*155
- Solo JSON válido, sin comentarios, sin fórmulas, sin texto adicional`;

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
  const min = Math.round(objetivos.calorias * 0.95);
  const max = Math.round(objetivos.calorias * 1.05);

  let prompt = `${TABLA_NUTRICIONAL}

OBJETIVO OBLIGATORIO — cada día DEBE sumar entre ${min} y ${max} kcal:
- Calorías: ${objetivos.calorias} kcal/día
- Proteínas: ~${objetivos.proteinas}g
- Carbohidratos: ~${objetivos.carbohidratos}g
- Grasas: ~${objetivos.grasas}g

PACIENTE: ${paciente.sexo || ""} ${paciente.peso ? paciente.peso + "kg" : ""}
Objetivo: ${paciente.objetivo}
Alergias: ${paciente.alergias.join(", ") || "ninguna"}
Intolerancias: ${paciente.intolerancias.join(", ") || "ninguna"}
Preferencias: ${paciente.preferencias.join(", ") || "ninguna"}`;

  if (instrucciones.trim()) {
    prompt += `\n\nINSTRUCCIONES DEL DIETISTA:\n${instrucciones}`;
  }

  prompt += `\n\nRECUERDA: Cada día debe sumar ${min}-${max} kcal. Usa cantidades grandes si hace falta (200g pollo, 150g arroz, 250g leche). Verifica la suma antes de responder.`;

  return prompt;
}
