// Consulta de investigación (#21): estado de unidad/porcion en alimentos y usos con unidad casera.
// Solo lectura. Ejecutar: npx tsx scripts/consulta-alimentos-unidades.ts
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const totales = await pool.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE "dietistaId" IS NULL)::int AS globales,
      COUNT(*) FILTER (WHERE "dietistaId" IS NOT NULL)::int AS personalizados
    FROM alimentos
  `);
  console.log("TOTALES:", JSON.stringify(totales.rows[0]));

  const porUnidad = await pool.query(`
    SELECT unidad, COUNT(*)::int AS n
    FROM alimentos WHERE "dietistaId" IS NULL
    GROUP BY unidad ORDER BY n DESC
  `);
  console.log("GLOBALES POR UNIDAD:", JSON.stringify(porUnidad.rows));

  const globales = await pool.query(`
    SELECT nombre, categoria, porcion, unidad
    FROM alimentos WHERE "dietistaId" IS NULL
    ORDER BY categoria, nombre
  `);
  console.log("\n--- ALIMENTOS GLOBALES ---");
  for (const a of globales.rows) {
    console.log(`${a.categoria}\t${a.nombre}\tporcion=${a.porcion}\tunidad=${a.unidad}`);
  }

  // Riesgo: ítems ya pautados con unidad casera (cantidad×porcion) sobre alimentos globales.
  // Si cambiamos su porcion, esos ítems cambiarían de gramos calculados.
  const enComida = await pool.query(`
    SELECT a.nombre, aec.unidad, COUNT(*)::int AS n
    FROM alimentos_en_comida aec JOIN alimentos a ON a.id = aec."alimentoId"
    WHERE a."dietistaId" IS NULL AND aec.unidad NOT IN ('GRAMOS','MILILITROS')
    GROUP BY a.nombre, aec.unidad ORDER BY n DESC LIMIT 30
  `);
  console.log("\nEN_COMIDA unidad casera sobre globales:", JSON.stringify(enComida.rows));

  const enReceta = await pool.query(`
    SELECT a.nombre, ri.unidad, COUNT(*)::int AS n
    FROM receta_ingredientes ri JOIN alimentos a ON a.id = ri."alimentoId"
    WHERE a."dietistaId" IS NULL AND ri.unidad NOT IN ('GRAMOS','MILILITROS')
    GROUP BY a.nombre, ri.unidad ORDER BY n DESC LIMIT 30
  `);
  console.log("EN_RECETA unidad casera sobre globales:", JSON.stringify(enReceta.rows));

  const enAlternativa = await pool.query(`
    SELECT a.nombre, alt.unidad, COUNT(*)::int AS n
    FROM alternativas_alimento alt JOIN alimentos a ON a.id = alt."alimentoId"
    WHERE a."dietistaId" IS NULL AND alt.unidad NOT IN ('GRAMOS','MILILITROS')
    GROUP BY a.nombre, alt.unidad ORDER BY n DESC LIMIT 30
  `);
  console.log("EN_ALTERNATIVA unidad casera sobre globales:", JSON.stringify(enAlternativa.rows));

  // Cuántos ítems pautados en GRAMOS/MILILITROS referencian globales (no afectados, solo informativo)
  const enGramos = await pool.query(`
    SELECT COUNT(*)::int AS n
    FROM alimentos_en_comida aec JOIN alimentos a ON a.id = aec."alimentoId"
    WHERE a."dietistaId" IS NULL AND aec.unidad IN ('GRAMOS','MILILITROS')
  `);
  console.log("EN_COMIDA en g/ml sobre globales (no afectados):", JSON.stringify(enGramos.rows[0]));

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
