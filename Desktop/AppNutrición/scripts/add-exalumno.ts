import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #39 — Al alumno no se le echa nunca (Guillermo, 1 sep 2026).
//
// Cuando se queda sin ninguna clase viva deja de ser alumno y pasa a cuenta normal. Estas dos
// columnas guardan eso: cuándo dejó de serlo, y si ya se le ha enseñado el aviso de que su año
// escolar terminó y que, por ser de los primeros, la cuenta se le queda gratis.
//
// OJO: lo de "gratis de por vida" es de esta época. Cuando haya pasarela de pago hay que volver
// aquí y decidir qué pasa con el alumno que termina la carrera.
//
// Aditivo y repetible. La tabla ya existe, así que su RLS ya está puesta; se comprueba igual.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "exAlumnoDesde" TIMESTAMPTZ`);
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "avisoFinCursoVisto" BOOLEAN NOT NULL DEFAULT false`);
    console.log("✓ dietistas.exAlumnoDesde y dietistas.avisoFinCursoVisto");

    const { rows } = await client.query(
      `SELECT relrowsecurity FROM pg_class WHERE oid = 'public.dietistas'::regclass`);
    if (!rows[0]?.relrowsecurity) {
      throw new Error("dietistas se ha quedado sin RLS: no se puede dejar así (brecha del 26 ago 2026)");
    }
    console.log("✓ dietistas mantiene su RLS");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
