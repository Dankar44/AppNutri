import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #18 — Plantillas de anamnesis por especialidad.
//   · plantillas_anamnesis: cada dietista define plantillas con nombre (Deportiva, Digestivo…) cuya
//     `estructura` (JSONB) describe secciones y preguntas (fijas o propias). Ver src/lib/anamnesis-plantillas.ts.
//   · pacientes.plantillaAnamnesisId: la plantilla aplicada a ese paciente (NULL = anamnesis genérica).
//     ON DELETE SET NULL → borrar una plantilla deja a sus pacientes en la genérica, sin romper nada.
// Aditivo, idempotente y seguro (se puede correr varias veces; no toca ningún dato existente).
async function main() {
  const client = await pool.connect();
  try {
    // 1) Tabla de plantillas.
    await client.query(`
      CREATE TABLE IF NOT EXISTS plantillas_anamnesis (
        id TEXT PRIMARY KEY,
        "dietistaId" TEXT NOT NULL,
        nombre TEXT NOT NULL,
        estructura JSONB NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2) FK a dietistas (ON DELETE CASCADE) — idempotente.
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plantillas_anamnesis_dietistaId_fkey') THEN
          ALTER TABLE plantillas_anamnesis
            ADD CONSTRAINT "plantillas_anamnesis_dietistaId_fkey"
            FOREIGN KEY ("dietistaId") REFERENCES dietistas(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    // 3) Índice por dietista.
    await client.query(
      `CREATE INDEX IF NOT EXISTS "plantillas_anamnesis_dietistaId_idx" ON plantillas_anamnesis("dietistaId")`,
    );

    // 4) Columna en pacientes + FK (ON DELETE SET NULL).
    await client.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "plantillaAnamnesisId" TEXT`);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pacientes_plantillaAnamnesisId_fkey') THEN
          ALTER TABLE pacientes
            ADD CONSTRAINT "pacientes_plantillaAnamnesisId_fkey"
            FOREIGN KEY ("plantillaAnamnesisId") REFERENCES plantillas_anamnesis(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    console.log(
      "✓ plantillas_anamnesis (tabla + FK dietista + índice) y pacientes.plantillaAnamnesisId (+ FK SET NULL) creados",
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
