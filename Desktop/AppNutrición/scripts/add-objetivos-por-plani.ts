import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #78 (bloque 2) — Objetivos por planificación, propios de cada plan.
// Cuando una dieta usa varias planificaciones, el nutri puede ajustar los objetivos (kcal/macros) de
// cada una SOLO para esa dieta, sin tocar la planificación original. Se guardan como JSON:
//   { "<planificacionId>": { kcal, proteinas, carbohidratos, grasas } }
//   · Aditivo: los planes existentes quedan en NULL → siguen tomando los objetivos de la planificación.
//   · Idempotente y seguro (se puede correr varias veces).
async function main() {
  const client = await pool.connect();
  try {
    await client.query(
      `ALTER TABLE planes_alimenticios ADD COLUMN IF NOT EXISTS "objetivosPorPlani" JSONB`,
    );
    console.log("✓ planes_alimenticios: columna objetivosPorPlani (JSONB) añadida");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("✗ FALLO en la migración:", e.message);
  process.exit(1);
});
