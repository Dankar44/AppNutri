import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #39 — Cuántas veces se ha enviado una invitación y cuándo fue la última.
// Guillermo, 30 ago 2026: quiere reenviarla con un botón y ver que ya se envió, "por si la
// estamos enviando mal" — si a alguien se le ha mandado cuatro veces y sigue sin entrar, el
// problema no es que se le haya olvidado.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(
      `ALTER TABLE invitaciones_docentes ADD COLUMN IF NOT EXISTS envios INTEGER NOT NULL DEFAULT 1`,
    );
    await client.query(
      `ALTER TABLE invitaciones_docentes ADD COLUMN IF NOT EXISTS "ultimoEnvioAt" TIMESTAMP(3)`,
    );
    // Las que ya existían: su último envío fue cuando se crearon.
    await client.query(
      `UPDATE invitaciones_docentes SET "ultimoEnvioAt" = "createdAt" WHERE "ultimoEnvioAt" IS NULL`,
    );
    const { rows } = await client.query(
      `SELECT count(*)::int AS total, coalesce(max(envios), 0)::int AS max_envios FROM invitaciones_docentes`,
    );
    console.log("✓ invitaciones_docentes: columnas envios y ultimoEnvioAt añadidas");
    console.log(`  invitaciones: ${rows[0].total} · máximo de envíos: ${rows[0].max_envios}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
