import type { MacroObjetivos } from "./types";

interface AlimentoPrompt {
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  categoria?: string;
}

// Etiquetas legibles para agrupar la tabla por categoría en el prompt.
const ETIQUETA_CATEGORIA: Record<string, string> = {
  CARNES: "CARNES",
  PESCADOS: "PESCADOS Y MARISCOS",
  HUEVOS: "HUEVOS",
  LEGUMBRES: "LEGUMBRES",
  LACTEOS: "LACTEOS",
  CEREALES: "CEREALES Y TUBERCULOS",
  VERDURAS: "VERDURAS",
  FRUTAS: "FRUTAS",
  FRUTOS_SECOS: "FRUTOS SECOS",
  ACEITES: "ACEITES Y GRASAS",
  BEBIDAS: "BEBIDAS",
  CONDIMENTOS: "CONDIMENTOS",
  DULCES: "DULCES",
  OTROS: "OTROS",
};

// Orden en que se listan las categorías (proteínas y base primero).
const ORDEN_CATEGORIA = [
  "CARNES", "PESCADOS", "HUEVOS", "LEGUMBRES", "LACTEOS",
  "CEREALES", "VERDURAS", "FRUTAS", "FRUTOS_SECOS", "ACEITES",
  "BEBIDAS", "CONDIMENTOS", "DULCES", "OTROS",
];

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Construye la tabla nutricional del prompt a partir del catálogo REAL de
 * alimentos del nutricionista (globales + suyos). Agrupa por categoría para
 * que la IA tenga variedad por grupo y use nombres EXACTOS de la base de datos.
 */
function buildTablaNutricional(alimentos: AlimentoPrompt[]): string {
  const grupos = new Map<string, AlimentoPrompt[]>();
  for (const a of alimentos) {
    const cat = a.categoria && ETIQUETA_CATEGORIA[a.categoria] ? a.categoria : "OTROS";
    if (!grupos.has(cat)) grupos.set(cat, []);
    grupos.get(cat)!.push(a);
  }

  const cats = [...grupos.keys()].sort(
    (a, b) => ORDEN_CATEGORIA.indexOf(a) - ORDEN_CATEGORIA.indexOf(b)
  );

  const lineas = cats.map((cat) => {
    const items = grupos
      .get(cat)!
      .map((a) => `${a.nombre}|${Math.round(a.calorias)}|${r1(a.proteinas)}|${r1(a.carbohidratos)}|${r1(a.grasas)}`)
      .join(" ; ");
    return `${ETIQUETA_CATEGORIA[cat]}: ${items}`;
  });

  return `TABLA NUTRICIONAL (valores por 100g) — formato nombre|kcal|P|C|G:\n${lineas.join("\n")}`;
}

