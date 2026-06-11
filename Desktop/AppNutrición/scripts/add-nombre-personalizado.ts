import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #5 — Alias visual ("editar el nombre") por línea del plan y por alternativa.
// Solo presentación: no toca macros ni el Alimento. Aditivo y seguro.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE alimentos_en_comida ADD COLUMN IF NOT EXISTS "nombrePersonalizado" TEXT`);
    await client.query(`ALTER TABLE alternativas_alimento ADD COLUMN IF NOT EXISTS "nombrePersonalizado" TEXT`);
    console.log("✓ Columna nombrePersonalizado añadida a alimentos_en_comida y alternativas_alimento");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
