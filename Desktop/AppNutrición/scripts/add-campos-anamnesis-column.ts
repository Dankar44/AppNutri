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
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "camposAnamnesis" JSONB`);
    console.log("✓ Columna camposAnamnesis añadida");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
