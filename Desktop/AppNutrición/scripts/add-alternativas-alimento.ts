import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #5 — Alternativas por ítem ("avena 50 g  o  cereales 70 g"): cada AlimentoEnComida
// puede tener varias alternativas equivalentes (alimento o receta). Excluyentes con
// el principal → no suman a los macros. Además limpia la columna `modalidad` del
// primer enfoque (descartado).
async function main() {
  const client = await pool.connect();
  try {
    // Limpiar el enfoque anterior (modalidad de plan), si quedó aplicado.
    await client.query(`ALTER TABLE planes_alimenticios DROP COLUMN IF EXISTS "modalidad"`);
    await client.query(`DROP TYPE IF EXISTS "ModalidadPlan"`);

    // Tabla de alternativas equivalentes de cada AlimentoEnComida.
    await client.query(`
      CREATE TABLE IF NOT EXISTS alternativas_alimento (
        id text PRIMARY KEY,
        "alimentoEnComidaId" text NOT NULL,
        "alimentoId" text,
        "recetaId" text,
        cantidad double precision NOT NULL,
        unidad "UnidadMedida" NOT NULL DEFAULT 'GRAMOS',
        orden integer NOT NULL DEFAULT 0
      )
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='alternativas_alimento_alimentoEnComidaId_fkey') THEN
          ALTER TABLE alternativas_alimento ADD CONSTRAINT "alternativas_alimento_alimentoEnComidaId_fkey"
            FOREIGN KEY ("alimentoEnComidaId") REFERENCES alimentos_en_comida(id) ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='alternativas_alimento_alimentoId_fkey') THEN
          ALTER TABLE alternativas_alimento ADD CONSTRAINT "alternativas_alimento_alimentoId_fkey"
            FOREIGN KEY ("alimentoId") REFERENCES alimentos(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='alternativas_alimento_recetaId_fkey') THEN
          ALTER TABLE alternativas_alimento ADD CONSTRAINT "alternativas_alimento_recetaId_fkey"
            FOREIGN KEY ("recetaId") REFERENCES recetas(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS "alternativas_alimento_alimentoEnComidaId_idx" ON alternativas_alimento("alimentoEnComidaId")`,
    );
    console.log("✓ Tabla alternativas_alimento lista; columna modalidad eliminada");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
