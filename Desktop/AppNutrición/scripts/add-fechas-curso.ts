import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// Guillermo, 4 sep 2026: "más que curso 2026/27, que ponga fecha de inicio y fecha de fin de
// curso; el texto libre no tiene sentido". Fuera la columna `curso` (texto) de clases y licencias
// —producción nunca la tuvo: las migraciones que la creaban ya no la crean— y entra
// `clases.fechaInicioCurso` (la licencia ya tenía `fechaInicio`). Las clases que existan arrancan
// en su fecha de creación. Repetible.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE clases ADD COLUMN IF NOT EXISTS "fechaInicioCurso" TIMESTAMP(3)`);
    await client.query(`UPDATE clases SET "fechaInicioCurso" = "createdAt" WHERE "fechaInicioCurso" IS NULL`);
    await client.query(`ALTER TABLE clases DROP COLUMN IF EXISTS curso`);
    await client.query(`ALTER TABLE licencias_docentes DROP COLUMN IF EXISTS curso`);
    console.log("✓ clases.fechaInicioCurso; fuera clases.curso y licencias_docentes.curso");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
