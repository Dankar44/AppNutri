import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #78 (bloque 2) — Planificaciones elegidas para un plan.
// Un plan usa un SUBCONJUNTO de las planificaciones del paciente (las que el nutri marca al crear
// la dieta, con la casilla "Varias", + las que añada luego). Se guardan como array de ids.
//   · Aditivo: los planes que YA existen quedan con array vacío → siguen con su objetivo global
//     (no cambia nada de lo que hay).
//   · Idempotente y seguro (se puede correr varias veces).
async function main() {
  const client = await pool.connect();
  try {
    await client.query(
      `ALTER TABLE planes_alimenticios ADD COLUMN IF NOT EXISTS "planificacionIds" TEXT[] DEFAULT ARRAY[]::TEXT[]`,
    );
    console.log("✓ planes_alimenticios: columna planificacionIds (TEXT[]) añadida");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("✗ FALLO en la migración:", e.message);
  process.exit(1);
});
