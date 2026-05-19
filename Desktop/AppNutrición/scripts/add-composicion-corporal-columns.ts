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
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "grasaSubcutanea" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "musculoEsqueletico" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "agua" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "masaOsea" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "perimetroAbdomen" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "grasaVisceral" DOUBLE PRECISION;
    `);
    console.log("Done: columnas de composición corporal añadidas a medidas_antropometricas");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
