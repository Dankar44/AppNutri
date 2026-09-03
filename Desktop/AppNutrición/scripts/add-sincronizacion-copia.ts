import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #40 — La copia del alumno se pone al día SOLA (Guillermo, 3 sep 2026: "todo se actualiza, el
// peso, el horario… aunque lo tengan empezado; lo único que va por compartir es la planificación
// y el plan"). Cuando el alumno abre su paciente del caso se compara la plantilla con la huella
// que tenía la copia al sincronizarse por última vez (`pacientes.origenHuella`) y, si ha cambiado,
// se le vuelca ahí mismo. Sin botón.
//
// De paso se quitan las dos columnas del botón manual y del aviso con ✕, que duraron un día en
// desarrollo y no llegaron a producción: casos_clinicos.avisoCopiaOculto y copiasActualizadasAt.
// Repetible.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "origenHuella" TEXT`);
    await client.query(`ALTER TABLE casos_clinicos DROP COLUMN IF EXISTS "avisoCopiaOculto"`);
    await client.query(`ALTER TABLE casos_clinicos DROP COLUMN IF EXISTS "copiasActualizadasAt"`);
    console.log("✓ pacientes.origenHuella (y fuera avisoCopiaOculto / copiasActualizadasAt)");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
