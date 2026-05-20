import { Pool } from "pg";
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log("Adding earlyAdopter column...");
  await pool.query(`
    ALTER TABLE dietistas
    ADD COLUMN IF NOT EXISTS "earlyAdopter" BOOLEAN NOT NULL DEFAULT false
  `);

  console.log("Setting earlyAdopter=true for the first 50 dietistas...");
  const result = await pool.query(`
    UPDATE dietistas
    SET "earlyAdopter" = true
    WHERE id IN (
      SELECT id FROM dietistas
      ORDER BY "createdAt" ASC
      LIMIT 50
    )
  `);

  console.log(`Updated ${result.rowCount} rows.`);

  const check = await pool.query(
    `SELECT COUNT(*) as total FROM dietistas WHERE "earlyAdopter" = true`
  );
  console.log(`Total earlyAdopter: ${check.rows[0].total}`);

  await pool.end();
  console.log("Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
