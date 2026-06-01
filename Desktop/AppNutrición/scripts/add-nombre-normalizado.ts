import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { normalizarParaBusqueda } from "../src/lib/alimento-utils";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    console.log("1/4 Añadiendo columna nombreNormalizado...");
    await client.query(`ALTER TABLE alimentos ADD COLUMN IF NOT EXISTS "nombreNormalizado" TEXT`);
    await client.query(`ALTER TABLE recetas ADD COLUMN IF NOT EXISTS "nombreNormalizado" TEXT`);

    console.log("2/4 Creando índices...");
    await client.query(`CREATE INDEX IF NOT EXISTS alimentos_nombre_norm_idx ON alimentos ("nombreNormalizado" text_pattern_ops)`);
    await client.query(`CREATE INDEX IF NOT EXISTS recetas_nombre_norm_idx ON recetas ("nombreNormalizado" text_pattern_ops)`);

    console.log("3/4 Poblando alimentos...");
    const alimentos = await client.query<{ id: string; nombre: string }>(`SELECT id, nombre FROM alimentos`);
    for (const a of alimentos.rows) {
      await client.query(`UPDATE alimentos SET "nombreNormalizado" = $1 WHERE id = $2`, [
        normalizarParaBusqueda(a.nombre),
        a.id,
      ]);
    }
    console.log(`   ${alimentos.rows.length} alimentos normalizados`);

    console.log("4/4 Poblando recetas...");
    const recetas = await client.query<{ id: string; nombre: string }>(`SELECT id, nombre FROM recetas`);
    for (const r of recetas.rows) {
      await client.query(`UPDATE recetas SET "nombreNormalizado" = $1 WHERE id = $2`, [
        normalizarParaBusqueda(r.nombre),
        r.id,
      ]);
    }
    console.log(`   ${recetas.rows.length} recetas normalizadas`);

    console.log("✅ Migración completada");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
