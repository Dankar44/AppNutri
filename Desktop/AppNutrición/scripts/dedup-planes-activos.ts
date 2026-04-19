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
    // Para cada paciente con >1 dieta activa, dejar SOLO la más reciente activa.
    const { rows: conflictos } = await client.query<{
      pacienteId: string;
      count: string;
    }>(
      `SELECT "pacienteId", COUNT(*)::text AS count
         FROM planes_alimenticios
        WHERE activo = true
        GROUP BY "pacienteId"
       HAVING COUNT(*) > 1`,
    );

    console.log(`Pacientes con múltiples dietas activas: ${conflictos.length}`);

    let desactivadas = 0;
    for (const { pacienteId, count } of conflictos) {
      // Tomar el id de la más reciente; desactivar el resto.
      const { rows: reciente } = await client.query<{ id: string }>(
        `SELECT id FROM planes_alimenticios
          WHERE "pacienteId" = $1 AND activo = true
          ORDER BY "createdAt" DESC
          LIMIT 1`,
        [pacienteId],
      );
      if (!reciente[0]) continue;
      const keepId = reciente[0].id;
      const res = await client.query(
        `UPDATE planes_alimenticios
            SET activo = false
          WHERE "pacienteId" = $1 AND activo = true AND id <> $2`,
        [pacienteId, keepId],
      );
      desactivadas += res.rowCount ?? 0;
      console.log(`  · paciente ${pacienteId}: ${count} activas → 1 (desactivadas ${res.rowCount})`);
    }

    console.log(`\n✓ Total de dietas desactivadas: ${desactivadas}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
