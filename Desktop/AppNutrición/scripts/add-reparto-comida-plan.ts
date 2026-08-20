import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #78-C — El reparto de kcal/macros POR COMIDA pasa a copiarse en la dieta (igual que ya se copian
// las kcal y los macros objetivo): así cambiar el reparto en la planificación no altera las dietas
// ya creadas, y cada dieta puede tener el suyo.
//
// Columna NULLABLE y aditiva: las dietas existentes se quedan en NULL y siguen leyendo el reparto
// de la planificación (comportamiento actual), así que no cambia nada hasta que se creen dietas
// nuevas o se apliquen objetivos desde la planificación.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(
      `ALTER TABLE planes_alimenticios ADD COLUMN IF NOT EXISTS "repartoPorComida" JSONB`
    );
    const { rows } = await client.query(
      `SELECT count(*)::int AS total,
              count("repartoPorComida")::int AS con_reparto
       FROM planes_alimenticios`
    );
    console.log("✓ planes_alimenticios: columna repartoPorComida añadida (JSONB, nullable)");
    console.log(`  dietas totales: ${rows[0].total} · con reparto propio: ${rows[0].con_reparto}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
