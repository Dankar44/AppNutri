import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #40 — La planificación y el plan del paciente de un caso NO se comparten por defecto.
//
// Guillermo, 2 sep 2026: "que el profesor en un caso se pueda hacer el plan de alimentación y no
// compartirlo, para así él tener el suyo y compararlo con lo que le entregan los alumnos, porque
// ahora mismo todo lo que haga ahí se les manda". Lo que el profesor haga en Planificación y Plan
// de alimentación es SU solución, salvo que encienda `compartirPlanes`: entonces se les copia al
// empezar el caso, con el resto de la ficha. El resto (datos, anamnesis, mediciones, horario,
// recomendaciones) viaja siempre. Repetible.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE casos_clinicos ADD COLUMN IF NOT EXISTS "compartirPlanes" BOOLEAN NOT NULL DEFAULT false`);
    console.log("✓ casos_clinicos.compartirPlanes (por defecto: no se comparte)");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
