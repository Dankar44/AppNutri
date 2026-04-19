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
    await client.query(`ALTER TABLE recetas ALTER COLUMN "dietistaId" DROP NOT NULL`);
    console.log("  · recetas.dietistaId → nullable");

    await client.query(`
      CREATE TABLE IF NOT EXISTS receta_favoritos (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "dietistaId" TEXT NOT NULL REFERENCES dietistas(id) ON DELETE CASCADE,
        "recetaId"   TEXT NOT NULL REFERENCES recetas(id)  ON DELETE CASCADE,
        "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE ("dietistaId", "recetaId")
      )
    `);
    console.log("  · tabla receta_favoritos lista");

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_receta_favoritos_dietista
      ON receta_favoritos ("dietistaId")
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_recetas_globales
      ON recetas ("dietistaId") WHERE "dietistaId" IS NULL
    `);
    console.log("  · índices creados");

    console.log("\n✓ Migración recetas globales lista");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
