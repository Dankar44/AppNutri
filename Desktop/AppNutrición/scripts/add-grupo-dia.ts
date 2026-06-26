import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #75 — Juntar días.
// Días de un plan que "comen igual" comparten menú. Se etiquetan con un `grupoId` común; el día
// representante (el de menor orden de la semana dentro del grupo) guarda las comidas reales y los
// demás reflejan ese menú. `grupoId` es solo una etiqueta de agrupación dentro del mismo plan
// (sin FK: no referencia otra tabla).
//   · Nullable: los días y planes que YA existen quedan en NULL (sin agrupar) → intactos.
//   · Aditivo, idempotente y seguro (se puede correr varias veces).
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE dias_del_plan ADD COLUMN IF NOT EXISTS "grupoId" TEXT`);
    await client.query(
      `CREATE INDEX IF NOT EXISTS "dias_del_plan_grupoId_idx" ON dias_del_plan("grupoId")`,
    );
    console.log("✓ dias_del_plan: columna grupoId + índice añadidos (juntar días #75)");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("✗ FALLO en la migración:", e.message);
  process.exit(1);
});
