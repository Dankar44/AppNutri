// Migración: añadir tipos de notificación para pagos.
// Idempotente.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

async function exec(client: pg.PoolClient, sql: string, label: string) {
  try {
    await client.query(sql);
    console.log(`  ✓ ${label}`);
  } catch (e) {
    console.warn(`  ! ${label} falló: ${(e as Error).message}`);
  }
}

async function main() {
  const client = await pool.connect();
  try {
    console.log("\n━━ Tipos de notificación de pagos ━━");
    for (const v of ["PAGO_RECIBIDO", "PAGO_PENDIENTE", "PAGO_FALLIDO"]) {
      await exec(
        client,
        `ALTER TYPE "TipoNotificacion" ADD VALUE IF NOT EXISTS '${v}'`,
        v,
      );
    }
    console.log("\n✅ Migración completada\n");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
