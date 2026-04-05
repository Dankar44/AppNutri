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
      CREATE TABLE IF NOT EXISTS "seguimiento_diario" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "pacienteId" TEXT NOT NULL,
        "fecha" DATE NOT NULL,
        "cumplido" BOOLEAN DEFAULT false,
        "aguaML" INTEGER DEFAULT 0,
        "ejercicio" BOOLEAN DEFAULT false,
        "ejercicioMinutos" INTEGER DEFAULT 0,
        "ejercicioKcal" INTEGER DEFAULT 0,
        "ejercicioTipo" TEXT,
        "ejercicioDistanciaKm" FLOAT DEFAULT 0,
        "notas" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "seguimiento_diario_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "seguimiento_diario_pacienteId_fecha_key" UNIQUE ("pacienteId", "fecha"),
        CONSTRAINT "seguimiento_diario_pacienteId_fkey" FOREIGN KEY ("pacienteId")
          REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log("Tabla seguimiento_diario creada correctamente");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
