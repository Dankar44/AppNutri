import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// Permitir raciones no enteras en una receta (p. ej. 1,5), igual que ya se sirven
// medias porciones en el plan. Int → double precision es una ampliación segura:
// los valores enteros existentes siguen siendo válidos.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE recetas ALTER COLUMN porciones TYPE double precision`);
    console.log("✓ recetas.porciones ahora es double precision (admite 1,5)");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
