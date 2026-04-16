import { config } from "dotenv";
config({ path: ".env.local" });
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
      CREATE TABLE IF NOT EXISTS "planificaciones" (
        "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "pacienteId"          TEXT NOT NULL,
        "dietistaId"          TEXT NOT NULL,
        "nombre"              TEXT NOT NULL DEFAULT 'Planificación por defecto',
        "estado"              TEXT NOT NULL DEFAULT 'activa',
        "esDefecto"           BOOLEAN NOT NULL DEFAULT false,
        "fechaInicio"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "fechaUltimoCambio"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "fechaFinPrevista"    TIMESTAMP(3),
        "datos"               JSONB NOT NULL DEFAULT '{}',
        "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "planificaciones_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "planificaciones_pacienteId_fkey" FOREIGN KEY ("pacienteId")
          REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log("✅ Tabla planificaciones creada");

    // Índice por paciente + estado para queries frecuentes
    await client.query(`
      CREATE INDEX IF NOT EXISTS "planificaciones_pacienteId_estado_idx"
      ON "planificaciones" ("pacienteId", "estado");
    `);
    console.log("✅ Índice creado");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
