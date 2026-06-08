// Migración: avisos de cita por paciente.
//  - avisarPorEmail (default true): el paciente recibe el email automático de cita.
//  - avisarPorWhatsapp (default false): preferencia de avisar por WhatsApp al crear cita.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("Añadiendo columnas de avisos a pacientes...");
    await client.query(
      `ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "avisarPorEmail" BOOLEAN NOT NULL DEFAULT true;`,
    );
    await client.query(
      `ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "avisarPorWhatsapp" BOOLEAN NOT NULL DEFAULT false;`,
    );
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='pacientes' AND column_name IN ('avisarPorEmail','avisarPorWhatsapp')
       ORDER BY column_name;`,
    );
    console.log("Columnas presentes:", rows.map((r) => r.column_name).join(", ") || "(ninguna)");
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
