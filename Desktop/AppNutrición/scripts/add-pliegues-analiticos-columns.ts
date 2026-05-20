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
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "pliegueAbdominal" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "pliegueAxilar" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "plieguePectoral" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "pliegueSubescapular" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "pliegueSuprailiaco" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "pliegueTricipital" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "pliegueMuslo" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "colesterolHDL" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "colesterolLDL" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "colesterolTotal" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "presionDiastolica" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "presionSistolica" DOUBLE PRECISION;
      ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS trigliceridos DOUBLE PRECISION;
    `);
    console.log("Done: columnas de pliegues cutáneos y datos analíticos añadidas a medidas_antropometricas");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
