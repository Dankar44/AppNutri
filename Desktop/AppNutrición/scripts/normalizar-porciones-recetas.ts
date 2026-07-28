/**
 * Normaliza el catálogo de recetas a la convención "1 porción = 1 persona".
 *
 * Qué hace, por cada receta con porciones <> 1:
 *   - divide la cantidad de cada ingrediente por sus porciones actuales
 *   - pone porciones = 1
 *   - NO toca los macros (calorias, proteinas, …): ya están guardados POR PORCIÓN,
 *     así que siguen siendo correctos y los planes existentes no cambian de valor.
 *
 * Es semánticamente un no-op para los planes ya creados: una línea que servía
 * `cantidad` porciones seguía escalando los ingredientes por `cantidad / porciones`,
 * y ahora escala por `cantidad / 1` sobre ingredientes ya divididos. Mismo resultado.
 *
 * Uso (BD COMPARTIDA local↔producción — ejecutar solo con OK explícito):
 *   npx tsx scripts/normalizar-porciones-recetas.ts              # dry-run (no escribe)
 *   npx tsx scripts/normalizar-porciones-recetas.ts --apply      # solo recetas globales
 *   npx tsx scripts/normalizar-porciones-recetas.ts --apply --todas   # + recetas propias de nutris
 *
 * Antes de escribir deja un backup JSON en scripts/backups/ para poder revertir.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import pg from "pg";
import fs from "node:fs";
import path from "node:path";
import { RECETAS_TANDA } from "./data/recetas-tanda";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const APPLY = process.argv.includes("--apply");
const TODAS = process.argv.includes("--todas");

/** Las tandas (bizcochos, salsas de tarro, caldos) no se normalizan: ver recetas-tanda.ts. */
const NO_NORMALIZAR = RECETAS_TANDA;

interface RecetaRow {
  id: string;
  nombre: string;
  porciones: number;
  dietistaId: string | null;
}

interface IngRow {
  id: string;
  recetaId: string;
  cantidad: number;
  unidad: string;
  alimento: string;
}

async function main() {
  const filtroPropias = TODAS ? "" : `AND "dietistaId" IS NULL`;

  const todas = await pool.query<RecetaRow>(
    `SELECT id, nombre, porciones, "dietistaId"
       FROM recetas
      WHERE porciones <> 1 ${filtroPropias}
      ORDER BY nombre`
  );

  const excluidas = todas.rows.filter((r) => NO_NORMALIZAR.has(r.nombre));
  const recetas = { rows: todas.rows.filter((r) => !NO_NORMALIZAR.has(r.nombre)) };

  console.log(`Se dejan como están (tandas, no raciones): ${excluidas.length}`);
  for (const r of excluidas) console.log(`    · ${r.nombre} (${r.porciones} porciones)`);
  console.log("");

  if (recetas.rows.length === 0) {
    console.log("Nada que normalizar: todas las recetas del ámbito elegido ya están a 1 porción.");
    return;
  }

  const ids = recetas.rows.map((r) => r.id);
  const ings = await pool.query<IngRow>(
    `SELECT ri.id, ri."recetaId", ri.cantidad, ri.unidad, a.nombre AS alimento
       FROM receta_ingredientes ri
       JOIN alimentos a ON a.id = ri."alimentoId"
      WHERE ri."recetaId" = ANY($1::text[])`,
    [ids]
  );

  const porReceta = new Map<string, IngRow[]>();
  for (const ing of ings.rows) {
    if (!porReceta.has(ing.recetaId)) porReceta.set(ing.recetaId, []);
    porReceta.get(ing.recetaId)!.push(ing);
  }

  console.log(
    `${recetas.rows.length} recetas a normalizar ` +
    `(${TODAS ? "globales + propias" : "solo globales"}), ` +
    `${ings.rows.length} ingredientes afectados.\n`
  );

  // Muestra de las 5 primeras para revisar el resultado a ojo
  for (const r of recetas.rows.slice(0, 5)) {
    console.log(`· ${r.nombre} (${r.porciones} porciones → 1)`);
    for (const ing of porReceta.get(r.id) ?? []) {
      const nueva = Math.round((ing.cantidad / r.porciones) * 100) / 100;
      console.log(`    ${ing.alimento}: ${ing.cantidad} → ${nueva} ${ing.unidad}`);
    }
  }
  if (recetas.rows.length > 5) console.log(`  … y ${recetas.rows.length - 5} más`);

  if (!APPLY) {
    console.log("\nDRY-RUN: no se ha escrito nada. Añade --apply para ejecutar.");
    return;
  }

  // Backup para poder revertir
  const dir = path.join(process.cwd(), "scripts", "backups");
  fs.mkdirSync(dir, { recursive: true });
  const backupPath = path.join(dir, `porciones-recetas-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify({ recetas: recetas.rows, ingredientes: ings.rows }, null, 2),
    "utf8"
  );
  console.log(`\nBackup escrito en ${backupPath}`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const r of recetas.rows) {
      await client.query(
        `UPDATE receta_ingredientes
            SET cantidad = ROUND((cantidad / $2::numeric)::numeric, 2)
          WHERE "recetaId" = $1`,
        [r.id, r.porciones]
      );
      await client.query(`UPDATE recetas SET porciones = 1, "updatedAt" = NOW() WHERE id = $1`, [r.id]);
    }
    await client.query("COMMIT");
    console.log(`\nHecho: ${recetas.rows.length} recetas normalizadas a 1 porción.`);
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error, se ha hecho ROLLBACK:", e);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main().then(() => pool.end()).catch((e) => { console.error(e); pool.end(); process.exit(1); });
