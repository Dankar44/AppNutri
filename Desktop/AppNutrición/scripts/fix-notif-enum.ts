import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const nuevosValores = [
  "EMPRESA_SOLICITUD",
  "EMPRESA_ACEPTADA",
  "EMPRESA_RECHAZADA",
  "EMPRESA_MIEMBRO_SALIO",
  "EMPRESA_LIDER_TRANSFERIDO",
  "STOCK_BAJO",
];

async function main() {
  const client = await pool.connect();
  try {
    const r = await client.query(
      `SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'TipoNotificacion' ORDER BY e.enumsortorder`
    );
    const existentes = r.rows.map((row: { enumlabel: string }) => row.enumlabel);
    console.log("Valores actuales:", existentes);

    for (const val of nuevosValores) {
      if (existentes.includes(val)) {
        console.log(`  ${val} — ya existe`);
      } else {
        await client.query(`ALTER TYPE "TipoNotificacion" ADD VALUE IF NOT EXISTS '${val}'`);
        console.log(`  ${val} — AÑADIDO`);
      }
    }

    const r2 = await client.query(
      `SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'TipoNotificacion' ORDER BY e.enumsortorder`
    );
    console.log("\nValores finales:", r2.rows.map((row: { enumlabel: string }) => row.enumlabel));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
