import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #39 — Persona de contacto de la licencia (opcional): con quién se habla en esa universidad.
// Pedido por Guillermo el 30 ago 2026 al crear la licencia de la Rey Juan Carlos.
// Columna aditiva y nullable: no cambia nada de lo que ya existe.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(
      `ALTER TABLE licencias_docentes ADD COLUMN IF NOT EXISTS "personaContacto" TEXT`,
    );
    const { rows } = await client.query(
      `SELECT count(*)::int AS total, count("personaContacto")::int AS con_contacto
       FROM licencias_docentes`,
    );
    console.log("✓ licencias_docentes: columna personaContacto añadida (TEXT, nullable)");
    console.log(`  licencias: ${rows[0].total} · con persona de contacto: ${rows[0].con_contacto}`);

    // La tabla ya debería tener RLS de cuando se creó; se comprueba por si acaso.
    const { rows: rls } = await client.query(
      `SELECT relrowsecurity FROM pg_class WHERE relname = 'licencias_docentes'`,
    );
    console.log(`  RLS: ${rls[0]?.relrowsecurity ? "ACTIVO" : "✗ DESACTIVADO"}`);
    if (!rls[0]?.relrowsecurity) throw new Error("licencias_docentes sin RLS");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
