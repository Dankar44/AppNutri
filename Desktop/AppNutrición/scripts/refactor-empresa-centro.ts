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
    console.log("1/8 Creando enum EstadoSolicitud...");
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "EstadoSolicitud" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    console.log("2/8 Creando tabla empresas...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        slug TEXT NOT NULL UNIQUE,
        "liderId" TEXT NOT NULL UNIQUE,
        "maxMiembros" INT NOT NULL DEFAULT 5,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT empresas_liderId_fkey FOREIGN KEY ("liderId") REFERENCES dietistas(id) ON DELETE CASCADE
      );
    `);

    console.log("3/8 Añadiendo empresaId a dietistas...");
    await client.query(`
      ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "empresaId" TEXT;
    `);
    // FK solo si no existe
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE dietistas ADD CONSTRAINT dietistas_empresaId_fkey
          FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    console.log("4/8 Creando tabla solicitudes_empresa...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS solicitudes_empresa (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "empresaId" TEXT NOT NULL,
        "dietistaId" TEXT,
        email TEXT,
        estado "EstadoSolicitud" NOT NULL DEFAULT 'PENDIENTE',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT solicitudes_empresa_empresaId_fkey FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE,
        CONSTRAINT solicitudes_empresa_dietistaId_fkey FOREIGN KEY ("dietistaId") REFERENCES dietistas(id) ON DELETE CASCADE
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "solicitudes_empresa_empresaId_dietistaId_email_key"
      ON solicitudes_empresa ("empresaId", "dietistaId", email)
      NULLS NOT DISTINCT;
    `);

    console.log("5/8 Creando tabla movimientos_stock...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS movimientos_stock (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "alimentoId" TEXT NOT NULL,
        "dietistaId" TEXT NOT NULL,
        "empresaId" TEXT NOT NULL,
        tipo TEXT NOT NULL,
        cantidad INT NOT NULL,
        "stockAnterior" INT NOT NULL,
        "stockNuevo" INT NOT NULL,
        nota TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT movimientos_stock_alimentoId_fkey FOREIGN KEY ("alimentoId") REFERENCES alimentos(id) ON DELETE CASCADE,
        CONSTRAINT movimientos_stock_dietistaId_fkey FOREIGN KEY ("dietistaId") REFERENCES dietistas(id) ON DELETE CASCADE,
        CONSTRAINT movimientos_stock_empresaId_fkey FOREIGN KEY ("empresaId") REFERENCES empresas(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS movimientos_stock_alimentoId_idx ON movimientos_stock ("alimentoId");
      CREATE INDEX IF NOT EXISTS movimientos_stock_empresaId_idx ON movimientos_stock ("empresaId");
    `);

    console.log("6/8 Añadiendo compartido a alimentos...");
    await client.query(`
      ALTER TABLE alimentos ADD COLUMN IF NOT EXISTS compartido BOOLEAN NOT NULL DEFAULT false;
    `);

    console.log("7/8 Añadiendo columnas de stock a alimentos...");
    await client.query(`
      ALTER TABLE alimentos ADD COLUMN IF NOT EXISTS stock INT;
      ALTER TABLE alimentos ADD COLUMN IF NOT EXISTS "precioUnitario" DECIMAL(10,2);
      ALTER TABLE alimentos ADD COLUMN IF NOT EXISTS "stockMinimo" INT;
    `);

    console.log("8/8 Verificando...");
    const r = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('empresas', 'solicitudes_empresa', 'movimientos_stock') ORDER BY table_name"
    );
    console.log("Tablas creadas:", r.rows.map((row: { table_name: string }) => row.table_name));

    console.log("\nMigración completada.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
