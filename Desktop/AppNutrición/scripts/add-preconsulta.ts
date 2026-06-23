import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #6 — Formulario pre-consulta: el paciente rellena su propia anamnesis con un link antes de la consulta.
//   · preconsultaToken: token del link público (/preconsulta/[token]). UNIQUE, nullable.
//   · preconsultaEnviadaAt / preconsultaCompletadaAt: timestamps de los que se deriva el estado
//     (sin enviar / enviada / completada) y la marca "rellenado por el paciente".
//   · TipoNotificacion.PRECONSULTA_COMPLETADA: aviso al nutri cuando el paciente termina.
// Aditivo, idempotente y seguro (se puede correr varias veces; no toca ningún dato existente).
async function main() {
  const client = await pool.connect();
  try {
    // 1) Columnas nuevas (todas nullable, sin default destructivo).
    await client.query(
      `ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "preconsultaToken" TEXT`,
    );
    await client.query(
      `ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "preconsultaEnviadaAt" TIMESTAMP(3)`,
    );
    await client.query(
      `ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "preconsultaCompletadaAt" TIMESTAMP(3)`,
    );

    // 2) Índice único para el token (nombre que espera Prisma para @unique).
    //    Sobre columna nullable: Postgres permite múltiples NULL → pacientes sin link conviven.
    await client.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "pacientes_preconsultaToken_key" ON pacientes("preconsultaToken")`,
    );

    // 3) Nuevo valor del enum de notificaciones (IF NOT EXISTS → idempotente; PG 12+).
    //    Va como query suelta (autocommit): ALTER TYPE ... ADD VALUE no puede ir en transacción.
    await client.query(
      `ALTER TYPE "TipoNotificacion" ADD VALUE IF NOT EXISTS 'PRECONSULTA_COMPLETADA'`,
    );

    console.log(
      "✓ pacientes: columnas preconsultaToken (+índice único) / preconsultaEnviadaAt / preconsultaCompletadaAt añadidas\n✓ TipoNotificacion: valor PRECONSULTA_COMPLETADA añadido",
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
