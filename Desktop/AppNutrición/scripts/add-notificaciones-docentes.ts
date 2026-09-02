import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #40 — Dos avisos del aula: "tienes un caso nuevo" y "te han corregido".
//
// El alumno los ve igual que un nutricionista ve los suyos, en la campana. Sin esto, un caso
// asignado a mitad de semana no se entera nadie hasta que entra al aula por su cuenta.
//
// OJO con los enums: añadir un valor y no regenerar el cliente de Prisma revienta con
// "Value 'X' not found in enum" en el entorno que se quede atrás. `deploy.sh` ya lo regenera.
async function main() {
  const client = await pool.connect();
  try {
    for (const valor of ["CASO_ASIGNADO", "CASO_CORREGIDO"]) {
      await client.query(
        `DO $$ BEGIN
           ALTER TYPE "TipoNotificacion" ADD VALUE IF NOT EXISTS '${valor}';
         EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
      console.log(`✓ TipoNotificacion.${valor}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
