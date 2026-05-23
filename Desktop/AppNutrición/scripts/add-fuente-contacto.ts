import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE dietistas
      ADD COLUMN IF NOT EXISTS "fuenteContacto" TEXT;
    `);
    console.log("Column fuenteContacto added to dietistas");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
