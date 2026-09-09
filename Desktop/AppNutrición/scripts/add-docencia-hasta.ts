import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// Hasta cuándo conserva el espacio docente un profesor que ya no está en ninguna universidad.
//
// Se decidió el 9 sep 2026, rectificando lo de esa misma mañana: al salir de una facultad NO se le
// quita el apartado docente en el acto, porque su plaza de ese curso está pagada y sus casos son
// suyos. Lo conserva hasta el 31 de agosto del curso en que salió; a partir de ahí, si nadie le ha
// metido en otra universidad, pasa a ser un nutricionista normal sin perder nada.
//
// Nulo = no aplica (o está en una universidad, o nunca fue profesor). Coste: 8 bytes por cuenta.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "docenciaHasta" TIMESTAMP(3)`);
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'dietistas' AND column_name = 'docenciaHasta'`);
    console.log(rows.length === 1 ? "  ✓ dietistas.docenciaHasta" : "  ✗ no se ha creado");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
