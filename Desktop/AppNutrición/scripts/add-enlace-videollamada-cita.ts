// Migración manual: añade la columna enlaceVideollamada a citas (#74 / #63).
// Enlace de videollamada manual (Zoom, Meet, Teams...) por cita.
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
    console.log("Añadiendo columna enlaceVideollamada a citas...");
    await client.query(
      `ALTER TABLE citas ADD COLUMN IF NOT EXISTS "enlaceVideollamada" TEXT;`,
    );
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='citas' AND column_name='enlaceVideollamada';`,
    );
    console.log(rows.length ? "OK: columna presente." : "ERROR: no se creó la columna.");
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
