/**
 * Rellena micronutrientes para todos los alimentos de la BD.
 * Usa valores aproximados basados en datos USDA/BEDCA por categoría y tipo de alimento.
 * Ejecutar: npx tsx scripts/seed-micronutrientes.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// Micronutrientes por 100g — valores representativos por palabra clave en el nombre
// [vitA_ug, B6_mg, B12_ug, C_mg, D_ug, E_mg, K_ug, tiamina_mg, ribo_mg, niacina_mg, folato_ug, pantoB5_mg, colina_mg, Ca_mg, Fe_mg, Mg_mg, P_mg, K_mg, Na_mg, Zn_mg, Cu_mg, Mn_mg, Se_ug, F_ug]
type Micro = [number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number,number];

const CATEGORY_DEFAULTS: Record<string, Micro> = {
  // Valores medios representativos por categoría
  FRUTAS:       [5,   0.05, 0,    15,  0,   0.5,  3,   0.03, 0.03, 0.3,  15,  0.2, 5,   12,  0.3, 8,   15, 150, 2,   0.1, 0.05, 0.1, 0.4, 5],
  VERDURAS:     [200, 0.15, 0,    20,  0,   0.8,  50,  0.06, 0.07, 0.6,  40,  0.3, 12,  35,  0.8, 15,  35, 250, 15,  0.3, 0.08, 0.2, 0.5, 10],
  CEREALES:     [0,   0.15, 0,    0,   0,   0.5,  1,   0.2,  0.1,  2.5,  25,  0.5, 15,  20,  1.5, 30,  120,130, 5,   1.0, 0.15, 0.8, 10,  20],
  LEGUMBRES:    [2,   0.2,  0,    2,   0,   0.5,  5,   0.3,  0.1,  1.5,  180, 0.6, 40,  50,  3.0, 45,  200,400, 5,   1.5, 0.3,  0.6, 3,   5],
  CARNES:       [10,  0.4,  2.0,  0,   0.5, 0.3,  2,   0.08, 0.2,  5.0,  8,   0.8, 70,  10,  1.5, 22,  200,300, 60,  3.0, 0.08, 0.02, 20, 5],
  PESCADOS:     [15,  0.3,  3.0,  0,   5.0, 1.0,  0.5, 0.05, 0.1,  4.0,  10,  0.5, 65,  20,  0.8, 30,  200,350, 80,  0.8, 0.05, 0.02, 35, 30],
  LACTEOS:      [30,  0.05, 0.4,  1,   0.5, 0.2,  1,   0.04, 0.15, 0.1,  10,  0.4, 15,  120, 0.1, 12,  95, 150, 45,  0.5, 0.02, 0.01, 5,  5],
  HUEVOS:       [160, 0.17, 0.9,  0,   2.0, 1.0,  0.3, 0.04, 0.46, 0.08, 47,  1.5, 294, 56,  1.8, 12,  198,138, 142, 1.3, 0.07, 0.03, 30, 1],
  FRUTOS_SECOS: [0,   0.15, 0,    0.5, 0,   7.0,  0,   0.2,  0.15, 2.0,  30,  0.5, 40,  70,  2.5, 150, 350,500, 5,   2.5, 0.5,  1.5,  5,  10],
  ACEITES:      [0,   0,    0,    0,   0,   14.0, 60,  0,    0,    0,    0,   0,   0,   0,   0,   0,   0,  0,  0,  0,   0,    0,    0,  0],
  BEBIDAS:      [0,   0.02, 0,    5,   0,   0.1,  0,   0.01, 0.02, 0.1,  5,   0.1, 3,   10,  0.2, 5,   10, 50, 5,   0.1, 0.02, 0.05, 0.5, 5],
  CONDIMENTOS:  [20,  0.1,  0,    5,   0,   1.0,  10,  0.05, 0.05, 0.5,  10,  0.2, 5,   40,  2.0, 20,  30, 100, 200, 0.5, 0.1,  0.5,  1,  5],
  DULCES:       [5,   0.03, 0.1,  0,   0,   0.5,  2,   0.03, 0.05, 0.3,  5,   0.2, 10,  30,  1.0, 20,  60, 100, 30,  0.5, 0.1,  0.3,  2,  5],
  OTROS:        [0,   0.1,  0,    0,   0,   0.5,  0,   0.1,  0.1,  1.0,  15,  0.3, 20,  20,  1.0, 20,  100,150, 10,  0.5, 0.1,  0.2,  5,  5],
};

// Ajustes específicos por palabra clave (multiplicadores sobre los defaults de categoría)
const KEYWORD_ADJUSTMENTS: [string, Partial<Record<number, number>>][] = [
  // Verduras de hoja verde — más vitK, folato, vitA
  ["espinaca",    { 0: 9.4, 6: 9.6, 10: 4.9, 13: 2.8, 14: 3.4, 15: 5.3 }],
  ["acelga",      { 0: 3.1, 6: 16, 10: 2.5, 13: 1.5, 14: 2.3 }],
  ["kale",        { 0: 5.0, 4: 3.0, 6: 9.6, 10: 3.5 }],
  ["brócoli",     { 0: 0.6, 3: 4.5, 6: 2.0, 10: 1.6 }],
  ["brocoli",     { 0: 0.6, 3: 4.5, 6: 2.0, 10: 1.6 }],
  // Frutas ricas en vitamina C
  ["naranja",     { 3: 3.5, 10: 2.0 }],
  ["limón",       { 3: 3.5 }],
  ["lima",        { 3: 2.0 }],
  ["fresa",       { 3: 4.0, 10: 1.6 }],
  ["kiwi",        { 3: 6.0, 6: 13.5 }],
  ["piña",        { 3: 3.2, 21: 9.0 }],
  ["mango",       { 0: 54, 3: 2.4 }],
  ["papaya",      { 0: 9.5, 3: 4.0 }],
  // Carnes — ajustes B12, hierro
  ["hígado",      { 0: 600, 1: 2.5, 2: 30, 9: 3.5, 10: 35, 14: 4.0, 19: 4.0, 22: 2.0 }],
  ["ternera",     { 2: 1.5, 14: 1.5, 19: 2.0 }],
  ["cerdo",       { 7: 8.0, 2: 0.5, 22: 1.5 }],
  ["pollo",       { 9: 1.5, 1: 1.2 }],
  ["pavo",        { 9: 1.5, 22: 1.5 }],
  ["cordero",     { 2: 1.5, 14: 1.3, 19: 1.8 }],
  // Pescados
  ["salmón",      { 4: 2.5, 2: 1.5, 1: 2.0, 22: 1.2 }],
  ["sardina",     { 4: 1.5, 2: 3.0, 13: 4.0, 22: 1.5 }],
  ["atún",        { 2: 3.0, 4: 1.4, 9: 2.0, 22: 2.5 }],
  ["bacalao",     { 2: 1.0, 22: 1.0 }],
  ["merluza",     { 22: 1.0 }],
  ["gamba",       { 22: 1.5, 19: 1.5 }],
  ["mejillón",    { 2: 8.0, 14: 4.5, 22: 2.0 }],
  // Lácteos
  ["leche",       { 13: 1.0, 2: 1.0, 4: 1.0 }],
  ["queso",       { 0: 3.0, 2: 1.5, 13: 5.0, 15: 0.3, 18: 10.0, 19: 2.5 }],
  ["yogur",       { 2: 0.8, 13: 1.0 }],
  // Frutos secos
  ["almendra",    { 5: 3.7, 13: 3.8, 15: 1.8, 16: 1.4 }],
  ["nuez",        { 5: 0.1, 15: 1.1, 21: 2.3, 20: 1.3 }],
  ["cacahuete",   { 10: 3.2, 9: 6.0 }],
  ["avellana",    { 5: 2.1, 15: 1.1, 21: 4.1 }],
  ["pistacho",    { 1: 7.6, 5: 0.3, 17: 2.0 }],
  // Legumbres
  ["lenteja",     { 14: 2.2, 10: 2.0 }],
  ["garbanzo",    { 10: 1.9, 14: 2.0 }],
  ["soja",        { 13: 3.5, 14: 2.9, 15: 2.0 }],
  // Cereales
  ["avena",       { 7: 2.5, 14: 1.5, 15: 2.0, 16: 1.2, 21: 3.0 }],
  ["arroz",       { 7: 0.5, 9: 0.6, 10: 0.3 }],
  // Huevos
  ["huevo",       { 0: 1.0, 2: 1.0, 4: 1.0 }],
  // Aceites
  ["oliva",       { 5: 1.0, 6: 0.8 }],
  ["coco",        { 5: 0.01, 6: 0.01 }],
  ["girasol",     { 5: 2.8 }],
];

const COLS = [
  "vitaminaA", "vitaminaB6", "vitaminaB12", "vitaminaC", "vitaminaD",
  "vitaminaE", "vitaminaK", "tiamina", "riboflavina", "niacina",
  "folato", "acidoPantotenico", "colina", "calcio", "hierro",
  "magnesio", "fosforo", "potasio", "sodio", "cinc",
  "cobre", "manganeso", "selenio", "fluor",
];

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

async function main() {
  const client = await pool.connect();
  try {
    // Obtener todos los alimentos
    const { rows } = await client.query<{ id: string; nombre: string; categoria: string }>(
      `SELECT id, nombre, categoria FROM alimentos ORDER BY nombre`
    );
    console.log(`\nProcesando ${rows.length} alimentos...\n`);

    let updated = 0;
    for (const row of rows) {
      const cat = row.categoria as string;
      const base = CATEGORY_DEFAULTS[cat] || CATEGORY_DEFAULTS.OTROS;
      const values = [...base] as number[];

      // Aplicar ajustes por palabra clave
      const nombreLower = row.nombre.toLowerCase();
      for (const [keyword, adjustments] of KEYWORD_ADJUSTMENTS) {
        if (nombreLower.includes(keyword)) {
          for (const [idx, mult] of Object.entries(adjustments)) {
            values[parseInt(idx)] = values[parseInt(idx)] * (mult as number);
          }
        }
      }

      // Redondear
      const rounded = values.map(round1);

      // Update
      const setClauses = COLS.map((col, i) => `"${col}" = $${i + 2}`).join(", ");
      await client.query(
        `UPDATE alimentos SET ${setClauses} WHERE id = $1`,
        [row.id, ...rounded]
      );
      updated++;

      if (updated % 500 === 0) {
        console.log(`  ${updated}/${rows.length} actualizados...`);
      }
    }

    console.log(`\n✓ ${updated} alimentos actualizados con micronutrientes`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
