import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #104 — nombre (alias) y hora opcionales por comida. Ambas columnas nullable: no afecta
// a las comidas existentes (siguen mostrando la etiqueta de su tipo hasta que se editen).
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE comidas_del_dia ADD COLUMN IF NOT EXISTS "nombre" TEXT`);
    await client.query(`ALTER TABLE comidas_del_dia ADD COLUMN IF NOT EXISTS "hora" TEXT`);
    console.log("✓ comidas_del_dia: columnas nombre y hora añadidas");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
