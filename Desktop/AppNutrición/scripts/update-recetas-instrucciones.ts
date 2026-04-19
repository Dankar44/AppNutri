import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { RECETAS_INSTRUCCIONES } from "./data/recetas-instrucciones";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  let actualizadas = 0;
  let noEncontradas: string[] = [];
  try {
    for (const [nombre, instrucciones] of Object.entries(RECETAS_INSTRUCCIONES)) {
      const result = await client.query(
        `UPDATE recetas
         SET instrucciones = $1
         WHERE "dietistaId" IS NULL
           AND LOWER(nombre) = LOWER($2)`,
        [instrucciones, nombre],
      );
      if (result.rowCount && result.rowCount > 0) {
        actualizadas++;
        if (actualizadas % 50 === 0) console.log(`  · ${actualizadas} recetas actualizadas`);
      } else {
        noEncontradas.push(nombre);
      }
    }
    console.log(`\n✓ ${actualizadas} recetas actualizadas con instrucciones`);
    if (noEncontradas.length) {
      console.log(`\n⚠ Sin match (${noEncontradas.length}):`);
      for (const n of noEncontradas) console.log(`  - ${n}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
