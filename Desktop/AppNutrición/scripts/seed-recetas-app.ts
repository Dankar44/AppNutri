import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { RECETAS_SEED, type RecetaSeed } from "./data/recetas-seed";
import { RECETAS_TANDA } from "./data/recetas-tanda";
import { normalizarParaBusqueda } from "../src/lib/alimento-utils";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const MICRO_COLUMNS = [
  "vitaminaA", "vitaminaB6", "vitaminaB12", "vitaminaC", "vitaminaD",
  "vitaminaE", "vitaminaK", "tiamina", "riboflavina", "niacina",
  "folato", "acidoPantotenico", "colina", "calcio", "hierro",
  "magnesio", "fosforo", "potasio", "sodio", "cinc",
  "cobre", "manganeso", "selenio", "fluor",
] as const;

function cuid() {
  // cuid-compatible: "c" + timestamp + random
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return ("c" + ts + rand).slice(0, 25);
}

interface AlimentoRow {
  id: string;
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  micros: Record<string, number | null>;
}

async function buscarAlimento(
  client: pg.PoolClient,
  nombre: string,
): Promise<AlimentoRow | null> {
  const nombreNorm = nombre.trim().toLowerCase();
  const colsSelect = MICRO_COLUMNS.map((c) => `"${c}"`).join(", ");

  // 1) exact match insensitive
  const q1 = await client.query(
    `SELECT id, nombre, calorias, proteinas, carbohidratos, grasas, fibra, ${colsSelect}
     FROM alimentos WHERE LOWER(nombre) = $1 LIMIT 1`,
    [nombreNorm],
  );
  if (q1.rows.length > 0) return rowToAlimento(q1.rows[0]);

  // 2) starts with
  const q2 = await client.query(
    `SELECT id, nombre, calorias, proteinas, carbohidratos, grasas, fibra, ${colsSelect}
     FROM alimentos WHERE LOWER(nombre) LIKE $1 ORDER BY LENGTH(nombre) ASC LIMIT 1`,
    [nombreNorm + "%"],
  );
  if (q2.rows.length > 0) return rowToAlimento(q2.rows[0]);

  // 3) contains
  const q3 = await client.query(
    `SELECT id, nombre, calorias, proteinas, carbohidratos, grasas, fibra, ${colsSelect}
     FROM alimentos WHERE LOWER(nombre) LIKE $1 ORDER BY LENGTH(nombre) ASC LIMIT 1`,
    ["%" + nombreNorm + "%"],
  );
  if (q3.rows.length > 0) return rowToAlimento(q3.rows[0]);

  // 4) sin acentos / primera palabra
  const primera = nombreNorm.split(/\s+/)[0];
  if (primera.length >= 4) {
    const q4 = await client.query(
      `SELECT id, nombre, calorias, proteinas, carbohidratos, grasas, fibra, ${colsSelect}
       FROM alimentos WHERE LOWER(nombre) LIKE $1 ORDER BY LENGTH(nombre) ASC LIMIT 1`,
      ["%" + primera + "%"],
    );
    if (q4.rows.length > 0) return rowToAlimento(q4.rows[0]);
  }

  return null;
}

function rowToAlimento(r: Record<string, unknown>): AlimentoRow {
  const micros: Record<string, number | null> = {};
  for (const c of MICRO_COLUMNS) {
    const v = r[c];
    micros[c] = v === null || v === undefined ? null : Number(v);
  }
  return {
    id: r.id as string,
    nombre: r.nombre as string,
    calorias: Number(r.calorias),
    proteinas: Number(r.proteinas),
    carbohidratos: Number(r.carbohidratos),
    grasas: Number(r.grasas),
    fibra: Number(r.fibra),
    micros,
  };
}

