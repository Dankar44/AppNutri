import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// De qué curso es cada enlace de profesorado.
//
// Los enlaces no se reinician: para el curso nuevo se crea otro (Guillermo, 8 sep 2026). Sin este
// campo, al renovar la licencia el enlace del año pasado volvería a valer y regalaría plazas.
//
// Se guarda el año en que empieza el curso: 2026 es el curso 2026/27. Los que ya existan se
// quedan en el curso en el que estamos.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE enlaces_profesores ADD COLUMN IF NOT EXISTS "cursoAnio" INTEGER`);
    // El curso en el que estamos: de septiembre a agosto.
    const hoy = new Date();
    const actual = hoy.getUTCMonth() >= 8 ? hoy.getUTCFullYear() : hoy.getUTCFullYear() - 1;
    const { rowCount } = await client.query(
      `UPDATE enlaces_profesores SET "cursoAnio" = $1 WHERE "cursoAnio" IS NULL`, [actual]);
    await client.query(`ALTER TABLE enlaces_profesores ALTER COLUMN "cursoAnio" SET NOT NULL`);
    console.log(`  ✓ enlaces_profesores.cursoAnio (${rowCount} enlaces puestos en el curso ${actual}/${String(actual + 1).slice(2)})`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
