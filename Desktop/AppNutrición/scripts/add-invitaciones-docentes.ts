import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #39 — Invitaciones del módulo docente.
//
// Nadie le pone la contraseña a nadie: se envía un correo con un enlace y la persona completa su
// registro (nombre, apellidos y su propia contraseña), como en cualquier alta normal. Pedido por
// Guillermo el 30 ago 2026 para los profesores, y es el mismo mecanismo que usarán los alumnos en
// la fase 2 — por eso la tabla guarda el rol y no solo sirve para profesores.
//
// Aditiva: no toca nada de lo que ya existe.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS invitaciones_docentes (
        id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        token               TEXT NOT NULL UNIQUE,
        email               TEXT NOT NULL,
        rol                 "RolDocente" NOT NULL DEFAULT 'PROFESOR',
        "licenciaDocenteId" TEXT REFERENCES licencias_docentes(id) ON DELETE CASCADE,
        "invitadoPor"       TEXT,
        "expiraAt"          TIMESTAMP(3) NOT NULL,
        "aceptadaAt"        TIMESTAMP(3),
        "aceptadaPorId"     TEXT,
        "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT NOW()
      )
    `);
    // Una tabla creada sin RLS es la brecha del 26 ago 2026 otra vez.
    await client.query(`ALTER TABLE public.invitaciones_docentes ENABLE ROW LEVEL SECURITY`);
    await client.query(
      `CREATE INDEX IF NOT EXISTS "invitaciones_docentes_email_idx" ON invitaciones_docentes(email)`,
    );
    await client.query(
      `CREATE INDEX IF NOT EXISTS "invitaciones_docentes_licencia_idx" ON invitaciones_docentes("licenciaDocenteId")`,
    );

    const { rows } = await client.query(`
      SELECT (SELECT count(*)::int FROM invitaciones_docentes) AS total,
             (SELECT relrowsecurity FROM pg_class WHERE relname = 'invitaciones_docentes') AS rls
    `);
    console.log("✓ tabla invitaciones_docentes creada");
    console.log(`  invitaciones: ${rows[0].total} · RLS: ${rows[0].rls ? "ACTIVO" : "✗ DESACTIVADO"}`);
    if (!rows[0].rls) throw new Error("invitaciones_docentes se ha quedado SIN RLS");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
