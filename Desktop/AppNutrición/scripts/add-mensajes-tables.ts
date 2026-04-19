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
    // Enum AutorMensaje
    await client.query(`DO $$ BEGIN
      CREATE TYPE "AutorMensaje" AS ENUM ('DIETISTA', 'PACIENTE');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$`);
    console.log("  · enum AutorMensaje listo");

    // Tabla conversaciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversaciones (
        id TEXT PRIMARY KEY,
        "dietistaId" TEXT NOT NULL REFERENCES dietistas(id) ON DELETE CASCADE,
        "pacienteId" TEXT NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
        "ultimoMensajeAt" TIMESTAMP(3),
        "archivadaDietista" BOOLEAN NOT NULL DEFAULT false,
        "noLeidosDietista" INTEGER NOT NULL DEFAULT 0,
        "noLeidosPaciente" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("  · tabla conversaciones creada");

    // Constraint único (dietistaId, pacienteId)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "conversaciones_dietistaId_pacienteId_key"
      ON conversaciones("dietistaId", "pacienteId")
    `);

    // Índices conversaciones
    await client.query(`
      CREATE INDEX IF NOT EXISTS "conversaciones_dietistaId_ultimoMensajeAt_idx"
      ON conversaciones("dietistaId", "ultimoMensajeAt" DESC)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS "conversaciones_pacienteId_ultimoMensajeAt_idx"
      ON conversaciones("pacienteId", "ultimoMensajeAt" DESC)
    `);
    console.log("  · índices conversaciones creados");

    // Tabla mensajes
    await client.query(`
      CREATE TABLE IF NOT EXISTS mensajes (
        id TEXT PRIMARY KEY,
        "conversacionId" TEXT NOT NULL REFERENCES conversaciones(id) ON DELETE CASCADE,
        autor "AutorMensaje" NOT NULL,
        "dietistaId" TEXT REFERENCES dietistas(id) ON DELETE SET NULL,
        "pacienteId" TEXT REFERENCES pacientes(id) ON DELETE SET NULL,
        texto TEXT NOT NULL,
        "adjuntoUrl" TEXT,
        "adjuntoNombre" TEXT,
        "adjuntoTipo" TEXT,
        "leidoEn" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("  · tabla mensajes creada");

    await client.query(`
      CREATE INDEX IF NOT EXISTS "mensajes_conversacionId_createdAt_idx"
      ON mensajes("conversacionId", "createdAt" DESC)
    `);
    console.log("  · índice mensajes creado");

    console.log("\n✓ Migración de mensajes completada");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
