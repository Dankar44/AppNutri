import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #78 (1B) — Planificación por tipo de día.
// Cada DiaDelPlan puede apuntar a una Planificacion (su "tipo de día": descanso / competición /
// entreno…), de la que hereda los objetivos kcal/macros de ESE día.
//   · Nullable: los días y planes que YA existen quedan en NULL → siguen usando los objetivos
//     globales del plan (PlanAlimenticio.caloriasObjetivo…). No se toca ni un dato existente.
//   · ON DELETE SET NULL: borrar una planificación NO borra días del plan; solo los deja sin
//     tipo de día (vuelven a los objetivos globales).
// Aditivo, idempotente y seguro (se puede correr varias veces).
async function main() {
  const client = await pool.connect();
  try {
    // 1) Columna nueva (nullable).
    await client.query(
      `ALTER TABLE dias_del_plan ADD COLUMN IF NOT EXISTS "planificacionId" TEXT`,
    );

    // 2) Clave foránea con ON DELETE SET NULL (idempotente: solo si no existe ya).
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'dias_del_plan_planificacionId_fkey'
        ) THEN
          ALTER TABLE dias_del_plan
            ADD CONSTRAINT "dias_del_plan_planificacionId_fkey"
            FOREIGN KEY ("planificacionId") REFERENCES planificaciones(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);

    // 3) Índice para la FK (acelera los filtros por planificación).
    await client.query(
      `CREATE INDEX IF NOT EXISTS "dias_del_plan_planificacionId_idx" ON dias_del_plan("planificacionId")`,
    );

    console.log(
      "✓ dias_del_plan: columna planificacionId + FK (ON DELETE SET NULL) + índice añadidos",
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
