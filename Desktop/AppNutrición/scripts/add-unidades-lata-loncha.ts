// #21: añade los valores LATA y LONCHA al enum UnidadMedida en Postgres.
// ALTER TYPE ... ADD VALUE es idempotente con IF NOT EXISTS y debe ejecutarse
// fuera de transacción. Ejecutar: npx tsx scripts/add-unidades-lata-loncha.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const { rows } = await pool.query(
    `SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS valores
     FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
     WHERE t.typname = 'UnidadMedida' GROUP BY t.typname`,
  );
  console.log("Enum actual:", JSON.stringify(rows[0] ?? null));
  if (!rows[0]) throw new Error("No se encontró el tipo UnidadMedida");

  await pool.query(`ALTER TYPE "UnidadMedida" ADD VALUE IF NOT EXISTS 'LATA'`);
  await pool.query(`ALTER TYPE "UnidadMedida" ADD VALUE IF NOT EXISTS 'LONCHA'`);

  const after = await pool.query(
    `SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder) AS valores
     FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
     WHERE t.typname = 'UnidadMedida'`,
  );
  console.log("Enum tras migración:", JSON.stringify(after.rows[0].valores));
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
