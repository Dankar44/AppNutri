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
      CREATE TABLE IF NOT EXISTS solicitudes_colaborador (
        id            TEXT PRIMARY KEY,
        email         TEXT NOT NULL,
        telefono      TEXT NOT NULL,
        pais          TEXT NOT NULL,
        "numPacientes"  TEXT NOT NULL,
        modalidad     TEXT NOT NULL,
        "tipoTrabajo"   TEXT NOT NULL,
        "nivelEstudios" TEXT NOT NULL,
        "esProfesor"    BOOLEAN NOT NULL DEFAULT false,
        discapacidad  TEXT NOT NULL,
        "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS "solicitudes_colaborador_email_idx" ON solicitudes_colaborador(email)`,
    );
    console.log("✓ Tabla solicitudes_colaborador creada");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
