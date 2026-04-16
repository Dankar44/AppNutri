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
    // Columnas en dietistas para Stripe Connect
    await client.query(`
      ALTER TABLE dietistas
      ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT,
      ADD COLUMN IF NOT EXISTS "stripeOnboarded" BOOLEAN DEFAULT FALSE;
    `);
    console.log("✓ Columnas stripeAccountId y stripeOnboarded añadidas a dietistas");

    // Columnas en pagos para Stripe Checkout
    await client.query(`
      ALTER TABLE pagos
      ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT,
      ADD COLUMN IF NOT EXISTS "stripePaymentUrl" TEXT;
    `);
    console.log("✓ Columnas stripeSessionId y stripePaymentUrl añadidas a pagos");

    console.log("\nMigración completada correctamente");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
