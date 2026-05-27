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
    const r1 = await client.query(`
      UPDATE dietistas SET "logoUrl" = "logoUrl_legacy"
      WHERE "logoUrl_legacy" IS NOT NULL
    `);
    console.log(`logoUrl restaurados: ${r1.rowCount}`);

    const r2 = await client.query(`
      UPDATE dietistas SET "pdfLogoUrl" = "pdfLogoUrl_legacy"
      WHERE "pdfLogoUrl_legacy" IS NOT NULL
    `);
    console.log(`pdfLogoUrl restaurados: ${r2.rowCount}`);

    const r3 = await client.query(`
      UPDATE pacientes SET "fotoUrl" = "fotoUrl_legacy"
      WHERE "fotoUrl_legacy" IS NOT NULL
    `);
    console.log(`fotoUrl restaurados: ${r3.rowCount}`);

    console.log("\nRollback completado.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
