import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #104 Fase 2 — valor 'OTRA' para comidas personalizadas por día. Aditivo: no afecta a
// las comidas existentes (siguen con su tipo). ADD VALUE es idempotente con IF NOT EXISTS.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TYPE "TipoComida" ADD VALUE IF NOT EXISTS 'OTRA'`);
    console.log("✓ Enum TipoComida ahora incluye 'OTRA'");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
