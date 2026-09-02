import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #40 — La entrega es una foto fija, con su PDF (Guillermo, 2 sep 2026).
//
// "Lo que se envíe se envíe: por mucho que modifique el alumno después, si no le da a enviar otra
// vez no se refleja en el caso" y "lo importante es el entregable final". Al entregar se guarda:
//
// - `entregaSnapshot`: el trabajo tal y como estaba en ese momento (paciente, planificaciones y
//   planes ya en la forma en que se pintan), que es lo que ve el profesor al corregir.
// - `entregablePdf` + `entregablePlanId` + `entregableNombre` + `entregableBytes`: el PDF del
//   entregable, el mismo que el alumno le daría al paciente, para que el profesor lo descargue.
//
// El PDF va en la propia fila (bytea): son unos cientos de KB por entrega. Si algún día pesa
// (clases de 300 con muchos casos), se saca a Storage; hoy sería complicar por adelantado.
// Repetible.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE entregas_caso ADD COLUMN IF NOT EXISTS "entregaSnapshot" JSONB`);
    await client.query(`ALTER TABLE entregas_caso ADD COLUMN IF NOT EXISTS "entregablePlanId" TEXT`);
    await client.query(`ALTER TABLE entregas_caso ADD COLUMN IF NOT EXISTS "entregableNombre" TEXT`);
    await client.query(`ALTER TABLE entregas_caso ADD COLUMN IF NOT EXISTS "entregableBytes" INTEGER`);
    await client.query(`ALTER TABLE entregas_caso ADD COLUMN IF NOT EXISTS "entregablePdf" BYTEA`);
    console.log("✓ entregas_caso: entregaSnapshot, entregablePlanId, entregableNombre, entregableBytes, entregablePdf");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
