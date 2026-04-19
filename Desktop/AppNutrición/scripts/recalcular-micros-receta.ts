import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const ARG = process.argv[2]; // "todas" o un recetaId
if (!ARG) {
  console.error("Uso: npx tsx scripts/recalcular-micros-receta.ts <recetaId|todas>");
  process.exit(1);
}

const MICRO_COLS = [
  "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
  "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
  "folato","acidoPantotenico","colina","calcio","hierro",
  "magnesio","fosforo","potasio","sodio","cinc",
  "cobre","manganeso","selenio","fluor",
];

async function recalcular(c: pg.PoolClient, recetaId: string): Promise<{
  ok: boolean;
  microsCalculados: number;
  reason?: string;
}> {
  // 1. Obtener ingredientes
  const { rows: ingredientes } = await c.query<{ alimentoId: string; cantidad: number }>(
    `SELECT "alimentoId", cantidad FROM receta_ingredientes WHERE "recetaId" = $1`,
    [recetaId],
  );
  if (ingredientes.length === 0) {
    return { ok: false, microsCalculados: 0, reason: "sin ingredientes" };
  }

  // 2. Obtener porciones
  const { rows: rRows } = await c.query<{ porciones: number }>(
    `SELECT porciones FROM recetas WHERE id = $1`,
    [recetaId],
  );
  const porciones = rRows[0]?.porciones ?? 1;

  // 3. Obtener micros de los alimentos
  const ids = ingredientes.map((i) => i.alimentoId);
  const cantidadesPorId = new Map(ingredientes.map((i) => [i.alimentoId, Number(i.cantidad)]));
  const microSelect = MICRO_COLS.map((m) => `"${m}"`).join(", ");
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(", ");
  const { rows: alimentos } = await c.query<Record<string, unknown>>(
    `SELECT id, ${microSelect} FROM alimentos WHERE id IN (${placeholders})`,
    ids,
  );

  // 4. Sumar micros
  const totales: Record<string, number | null> = {};
  for (const col of MICRO_COLS) totales[col] = null;

  for (const a of alimentos) {
    const cantidad = cantidadesPorId.get(a.id as string) ?? 0;
    const factor = cantidad / 100;
    for (const col of MICRO_COLS) {
      const valRaw = a[col];
      if (valRaw === null || valRaw === undefined) continue;
      const val = Number(valRaw);
      if (!isFinite(val)) continue;
      totales[col] = (totales[col] ?? 0) + val * factor;
    }
  }

  // 5. UPDATE receta con micros (por porción)
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  for (const col of MICRO_COLS) {
    const total = totales[col];
    if (total === null) {
      setClauses.push(`"${col}" = NULL`);
    } else {
      setClauses.push(`"${col}" = $${i++}`);
      values.push(Math.round((total / porciones) * 100) / 100);
    }
  }
  values.push(recetaId);
  await c.query(
    `UPDATE recetas SET ${setClauses.join(", ")} WHERE id = $${i}`,
    values,
  );

  const microsCalculados = Object.values(totales).filter((v) => v !== null && v > 0).length;
  return { ok: true, microsCalculados };
}

async function main() {
  const c = await pool.connect();
  try {
    let recetaIds: string[];
    if (ARG === "todas") {
      // Sólo recetas creadas por dietistas (no globales) y sin micros
      const { rows } = await c.query<{ id: string }>(
        `SELECT id FROM recetas WHERE "dietistaId" IS NOT NULL`,
      );
      recetaIds = rows.map((r) => r.id);
      console.log(`Encontradas ${recetaIds.length} recetas de dietistas para recalcular\n`);
    } else {
      recetaIds = [ARG];
    }

    let okCount = 0, failCount = 0;
    for (const id of recetaIds) {
      try {
        const res = await recalcular(c, id);
        if (res.ok) {
          okCount++;
          console.log(`✓ ${id}: ${res.microsCalculados}/${MICRO_COLS.length} micros`);
        } else {
          failCount++;
          console.log(`· ${id}: skipped (${res.reason})`);
        }
      } catch (e) {
        failCount++;
        console.error(`✗ ${id}: ${(e as Error).message}`);
      }
    }
    console.log(`\n✓ Recalculadas: ${okCount}. Fallos: ${failCount}.`);
  } finally {
    c.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
