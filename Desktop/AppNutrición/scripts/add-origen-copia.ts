import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #40 — «Actualizar el caso en los alumnos» (Guillermo, 3 sep 2026): si el profesor se equivoca en
// la ficha del caso, vuelca la versión actual a los alumnos que ya tienen su copia, sin quitar y
// poner el caso.
//
// Para respetar lo que el alumno haya añadido por su cuenta, cada medición y consulta copiada de la
// plantilla recuerda de cuál viene (`origenId`): al actualizar, las que vienen de la plantilla se
// actualizan o se quitan con ella, y las que añadió el alumno (sin origen) no se tocan. Los planes
// y la planificación del alumno no se tocan nunca.
//
// `casos_clinicos.copiasActualizadasAt`: cuándo se hizo por última vez, para enseñarlo. Repetible.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS "origenId" TEXT`);
    await client.query(`CREATE INDEX IF NOT EXISTS medidas_antropometricas_origen_idx ON medidas_antropometricas ("origenId") WHERE "origenId" IS NOT NULL`);
    await client.query(`ALTER TABLE consultas ADD COLUMN IF NOT EXISTS "origenId" TEXT`);
    await client.query(`CREATE INDEX IF NOT EXISTS consultas_origen_idx ON consultas ("origenId") WHERE "origenId" IS NOT NULL`);
    await client.query(`ALTER TABLE casos_clinicos ADD COLUMN IF NOT EXISTS "copiasActualizadasAt" TIMESTAMPTZ`);
    console.log("✓ medidas_antropometricas.origenId, consultas.origenId, casos_clinicos.copiasActualizadasAt");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
