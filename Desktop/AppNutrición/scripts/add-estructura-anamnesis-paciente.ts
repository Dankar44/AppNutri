import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #18 (Fase 2B) — Anamnesis propia por paciente: estructura editada solo para ese paciente
// (opción "guardar solo para este paciente"). Null = usa su plantilla o la genérica.
// Aditivo, idempotente y seguro.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(
      `ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "estructuraAnamnesis" JSONB`,
    );
    console.log("✓ pacientes.estructuraAnamnesis (JSONB) añadida");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
