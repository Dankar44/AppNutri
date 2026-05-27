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
      ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "logoUrl_legacy" TEXT;
      ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "pdfLogoUrl_legacy" TEXT;
      ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "fotoUrl_legacy" TEXT;
    `);
    console.log("Columnas legacy creadas");

    const r1 = await client.query(`
      UPDATE dietistas SET "logoUrl_legacy" = "logoUrl"
      WHERE "logoUrl" IS NOT NULL AND "logoUrl" LIKE 'data:%' AND "logoUrl_legacy" IS NULL
    `);
    console.log(`logoUrl_legacy: ${r1.rowCount} filas copiadas`);

    const r2 = await client.query(`
      UPDATE dietistas SET "pdfLogoUrl_legacy" = "pdfLogoUrl"
      WHERE "pdfLogoUrl" IS NOT NULL AND "pdfLogoUrl" LIKE 'data:%' AND "pdfLogoUrl_legacy" IS NULL
    `);
    console.log(`pdfLogoUrl_legacy: ${r2.rowCount} filas copiadas`);

    const r3 = await client.query(`
      UPDATE pacientes SET "fotoUrl_legacy" = "fotoUrl"
      WHERE "fotoUrl" IS NOT NULL AND "fotoUrl" LIKE 'data:%' AND "fotoUrl_legacy" IS NULL
    `);
    console.log(`fotoUrl_legacy: ${r3.rowCount} filas copiadas`);

    console.log("\nBackup completado.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