export const SYSTEM_PROMPT = `Eres un dietista-nutricionista experto. Generas planes alimenticios semanales realistas, variados y equilibrados, en formato JSON.

REGLA 1 — SOLO LA TABLA: Usa EXCLUSIVAMENTE alimentos que aparezcan en la TABLA NUTRICIONAL del mensaje del usuario. Escribe los nombres EXACTAMENTE como aparecen en la tabla (misma ortografía). NO inventes alimentos que no estén en la tabla.

REGLA 2 — CALORÍAS Y MACROS: Cada día debe acercarse al objetivo en las CUATRO cifras a la vez: calorías (±5%) Y los gramos de proteínas, carbohidratos y grasas (±15%). MUY IMPORTANTE: no te pases de proteína — si el objetivo es 120g de proteína, el día NO debe tener 200g; ajusta las raciones de carne/pescado y compensa con carbohidratos (arroz, pasta, pan, patata, fruta, legumbres) hasta alcanzar el objetivo de carbos. Cómo calcular: calorías de un alimento = (cantidadGramos / 100) × kcal_por_100g_de_la_tabla. Usa cantidades realistas y grandes cuando el objetivo sea alto (200g de carne/pescado, 150g de arroz/pasta, 250g de lácteo). NO pongas 50g de todo.

REGLA 3 — VARIEDAD (muy importante): Los 7 días deben ser DIFERENTES entre sí. Reglas de variedad:
  * Rota la proteína principal de comida y cena: usa una proteína DISTINTA cada día (alterna entre CARNES, PESCADOS, HUEVOS y LEGUMBRES de la tabla). No repitas la misma proteína dos días seguidos, y NO uses el mismo tipo de carne (p. ej. ternera) en más de 2 comidas de toda la semana — reparte entre carne roja, ave, pescado, huevo y legumbre, TAMBIÉN en las cenas.
  * Varía los desayunos a lo largo de la semana (alterna entre opciones con avena, pan, lácteos, fruta, huevos…).
  * Cambia la VERDURA y la guarnición (arroz, patata, pasta, tubérculos…) entre días: NO uses la misma verdura ni el mismo acompañamiento más de 2 días en toda la semana. Evita repetir la misma guarnición en almuerzo y cena del mismo día.
  * Varía también las comidas pequeñas (media mañana, merienda, recena): alterna entre fruta, frutos secos, pan/tostada, yogur, etc. NO pongas la misma idea ("fruta fresca") en todas — cada comida pequeña con algo distinto.
  * Un mismo alimento no debería aparecer en más de 2-3 días de la semana (salvo básicos como aceite de oliva).
  * Si en el mensaje se indica qué se generó en días anteriores, NO repitas esos mismos platos: elige alimentos distintos.

REGLA 4 — EQUILIBRIO: Acércate también a los macros objetivo del día (proteínas, carbohidratos, grasas). Cada comida principal debe combinar una fuente de proteína + una de carbohidrato + verdura/fruta + una grasa saludable cuando proceda. Reparte las calorías de forma sensata entre las comidas del día.

REGLA 5 — RESTRICCIONES: Respeta SIEMPRE alergias, intolerancias y preferencias del paciente y las instrucciones del dietista (estas tienen prioridad sobre las reglas de variedad).

FORMATO JSON COMPACTO (sin espacios ni saltos de línea innecesarios):
{"nombre":"Plan","dias":[{"dia":"LUNES","comidas":[{"tipo":"DESAYUNO","descripcion":"Avena con plátano","alimentos":[{"nombre":"Avena","cantidadGramos":80,"estimacion":{"calorias":311,"proteinas":13.6,"carbohidratos":52.8,"grasas":5.6}}]}]}]}

Días válidos: LUNES,MARTES,MIERCOLES,JUEVES,VIERNES,SABADO,DOMINGO
Comidas: usa SOLO los tipos de comida que se te indican en el mensaje del usuario. Genera TODAS esas comidas en CADA día y CADA una DEBE llevar alimentos — no omitas ninguna ni la dejes vacía.

REGLAS DE FORMATO:
- 2-4 alimentos por comida (las comidas principales 3-4; meriendas/desayunos simples pueden ser 2), con un campo "descripcion" breve del plato.
- Los macros en "estimacion" deben ser NÚMEROS ya calculados (el resultado), NO fórmulas ni texto. Ej: 233, no (150/100)*155.
- Solo JSON válido: sin comentarios, sin fórmulas, sin texto adicional fuera del JSON.`;

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
  alimentos: AlimentoPrompt[],
  _recetas: { nombre: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number; porciones: number }[],
  comidas: string[]
): string {
  const min = Math.round(objetivos.calorias * 0.95);
  const max = Math.round(objetivos.calorias * 1.05);
  const lista = comidas.length ? comidas : ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"];
  const comidasStr = lista.join(", ");

  let prompt = `${buildTablaNutricional(alimentos)}

OBJETIVO OBLIGATORIO de cada día — cúmplelo en las CUATRO cifras a la vez:
- Calorías: ${objetivos.calorias} kcal (rango ${min}-${max})
- Proteínas: ${objetivos.proteinas}g (NO te pases de esta cifra)
- Carbohidratos: ${objetivos.carbohidratos}g (mete suficientes: arroz, pasta, pan, patata, fruta, legumbres)
- Grasas: ${objetivos.grasas}g

COMIDAS OBLIGATORIAS — cada uno de los 7 días debe incluir EXACTAMENTE estas ${lista.length} comidas, TODAS con alimentos (ninguna vacía): ${comidasStr}.

PACIENTE: ${paciente.sexo || ""} ${paciente.peso ? paciente.peso + "kg" : ""}
Objetivo: ${paciente.objetivo}${paciente.objetivoDetalle ? ` (${paciente.objetivoDetalle})` : ""}
Alergias: ${paciente.alergias.join(", ") || "ninguna"}
Intolerancias: ${paciente.intolerancias.join(", ") || "ninguna"}
Preferencias: ${paciente.preferencias.join(", ") || "ninguna"}`;

  if (instrucciones.trim()) {
    prompt += `\n\nINSTRUCCIONES DEL DIETISTA (prioridad máxima):\n${instrucciones}`;
  }

  prompt += `\n\nRECUERDA antes de responder: (1) usa SOLO alimentos de la TABLA con sus nombres exactos; (2) genera las ${lista.length} comidas en CADA día (${comidasStr}), ninguna vacía; (3) cada día debe acercarse a ${objetivos.calorias} kcal, ${objetivos.proteinas}g proteína, ${objetivos.carbohidratos}g carbos y ${objetivos.grasas}g grasa — verifica las sumas y no te pases de proteína; (4) varía los 7 días.`;

  return prompt;
}
