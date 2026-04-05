import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const COLUMNS = [
  "vitaminaA", "vitaminaB6", "vitaminaB12", "vitaminaC", "vitaminaD",
  "vitaminaE", "vitaminaK", "tiamina", "riboflavina", "niacina",
  "folato", "acidoPantotenico", "colina", "calcio", "hierro",
  "magnesio", "fosforo", "potasio", "sodio", "cinc",
  "cobre", "manganeso", "selenio", "fluor",
];

async function main() {
  const client = await pool.connect();
  try {
    for (const col of COLUMNS) {
      await client.query(`ALTER TABLE alimentos ADD COLUMN IF NOT EXISTS "${col}" DOUBLE PRECISION`);
      console.log(`  + ${col}`);
    }
    console.log(`\n✓ ${COLUMNS.length} columnas de micronutrientes añadidas`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
