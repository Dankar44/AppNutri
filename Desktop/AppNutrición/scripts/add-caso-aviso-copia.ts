import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #40 — El aviso de "N alumnos ya tienen su copia" se puede quitar con una ✕, por caso, y no
// vuelve (Guillermo, 3 sep 2026). Se guarda en el caso y no en el navegador para que tampoco
// reaparezca desde otro ordenador. Repetible.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE casos_clinicos ADD COLUMN IF NOT EXISTS "avisoCopiaOculto" BOOLEAN NOT NULL DEFAULT false`);
    console.log("✓ casos_clinicos.avisoCopiaOculto");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
