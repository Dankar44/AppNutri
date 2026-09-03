import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #40 — Los planes y planificaciones que el profesor comparte con el caso llegan al alumno marcados
// como «Del profesor» y aparte de los suyos (Guillermo, 3 sep 2026: "sale como compartido por
// profesor, como si fuera una parte, y no como la planificación por defecto o ya activada").
//
// `origenId`: de qué plan/planificación de la plantilla viene la copia. `origenHuella`: cómo estaba
// la copia cuando se le mandó; si al actualizar el caso la copia sigue igual (el alumno no la ha
// tocado) se sustituye por la versión nueva del profesor, y si la ha tocado se respeta. Repetible.
async function main() {
  const client = await pool.connect();
  try {
    for (const tabla of ["planes_alimenticios", "planificaciones"]) {
      await client.query(`ALTER TABLE ${tabla} ADD COLUMN IF NOT EXISTS "origenId" TEXT`);
      await client.query(`ALTER TABLE ${tabla} ADD COLUMN IF NOT EXISTS "origenHuella" TEXT`);
      await client.query(`CREATE INDEX IF NOT EXISTS ${tabla}_origen_idx ON ${tabla} ("origenId") WHERE "origenId" IS NOT NULL`);
      console.log(`✓ ${tabla}.origenId, ${tabla}.origenHuella`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
