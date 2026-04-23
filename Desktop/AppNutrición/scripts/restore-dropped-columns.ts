// Restaura columnas eliminadas accidentalmente por prisma db push.
// Idempotente (ADD COLUMN IF NOT EXISTS).
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
    // dietistas
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "horarioLaboral" JSONB`);
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "duracionCitaDefault" INTEGER DEFAULT 30`);
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT`);
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "stripeOnboarded" BOOLEAN DEFAULT FALSE`);
    console.log("✓ dietistas restaurada");

    // pacientes
    await client.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "fichaSidebar" JSONB`);
    console.log("✓ pacientes.fichaSidebar restaurada");

    // seguimiento_diario
    await client.query(`ALTER TABLE seguimiento_diario ADD COLUMN IF NOT EXISTS "comidasData" JSONB`);
    console.log("✓ seguimiento_diario.comidasData restaurada");

    // pagos: crear tabla si no existe
    await client.query(`
      CREATE TABLE IF NOT EXISTS "pagos" (
        "id" TEXT NOT NULL,
        "dietistaId" TEXT NOT NULL,
        "pacienteId" TEXT,
        "concepto" TEXT NOT NULL,
        "importe" DOUBLE PRECISION NOT NULL,
        "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
        "metodoPago" TEXT,
        "fechaPago" TIMESTAMP(3),
        "notas" TEXT,
        "stripeSessionId" TEXT,
        "stripePaymentUrl" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "pagos_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "pagos_dietistaId_fkey" FOREIGN KEY ("dietistaId")
          REFERENCES "dietistas"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "pagos_pacienteId_fkey" FOREIGN KEY ("pacienteId")
          REFERENCES "pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS "pagos_dietistaId_idx" ON "pagos" ("dietistaId");`,
    );
    console.log("✓ pagos creada (tabla vacía)");

    // planificaciones — tabla completa
    await client.query(`
      CREATE TABLE IF NOT EXISTS "planificaciones" (
        "id" TEXT NOT NULL,
        "pacienteId" TEXT NOT NULL,
        "nombre" TEXT NOT NULL,
        "descripcion" TEXT,
        "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
        "fechaInicio" TIMESTAMP(3),
        "fechaFin" TIMESTAMP(3),
        "data" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "planificaciones_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "planificaciones_pacienteId_fkey" FOREIGN KEY ("pacienteId")
          REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS "planificaciones_pacienteId_estado_idx"
       ON "planificaciones" ("pacienteId", "estado");`,
    );
    console.log("✓ planificaciones restaurada (tabla vacía)");

    console.log("\n✓ Restauración completa");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