async function insertarReceta(client: pg.PoolClient, seed: RecetaSeed) {
  // Verificar si ya existe global con ese nombre (idempotencia)
  const exists = await client.query(
    `SELECT id FROM recetas WHERE "dietistaId" IS NULL AND LOWER(nombre) = LOWER($1) LIMIT 1`,
    [seed.nombre],
  );
  if (exists.rows.length > 0) {
    return { skipped: true, reason: "ya existe" };
  }

  // Resolver ingredientes
  const resueltos: Array<{ alimento: AlimentoRow; cantidad: number; unidad: string }> = [];
  const faltantes: string[] = [];
  for (const ing of seed.ingredientes) {
    const al = await buscarAlimento(client, ing.nombre);
    if (!al) {
      faltantes.push(ing.nombre);
      continue;
    }
    resueltos.push({
      alimento: al,
      cantidad: ing.cantidad,
      unidad: ing.unidad || "GRAMOS",
    });
  }

  if (resueltos.length === 0) {
    return { skipped: true, reason: `sin ingredientes válidos (faltan: ${faltantes.join(", ")})` };
  }

  // Los ingredientes del seed están escritos para `seed.porciones`. Convención de la app:
  // 1 porción = 1 persona, así que se guardan ya divididos y la receta queda a 1 porción.
  // Las tandas (bizcochos, salsas de tarro, caldos) se quedan como están: no se pueden
  // cocinar para una sola persona. Ver scripts/data/recetas-tanda.ts.
  const porciones = seed.porciones;
  const esTanda = RECETAS_TANDA.has(seed.nombre);
  const porcionesFinal = esTanda ? porciones : 1;
  const factorIngredientes = esTanda ? 1 : 1 / porciones;

  // Calcular macros / micros agregados por porción
  let cal = 0, prot = 0, carb = 0, gras = 0, fib = 0;
  const microTotales: Record<string, number | null> = {};
  for (const c of MICRO_COLUMNS) microTotales[c] = null;

  for (const { alimento, cantidad } of resueltos) {
    const f = cantidad / 100;
    cal += alimento.calorias * f;
    prot += alimento.proteinas * f;
    carb += alimento.carbohidratos * f;
    gras += alimento.grasas * f;
    fib += alimento.fibra * f;
    for (const c of MICRO_COLUMNS) {
      const v = alimento.micros[c];
      if (v === null || v === undefined) continue;
      microTotales[c] = (microTotales[c] ?? 0) + v * f;
    }
  }

  const recetaId = cuid();
  const now = new Date();

  const microCols = MICRO_COLUMNS.map((c) => `"${c}"`).join(", ");
  const microPlaceholders = MICRO_COLUMNS.map((_, i) => `$${i + 12}`).join(", ");
  const microValues = MICRO_COLUMNS.map((c) => {
    const total = microTotales[c];
    return total === null ? null : Math.round((total / porciones) * 100) / 100;
  });

  await client.query(
    `INSERT INTO recetas (
      id, nombre, descripcion, instrucciones, porciones, "tiempoPreparacion",
      calorias, proteinas, carbohidratos, grasas, fibra,
      ${microCols},
      "dietistaId", "createdAt", "updatedAt", "nombreNormalizado"
    ) VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11,
      ${microPlaceholders},
      NULL, $${12 + MICRO_COLUMNS.length}, $${12 + MICRO_COLUMNS.length}, $${13 + MICRO_COLUMNS.length}
    )`,
    [
      recetaId,
      seed.nombre,
      seed.descripcion ?? null,
      seed.instrucciones ?? null,
      porcionesFinal,
      seed.tiempoPreparacion ?? null,
      Math.round((cal / porciones) * 10) / 10,
      Math.round((prot / porciones) * 10) / 10,
      Math.round((carb / porciones) * 10) / 10,
      Math.round((gras / porciones) * 10) / 10,
      Math.round((fib / porciones) * 10) / 10,
      ...microValues,
      now,
      normalizarParaBusqueda(seed.nombre),
    ],
  );

  for (const r of resueltos) {
    await client.query(
      `INSERT INTO receta_ingredientes (id, "recetaId", "alimentoId", cantidad, unidad)
       VALUES ($1, $2, $3, $4, $5::"UnidadMedida")`,
      [cuid(), recetaId, r.alimento.id, Math.round(r.cantidad * factorIngredientes * 100) / 100, r.unidad],
    );
  }

  return {
    skipped: false,
    id: recetaId,
    ingredientes: resueltos.length,
    faltantes,
  };
}

async function main() {
  const client = await pool.connect();
  let creadas = 0;
  let saltadas = 0;
  let errores = 0;
  const ingredientesFaltantes = new Set<string>();
  const recetasSinIngredientes: string[] = [];

  try {
    console.log(`→ Sembrando ${RECETAS_SEED.length} recetas globales...\n`);
    for (const seed of RECETAS_SEED) {
      try {
        const res = await insertarReceta(client, seed);
        if (res.skipped) {
          saltadas++;
          if (res.reason?.startsWith("sin ingredientes")) {
            recetasSinIngredientes.push(`${seed.nombre} — ${res.reason}`);
          }
        } else {
          creadas++;
          if (res.faltantes && res.faltantes.length) {
            for (const f of res.faltantes) ingredientesFaltantes.add(f);
          }
          if (creadas % 25 === 0) console.log(`  · ${creadas} recetas...`);
        }
      } catch (err) {
        errores++;
        console.error(`  ✗ ${seed.nombre}:`, (err as Error).message);
      }
    }
    console.log(`\n✓ Creadas: ${creadas}, saltadas: ${saltadas}, errores: ${errores}`);
    if (ingredientesFaltantes.size) {
      console.log(`\n⚠ Ingredientes no encontrados (${ingredientesFaltantes.size}):`);
      for (const f of [...ingredientesFaltantes].sort()) console.log(`   - ${f}`);
    }
    if (recetasSinIngredientes.length) {
      console.log(`\n⚠ Recetas saltadas por falta de ingredientes:`);
      for (const r of recetasSinIngredientes) console.log(`   - ${r}`);
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
