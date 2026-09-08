import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// Fase 5 — Los avisos del espacio docente, dentro de la app (nada de correos: el plan gratuito de
// Resend son 3.000 al mes y 100 al día, y una facultad de 300 alumnos se los come sola).
//
// Al alumno ya se le avisa (CASO_ASIGNADO y CASO_CORREGIDO existen desde la fase 4). Lo que
// faltaba es el camino de vuelta: que el profesor se entere de que le han entregado.
//
// Añadir valores a un enum obliga a hacerlo en LOS DOS entornos y a regenerar el cliente de
// Prisma; si no, el que se queda atrás peta con "Value 'X' not found in enum".
//
// Coste: una fila por entrega. Una facultad de 300 alumnos con 4 casos son 1.200 filas por curso
// (bastante menos de 1 MB), y la limpieza automática se lleva las leídas viejas.
//
// Nota: en la base de DESARROLLO quedó además un valor `NOTA_PUBLICADA` de una versión anterior de
// este script. No se usa y no molesta (Postgres no deja quitar valores de un enum sin recrearlo);
// en producción no se crea porque aquí ya no está.
const NUEVOS = ["ENTREGA_RECIBIDA"];

async function main() {
  const client = await pool.connect();
  try {
    for (const valor of NUEVOS) {
      await client.query(`ALTER TYPE "TipoNotificacion" ADD VALUE IF NOT EXISTS '${valor}'`);
      console.log(`  ✓ ${valor}`);
    }
    const { rows } = await client.query(
      `SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'TipoNotificacion' ORDER BY e.enumsortorder`);
    console.log(`\n  TipoNotificacion tiene ahora ${rows.length} valores.`);
    console.log("  Acuérdate de `npx prisma generate` y de aplicarlo también en el otro entorno.");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
