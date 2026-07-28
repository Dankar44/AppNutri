/**
 * Deshace `normalizar-porciones-recetas.ts` a partir del backup que aquel dejó en
 * scripts/backups/: devuelve a cada receta sus porciones originales y a cada ingrediente
 * su cantidad original.
 *
 * Uso (BD COMPARTIDA local↔producción — solo con OK explícito):
 *   npx tsx scripts/revertir-porciones-recetas.ts                          # dry-run, coge el backup más reciente
 *   npx tsx scripts/revertir-porciones-recetas.ts --apply
 *   npx tsx scripts/revertir-porciones-recetas.ts --apply --file scripts/backups/<archivo>.json
 *
 * Es idempotente: reescribe los valores del backup, así que ejecutarlo dos veces deja lo mismo.
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import pg from "pg";
import fs from "node:fs";
import path from "node:path";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const APPLY = process.argv.includes("--apply");
const fileArg = process.argv.indexOf("--file");
const FILE = fileArg !== -1 ? process.argv[fileArg + 1] : null;

interface Backup {
  recetas: { id: string; nombre: string; porciones: number; dietistaId: string | null }[];
  ingredientes: { id: string; recetaId: string; cantidad: number; unidad: string; alimento: string }[];
}

function backupMasReciente(): string {
  const dir = path.join(process.cwd(), "scripts", "backups");
  const files = fs.readdirSync(dir)
    .filter((f) => f.startsWith("porciones-recetas-") && f.endsWith(".json"))
    .sort();
  if (files.length === 0) throw new Error("No hay backups en scripts/backups/");
  return path.join(dir, files[files.length - 1]);
}

async function main() {
  const ruta = FILE ?? backupMasReciente();
  const backup = JSON.parse(fs.readFileSync(ruta, "utf8")) as Backup;
  console.log(`Backup: ${ruta}`);
  console.log(`  ${backup.recetas.length} recetas y ${backup.ingredientes.length} ingredientes a restaurar.\n`);

  for (const r of backup.recetas.slice(0, 3)) {
    const ings = backup.ingredientes.filter((i) => i.recetaId === r.id);
    console.log(`· ${r.nombre} → vuelve a ${r.porciones} porciones`);
    for (const i of ings.slice(0, 3)) console.log(`    ${i.alimento}: ${i.cantidad} ${i.unidad}`);
  }
  if (backup.recetas.length > 3) console.log(`  … y ${backup.recetas.length - 3} recetas más`);

  if (!APPLY) {
    console.log("\nDRY-RUN: no se ha escrito nada. Añade --apply para revertir.");
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const ing of backup.ingredientes) {
      await client.query(`UPDATE receta_ingredientes SET cantidad = $2 WHERE id = $1`, [ing.id, ing.cantidad]);
    }
    for (const r of backup.recetas) {
      await client.query(`UPDATE recetas SET porciones = $2, "updatedAt" = NOW() WHERE id = $1`, [r.id, r.porciones]);
    }
    await client.query("COMMIT");
    console.log(`\nRevertido: ${backup.recetas.length} recetas a sus porciones originales.`);
    console.log("Recuerda que el código desplegado espera el catálogo normalizado: revisa");
    console.log("si también hay que revertir el deploy.");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error, se ha hecho ROLLBACK:", e);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main().then(() => pool.end()).catch((e) => { console.error(e); pool.end(); process.exit(1); });
