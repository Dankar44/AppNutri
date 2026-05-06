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
    // Enum AutorSoporte
    await client.query(`DO $$ BEGIN
      CREATE TYPE "AutorSoporte" AS ENUM ('DIETISTA', 'ADMIN');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$`);
    console.log("  · enum AutorSoporte listo");

    // Tabla mensajes_soporte
    await client.query(`
      CREATE TABLE IF NOT EXISTS mensajes_soporte (
        id TEXT PRIMARY KEY,
        "dietistaId" TEXT NOT NULL REFERENCES dietistas(id) ON DELETE CASCADE,
        autor "AutorSoporte" NOT NULL,
        texto TEXT NOT NULL,
        "leidoEn" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("  · tabla mensajes_soporte creada");

    // Índice compuesto
    await client.query(`
      CREATE INDEX IF NOT EXISTS "mensajes_soporte_dietistaId_createdAt_idx"
      ON mensajes_soporte("dietistaId", "createdAt")
    `);
    console.log("  · índice mensajes_soporte creado");

    // Campo noLeidosSoporte en dietistas
    await client.query(`
      ALTER TABLE dietistas
      ADD COLUMN IF NOT EXISTS "noLeidosSoporte" INTEGER NOT NULL DEFAULT 0
    `);
    console.log('  · columna "noLeidosSoporte" en dietistas lista');

    console.log("\n✓ Migración de mensajes soporte completada");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
