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
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "pdfLogoUrl" TEXT`);
    console.log("✓ Columna pdfLogoUrl añadida");
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "marcaPdf" TEXT`);
    console.log("✓ Columna marcaPdf añadida");
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "temaPdf" TEXT`);
    console.log("✓ Columna temaPdf añadida");
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "colorPrimarioPdf" TEXT`);
    console.log("✓ Columna colorPrimarioPdf añadida");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
