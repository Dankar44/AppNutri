import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// Fase 5 — Marca de que ya se avisó al profesor de que el plazo de esa asignación terminó.
//
// El primer diseño avisaba en cada entrega, y con veinte alumnos eso es una lluvia de avisos
// (Guillermo, 8 sep 2026: "eso puede ser un poco petada"). Ahora se avisa UNA vez, cuando acaba el
// plazo, con el número de entregas que quedan por revisar. Esta columna es lo que impide repetirlo.
//
// Coste: 8 bytes por asignación. Ninguno, vaya.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE asignaciones_caso ADD COLUMN IF NOT EXISTS "avisoPlazoAt" TIMESTAMP(3)`);
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'asignaciones_caso' AND column_name = 'avisoPlazoAt'`);
    console.log(rows.length === 1 ? "  ✓ asignaciones_caso.avisoPlazoAt" : "  ✗ no se ha creado");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
