import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// Cuánta gente admite el enlace de UNA clase.
//
// Hasta ahora el único tope era el de la facultad: un profesor con 300 en la bolsa podía llenarla
// él solo y dejar sin sitio a los demás. Ahora al abrir el enlace pone su número —"en mi clase somos
// 60"— y manda el que se agote antes, el suyo o el de la facultad (Guillermo, 8 sep 2026).
//
// Nulo = sin tope propio, como hasta ahora. Coste: 4 bytes por clase.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE clases ADD COLUMN IF NOT EXISTS "cupoEnlace" INTEGER`);
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'clases' AND column_name = 'cupoEnlace'`);
    console.log(rows.length === 1 ? "  ✓ clases.cupoEnlace" : "  ✗ no se ha creado");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
