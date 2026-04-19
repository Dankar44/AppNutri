import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const MICRO_COLUMNS = [
  "vitaminaA", "vitaminaB6", "vitaminaB12", "vitaminaC", "vitaminaD",
  "vitaminaE", "vitaminaK", "tiamina", "riboflavina", "niacina",
  "folato", "acidoPantotenico", "colina", "calcio", "hierro",
  "magnesio", "fosforo", "potasio", "sodio", "cinc",
  "cobre", "manganeso", "selenio", "fluor",
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE recetas ADD COLUMN IF NOT EXISTS "tiempoPreparacion" INTEGER`);
    console.log("  + tiempoPreparacion");
    for (const col of MICRO_COLUMNS) {
      await client.query(`ALTER TABLE recetas ADD COLUMN IF NOT EXISTS "${col}" DOUBLE PRECISION`);
      console.log(`  + ${col}`);
    }
    console.log(`\n✓ Columnas añadidas a recetas`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
