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
    await client.query(`
      ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "esDemo" BOOLEAN NOT NULL DEFAULT false;
    `);
    console.log("✓ Columna esDemo añadida a pacientes");

    const result = await client.query(`
      UPDATE pacientes SET "esDemo" = true
      WHERE nombre = 'Paciente' AND apellidos = 'Prueba' AND "esDemo" = false
      RETURNING id, "dietistaId";
    `);
    console.log(`✓ Marcados ${result.rowCount} pacientes demo existentes como esDemo=true`);
    for (const row of result.rows) {
      console.log(`  - Paciente ${row.id} (dietista: ${row.dietistaId})`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
