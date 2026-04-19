import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const RECETA_ID = process.argv[2];
if (!RECETA_ID) {
  console.error("Uso: npx tsx scripts/debug-receta-micros.ts <recetaId>");
  process.exit(1);
}

const MICRO_COLS = [
  "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
  "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
  "folato","acidoPantotenico","colina","calcio","hierro",
  "magnesio","fosforo","potasio","sodio","cinc",
  "cobre","manganeso","selenio","fluor",
];

async function main() {
  const c = await pool.connect();
  try {
    const microSelectReceta = MICRO_COLS.map((m) => `"${m}"`).join(", ");
    const { rows: receta } = await c.query(
      `SELECT id, nombre, "dietistaId", calorias, proteinas, carbohidratos, grasas, fibra, ${microSelectReceta} FROM recetas WHERE id = $1`,
      [RECETA_ID],
    );
    if (receta.length === 0) {
      console.log("❌ Receta no encontrada");
      return;
    }
    const r = receta[0];
    console.log("=== RECETA ===");
    console.log(`Nombre: ${r.nombre}`);
    console.log(`DietistaId: ${r.dietistaId === null ? "NULL (global)" : r.dietistaId}`);
    console.log(`Macros: ${r.calorias} kcal | P ${r.proteinas} | C ${r.carbohidratos} | G ${r.grasas} | F ${r.fibra}`);
    console.log("Micros en receta:");
    let microsCount = 0;
    for (const col of MICRO_COLS) {
      const v = r[col];
      if (v !== null && v !== undefined) {
        console.log(`  · ${col}: ${v}`);
        microsCount++;
      }
    }
    console.log(`  Total micros poblados: ${microsCount}/${MICRO_COLS.length}\n`);

    // Ingredientes
    const { rows: ingredientes } = await c.query(
      `SELECT i.id, i.cantidad, i."alimentoId", a.nombre, a.calorias, a.proteinas
       FROM receta_ingredientes i
       JOIN alimentos a ON a.id = i."alimentoId"
       WHERE i."recetaId" = $1
       ORDER BY a.nombre`,
      [RECETA_ID],
    );
    console.log(`=== INGREDIENTES (${ingredientes.length}) ===`);
    for (const ing of ingredientes) {
      console.log(`- ${ing.nombre} (${ing.cantidad}g) — kcal/100g: ${ing.calorias}`);
    }
    console.log();

    // Micros de cada alimento
    if (ingredientes.length > 0) {
      const ids = ingredientes.map((i) => i.alimentoId);
      const microSelectAlim = MICRO_COLS.map((m) => `"${m}"`).join(", ");
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
      const { rows: alimentos } = await c.query(
        `SELECT id, nombre, ${microSelectAlim} FROM alimentos WHERE id IN (${placeholders})`,
        ids,
      );
      console.log("=== MICROS DE LOS ALIMENTOS USADOS ===");
      for (const a of alimentos) {
        let cnt = 0;
        for (const col of MICRO_COLS) {
          if (a[col] !== null && a[col] !== undefined && Number(a[col]) > 0) cnt++;
        }
        console.log(`- ${a.nombre}: ${cnt}/${MICRO_COLS.length} micros poblados`);
        if (cnt > 0 && cnt < 5) {
          for (const col of MICRO_COLS) {
            if (a[col] !== null && a[col] !== undefined) console.log(`    · ${col}: ${a[col]}`);
          }
        }
      }
    }
  } finally {
    c.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
