import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #39 (issue #31) — Compartir recetas, como ya se comparten los alimentos.
//
// `alimentos` ya tenía `compartido` para el material del centro; `recetas` no, y el profesor
// necesita poder pasarle a su clase las dos cosas. Mismo campo y mismo significado: "esto lo ven
// los demás" (los del centro y, si es profesor, sus alumnos). Por defecto NADA se comparte: el
// que comparte tiene que decirlo, que es justo lo que pidió Guillermo ("pero que puedan no
// compartirlas").
//
// Aditivo y repetible. La tabla ya existe, así que su RLS ya está puesta; se comprueba igual.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE recetas ADD COLUMN IF NOT EXISTS compartido BOOLEAN NOT NULL DEFAULT false`);
    console.log("✓ recetas.compartido");

    // Buscar por compartido siempre va junto al dueño: sin el índice, listar el material de una
    // clase recorre la tabla entera.
    await client.query(
      `CREATE INDEX IF NOT EXISTS recetas_dietista_compartido_idx ON recetas ("dietistaId", compartido)`);
    await client.query(
      `CREATE INDEX IF NOT EXISTS alimentos_dietista_compartido_idx ON alimentos ("dietistaId", compartido)`);
    console.log("✓ índices de material compartido");

    const { rows } = await client.query(
      `SELECT relrowsecurity FROM pg_class WHERE oid = 'public.recetas'::regclass`);
    if (!rows[0]?.relrowsecurity) {
      throw new Error("recetas se ha quedado sin RLS: no se puede dejar así (brecha del 26 ago 2026)");
    }
    console.log("✓ recetas mantiene su RLS");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
