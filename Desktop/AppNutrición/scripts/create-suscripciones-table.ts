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
      DO $$ BEGIN
        CREATE TYPE "PlanSuscripcion" AS ENUM ('BASICO', 'PROFESIONAL');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "EstadoSuscripcion" AS ENUM ('ACTIVA', 'CANCELADA', 'EXPIRADA', 'PRUEBA');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "suscripciones" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "dietistaId" TEXT NOT NULL,
        "plan" "PlanSuscripcion" NOT NULL DEFAULT 'BASICO',
        "estado" "EstadoSuscripcion" NOT NULL DEFAULT 'PRUEBA',
        "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "fechaFin" TIMESTAMP(3),
        "stripeCustomerId" TEXT,
        "stripeSubscriptionId" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "suscripciones_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "suscripciones_dietistaId_key" UNIQUE ("dietistaId"),
        CONSTRAINT "suscripciones_dietistaId_fkey" FOREIGN KEY ("dietistaId")
          REFERENCES "dietistas"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    console.log("Tabla suscripciones creada correctamente");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
