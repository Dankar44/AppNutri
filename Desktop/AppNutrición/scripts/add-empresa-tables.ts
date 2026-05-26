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
    console.log("1/8 Creando tabla empresas...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS empresas (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        slug TEXT NOT NULL UNIQUE,
        "liderId" TEXT NOT NULL UNIQUE REFERENCES dietistas(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    console.log("2/8 Añadiendo empresaId a dietistas...");
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "empresaId" TEXT REFERENCES empresas(id) ON DELETE SET NULL`);
    await client.query(`CREATE INDEX IF NOT EXISTS dietistas_empresa_idx ON dietistas("empresaId")`);

    console.log("3/8 Creando tabla solicitudes_empresa...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS solicitudes_empresa (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "empresaId" TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        "dietistaId" TEXT NOT NULL REFERENCES dietistas(id) ON DELETE CASCADE,
        estado TEXT NOT NULL DEFAULT 'PENDIENTE',
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE("empresaId", "dietistaId")
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS solicitudes_empresa_estado_idx ON solicitudes_empresa("empresaId", estado)`);

    console.log("4/8 Añadiendo columnas de stock a alimentos...");
    await client.query(`ALTER TABLE alimentos ADD COLUMN IF NOT EXISTS stock INT`);
    await client.query(`ALTER TABLE alimentos ADD COLUMN IF NOT EXISTS "precioUnitario" DOUBLE PRECISION`);
    await client.query(`ALTER TABLE alimentos ADD COLUMN IF NOT EXISTS "stockMinimo" INT`);

    console.log("5/8 Creando tabla movimientos_stock...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS movimientos_stock (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "alimentoId" TEXT NOT NULL REFERENCES alimentos(id) ON DELETE CASCADE,
        "dietistaId" TEXT NOT NULL REFERENCES dietistas(id) ON DELETE CASCADE,
        "empresaId" TEXT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        cantidad INT NOT NULL,
        "stockAnterior" INT NOT NULL,
        "stockNuevo" INT NOT NULL,
        nota TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS movimientos_stock_alimento_idx ON movimientos_stock("alimentoId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS movimientos_stock_empresa_idx ON movimientos_stock("empresaId")`);

    console.log("6/8 Añadiendo tipos de notificación...");
    const tipos = [
      "EMPRESA_SOLICITUD",
      "EMPRESA_ACEPTADA",
      "EMPRESA_RECHAZADA",
      "EMPRESA_MIEMBRO_SALIO",
      "EMPRESA_LIDER_TRANSFERIDO",
      "STOCK_BAJO",
    ];
    for (const tipo of tipos) {
      await client.query(`ALTER TYPE "TipoNotificacion" ADD VALUE IF NOT EXISTS '${tipo}'`).catch(() => {
        console.log(`  Tipo ${tipo} ya existe`);
      });
    }

    console.log("7/8 Creando índices adicionales...");
    await client.query(`CREATE INDEX IF NOT EXISTS movimientos_stock_created_idx ON movimientos_stock("createdAt" DESC)`);

    console.log("8/8 Migración completada.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
