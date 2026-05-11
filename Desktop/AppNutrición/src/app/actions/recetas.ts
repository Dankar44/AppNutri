"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UnidadMedida } from "@/generated/prisma/client";
import { convertirAGramos } from "@/lib/macros";
import {
  sanitizeString,
  sanitizeStringOptional,
  validateNumber,
  validateNumberOptional,
  sanitizeSearch,
  LIMITS,
} from "@/lib/validation";

export interface RecetaFormData {
  nombre: string;
  descripcion?: string;
  instrucciones?: string;
  porciones: number;
  tiempoPreparacion?: number | null;
}

export interface IngredienteData {
  alimentoId: string;
  cantidad: number;
  unidad: UnidadMedida;
}

const MICRO_COLUMNS = [
  "vitaminaA", "vitaminaB6", "vitaminaB12", "vitaminaC", "vitaminaD",
  "vitaminaE", "vitaminaK", "tiamina", "riboflavina", "niacina",
  "folato", "acidoPantotenico", "colina", "calcio", "hierro",
  "magnesio", "fosforo", "potasio", "sodio", "cinc",
  "cobre", "manganeso", "selenio", "fluor",
] as const;
const MICRO_SET = new Set<string>(MICRO_COLUMNS);

async function recalcularMacrosReceta(recetaId: string) {
  try {
    // 1. Receta + porciones (raw para evitar dependencia del client)
    const recetaRows = await prisma.$queryRawUnsafe<Array<{ porciones: number }>>(
      `SELECT porciones FROM recetas WHERE id = $1`,
      recetaId,
    );
    if (recetaRows.length === 0) return;
    const porciones = Number(recetaRows[0].porciones) || 1;

    // 2. Ingredientes (con unidad)
    const ingredientes = await prisma.$queryRawUnsafe<
      Array<{ alimentoId: string; cantidad: number; unidad: string }>
    >(
      `SELECT "alimentoId", cantidad, unidad FROM receta_ingredientes WHERE "recetaId" = $1`,
      recetaId,
    );

    if (ingredientes.length === 0) {
      // Sin ingredientes: ceros macros + nulls micros
      await prisma.$executeRawUnsafe(
        `UPDATE recetas SET calorias = 0, proteinas = 0, carbohidratos = 0, grasas = 0, fibra = 0 WHERE id = $1`,
        recetaId,
      );
      const setZeros = MICRO_COLUMNS.map((c) => `"${c}" = NULL`).join(", ");
      await prisma.$executeRawUnsafe(`UPDATE recetas SET ${setZeros} WHERE id = $1`, recetaId);
      return;
    }

    const alimentoIds = [...new Set(ingredientes.map((i) => i.alimentoId))];

    // 3. Macros + micros de los alimentos (con porcion)
    const allCols = ["calorias", "proteinas", "carbohidratos", "grasas", "fibra", ...MICRO_COLUMNS];
    const colsSelect = allCols.map((c) => `"${c}"`).join(", ");
    const placeholders = alimentoIds.map((_, i) => `$${i + 1}`).join(", ");
    const rows = await prisma.$queryRawUnsafe<
      Array<Record<string, unknown>>
    >(
      `SELECT id, porcion, ${colsSelect} FROM alimentos WHERE id IN (${placeholders})`,
      ...alimentoIds,
    );

    const alimentosMap = new Map(rows.map((r) => [r.id as string, r]));

    // 4. Sumar macros y micros (iterando ingredientes, no alimentos)
    const totalesMacros: Record<string, number> = {
      calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0,
    };
    const totalesMicros: Record<string, number | null> = {};
    for (const col of MICRO_COLUMNS) totalesMicros[col] = null;

    for (const ing of ingredientes) {
      const row = alimentosMap.get(ing.alimentoId);
      if (!row) continue;
      const porcion = Number(row.porcion) || 100;
      const gramos = convertirAGramos(Number(ing.cantidad), ing.unidad || "GRAMOS", porcion);
      const factor = gramos / 100;
      for (const col of Object.keys(totalesMacros)) {
        const v = Number(row[col]);
        if (isFinite(v)) totalesMacros[col] += v * factor;
      }
      for (const col of MICRO_COLUMNS) {
        const valRaw = row[col];
        if (valRaw === null || valRaw === undefined) continue;
        const val = Number(valRaw);
        if (!isFinite(val)) continue;
        totalesMicros[col] = (totalesMicros[col] ?? 0) + val * factor;
      }
    }

    // 5. UPDATE macros + micros en una sola query
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let pIdx = 1;
    for (const col of Object.keys(totalesMacros)) {
      setClauses.push(`"${col}" = $${pIdx++}`);
      values.push(Math.round((totalesMacros[col] / porciones) * 10) / 10);
    }
    for (const col of MICRO_COLUMNS) {
      const total = totalesMicros[col];
      if (total === null) {
        setClauses.push(`"${col}" = NULL`);
      } else {
        setClauses.push(`"${col}" = $${pIdx++}`);
        values.push(Math.round((total / porciones) * 100) / 100);
      }
    }
    values.push(recetaId);
    await prisma.$executeRawUnsafe(
      `UPDATE recetas SET ${setClauses.join(", ")} WHERE id = $${pIdx}`,
      ...values,
    );
  } catch (err) {
    console.error("[recalcularMacrosReceta] error:", err);
    throw err;
  }
}

async function setTiempoPreparacion(recetaId: string, tiempo: number | null) {
  if (tiempo === null) {
    await prisma.$executeRawUnsafe(
      `UPDATE recetas SET "tiempoPreparacion" = NULL WHERE id = $1`,
      recetaId,
    );
  } else {
    await prisma.$executeRawUnsafe(
      `UPDATE recetas SET "tiempoPreparacion" = $1 WHERE id = $2`,
      tiempo,
      recetaId,
    );
  }
}

export async function crearReceta(
  data: RecetaFormData,
  ingredientes: IngredienteData[]
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

  const nombreSanitizado = sanitizeString(data.nombre, LIMITS.NOMBRE);
  if (!nombreSanitizado) throw new Error("El nombre es obligatorio");
  const descripcionSanitizada = sanitizeStringOptional(data.descripcion, LIMITS.DESCRIPCION);
  const instruccionesSanitizadas = sanitizeStringOptional(data.instrucciones, LIMITS.INSTRUCCIONES);
  const porcionesValidadas = validateNumber(data.porciones, 1, LIMITS.PORCIONES_MAX);
  const tiempoValidado = validateNumberOptional(data.tiempoPreparacion, 0, LIMITS.TIEMPO_PREP_MAX);
  const tiempoEntero = tiempoValidado === null ? null : Math.round(tiempoValidado);
  const ingredientesValidados = ingredientes.slice(0, LIMITS.INGREDIENTES_MAX).map((ing) => ({
    alimentoId: ing.alimentoId,
    cantidad: validateNumber(ing.cantidad, 0.1, LIMITS.CANTIDAD_MAX),
    unidad: ing.unidad,
  }));

  const receta = await prisma.receta.create({
    data: {
      dietista: { connect: { id: dietista.id } },
      nombre: nombreSanitizado,
      descripcion: descripcionSanitizada,
      instrucciones: instruccionesSanitizadas,
      porciones: porcionesValidadas,
      ingredientes: {
        create: ingredientesValidados,
      },
    },
  });

  await setTiempoPreparacion(receta.id, tiempoEntero);
  await recalcularMacrosReceta(receta.id);
  revalidatePath("/recetas");
  redirect(`/recetas/${receta.id}`);
}

export async function actualizarReceta(
  id: string,
  data: RecetaFormData,
  ingredientes: IngredienteData[]
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

  const nombreSanitizado = sanitizeString(data.nombre, LIMITS.NOMBRE);
  if (!nombreSanitizado) throw new Error("El nombre es obligatorio");
  const descripcionSanitizada = sanitizeStringOptional(data.descripcion, LIMITS.DESCRIPCION);
  const instruccionesSanitizadas = sanitizeStringOptional(data.instrucciones, LIMITS.INSTRUCCIONES);
  const porcionesValidadas = validateNumber(data.porciones, 1, LIMITS.PORCIONES_MAX);
  const tiempoValidado = validateNumberOptional(data.tiempoPreparacion, 0, LIMITS.TIEMPO_PREP_MAX);
  const tiempoEntero = tiempoValidado === null ? null : Math.round(tiempoValidado);
  const ingredientesValidados = ingredientes.slice(0, LIMITS.INGREDIENTES_MAX).map((ing) => ({
    alimentoId: ing.alimentoId,
    cantidad: validateNumber(ing.cantidad, 0.1, LIMITS.CANTIDAD_MAX),
    unidad: ing.unidad,
  }));

  await prisma.recetaIngrediente.deleteMany({ where: { recetaId: id } });

  await prisma.receta.update({
    where: { id, dietistaId: dietista.id },
    data: {
      nombre: nombreSanitizado,
      descripcion: descripcionSanitizada,
      instrucciones: instruccionesSanitizadas,
      porciones: porcionesValidadas,
      ingredientes: {
        create: ingredientesValidados,
      },
    },
  });

  await setTiempoPreparacion(id, tiempoEntero);
  await recalcularMacrosReceta(id);
  revalidatePath("/recetas");
  revalidatePath(`/recetas/${id}`);
  redirect(`/recetas/${id}`);
}

export async function eliminarReceta(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

  await prisma.recetaIngrediente.deleteMany({ where: { recetaId: id } });
  await prisma.receta.delete({ where: { id, dietistaId: dietista.id } });

  revalidatePath("/recetas");
}

export interface RecetaFilters {
  busqueda?: string;
  ingMin?: number;
  ingMax?: number;
  tiempoMin?: number;
  tiempoMax?: number;
  calMin?: number;
  calMax?: number;
  protMin?: number;
  protMax?: number;
  carbMin?: number;
  carbMax?: number;
  grasaMin?: number;
  grasaMax?: number;
  microMin?: Record<string, number>;
}

export interface RecetaListItem {
  id: string;
  nombre: string;
  descripcion: string | null;
  porciones: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  tiempoPreparacion: number | null;
  numIngredientes: number;
  createdAt: Date;
  esGlobal: boolean;
  favorito: boolean;
}

type Scope = "mias" | "app";

function buildFiltersSql(
  filters: RecetaFilters,
  startIndex: number,
): { whereExtra: string[]; havingExtra: string[]; values: unknown[]; nextIndex: number } {
  const whereExtra: string[] = [];
  const havingExtra: string[] = [];
  const values: unknown[] = [];
  let i = startIndex;

  const busquedaSanitizada = filters.busqueda ? sanitizeSearch(filters.busqueda) : undefined;
  if (busquedaSanitizada) {
    whereExtra.push(`r."nombre" ILIKE $${i++}`);
    values.push(`%${busquedaSanitizada}%`);
  }
  if (filters.calMin !== undefined) { whereExtra.push(`r."calorias" >= $${i++}`); values.push(filters.calMin); }
  if (filters.calMax !== undefined) { whereExtra.push(`r."calorias" <= $${i++}`); values.push(filters.calMax); }
  if (filters.protMin !== undefined) { whereExtra.push(`r."proteinas" >= $${i++}`); values.push(filters.protMin); }
  if (filters.protMax !== undefined) { whereExtra.push(`r."proteinas" <= $${i++}`); values.push(filters.protMax); }
  if (filters.carbMin !== undefined) { whereExtra.push(`r."carbohidratos" >= $${i++}`); values.push(filters.carbMin); }
  if (filters.carbMax !== undefined) { whereExtra.push(`r."carbohidratos" <= $${i++}`); values.push(filters.carbMax); }
  if (filters.grasaMin !== undefined) { whereExtra.push(`r."grasas" >= $${i++}`); values.push(filters.grasaMin); }
  if (filters.grasaMax !== undefined) { whereExtra.push(`r."grasas" <= $${i++}`); values.push(filters.grasaMax); }
  if (filters.tiempoMin !== undefined) { whereExtra.push(`r."tiempoPreparacion" >= $${i++}`); values.push(filters.tiempoMin); }
  if (filters.tiempoMax !== undefined) { whereExtra.push(`r."tiempoPreparacion" <= $${i++}`); values.push(filters.tiempoMax); }

  if (filters.microMin) {
    for (const [col, val] of Object.entries(filters.microMin)) {
      if (!MICRO_SET.has(col)) continue;
      if (typeof val !== "number" || val <= 0) continue;
      whereExtra.push(`r."${col}" >= $${i++}`);
      values.push(val);
    }
  }

  if (filters.ingMin !== undefined) { havingExtra.push(`COUNT(ri.id) >= $${i++}`); values.push(filters.ingMin); }
  if (filters.ingMax !== undefined) { havingExtra.push(`COUNT(ri.id) <= $${i++}`); values.push(filters.ingMax); }

  return { whereExtra, havingExtra, values, nextIndex: i };
}

export async function getRecetas(
  busquedaOrFilters?: string | (RecetaFilters & { scope?: Scope }),
): Promise<RecetaListItem[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const args =
    typeof busquedaOrFilters === "string"
      ? { busqueda: busquedaOrFilters }
      : busquedaOrFilters ?? {};
  const scope: Scope = args.scope === "app" ? "app" : "mias";

  const baseWhere =
    scope === "app"
      ? `r."dietistaId" IS NULL`
      : `(r."dietistaId" = $1 OR (r."dietistaId" IS NULL AND fav.id IS NOT NULL))`;

  const { whereExtra, havingExtra, values, nextIndex } = buildFiltersSql(args, 2);
  void nextIndex;

  const allValues: unknown[] = [dietista.id, ...values];
  const whereSql = [baseWhere, ...whereExtra].join(" AND ");

  const sql = `
    SELECT r.id, r.nombre, r.descripcion, r.porciones,
           r.calorias, r.proteinas, r.carbohidratos, r.grasas, r.fibra,
           r."tiempoPreparacion" AS "tiempoPreparacion",
           r."dietistaId" AS "dietistaId",
           r."createdAt" AS "createdAt",
           COUNT(ri.id)::int AS "numIngredientes",
           (fav.id IS NOT NULL) AS "favorito"
    FROM recetas r
    LEFT JOIN receta_ingredientes ri ON ri."recetaId" = r.id
    LEFT JOIN receta_favoritos fav
      ON fav."recetaId" = r.id AND fav."dietistaId" = $1
    WHERE ${whereSql}
    GROUP BY r.id, fav.id
    ${havingExtra.length ? `HAVING ${havingExtra.join(" AND ")}` : ""}
    ORDER BY r."createdAt" DESC
  `;

  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(sql, ...allValues);
  return rows.map((r) => ({
    id: r.id as string,
    nombre: r.nombre as string,
    descripcion: (r.descripcion as string) ?? null,
    porciones: Number(r.porciones),
    calorias: Number(r.calorias),
    proteinas: Number(r.proteinas),
    carbohidratos: Number(r.carbohidratos),
    grasas: Number(r.grasas),
    fibra: Number(r.fibra),
    tiempoPreparacion: r.tiempoPreparacion === null ? null : Number(r.tiempoPreparacion),
    numIngredientes: Number(r.numIngredientes ?? 0),
    createdAt: r.createdAt as Date,
    esGlobal: r.dietistaId === null || r.dietistaId === undefined,
    favorito: Boolean(r.favorito),
  }));
}

export async function getReceta(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  // Comprobar propiedad por raw SQL (dietistaId puede ser null → receta global)
  const ownerRows = await prisma.$queryRawUnsafe<Array<{ dietistaId: string | null }>>(
    `SELECT "dietistaId" FROM recetas WHERE id = $1 LIMIT 1`,
    id,
  );
  if (ownerRows.length === 0) return null;
  const owner = ownerRows[0].dietistaId;
  if (owner !== null && owner !== dietista.id) return null;

  const receta = await prisma.receta.findUnique({
    where: { id },
    include: {
      ingredientes: {
        include: { alimento: true },
      },
    },
  });
  if (!receta) return null;

  const extraCols = ["tiempoPreparacion", ...MICRO_COLUMNS].map((c) => `"${c}"`).join(", ");
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT ${extraCols} FROM recetas WHERE id = $1`,
    id,
  );
  const extra = rows[0] ?? {};

  const micros: Record<string, number | null> = {};
  for (const col of MICRO_COLUMNS) {
    const v = extra[col];
    micros[col] = v === null || v === undefined ? null : Number(v);
  }

  const favRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM receta_favoritos WHERE "dietistaId" = $1 AND "recetaId" = $2 LIMIT 1`,
    dietista.id,
    id,
  );

  return {
    ...receta,
    tiempoPreparacion:
      extra.tiempoPreparacion === null || extra.tiempoPreparacion === undefined
        ? null
        : Number(extra.tiempoPreparacion),
    micros,
    favorito: favRows.length > 0,
    esGlobal: receta.dietistaId === null,
  };
}

export async function toggleFavoritoReceta(recetaId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

  const receta = await prisma.receta.findUnique({
    where: { id: recetaId },
    select: { id: true, dietistaId: true },
  });
  if (!receta) throw new Error("Receta no encontrada");
  if (receta.dietistaId !== null) {
    throw new Error("Solo puedes marcar como favoritas las recetas de la app");
  }

  const existentes = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM receta_favoritos WHERE "dietistaId" = $1 AND "recetaId" = $2 LIMIT 1`,
    dietista.id,
    recetaId,
  );

  let favorito: boolean;
  if (existentes.length > 0) {
    await prisma.$executeRawUnsafe(
      `DELETE FROM receta_favoritos WHERE "dietistaId" = $1 AND "recetaId" = $2`,
      dietista.id,
      recetaId,
    );
    favorito = false;
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO receta_favoritos ("dietistaId", "recetaId") VALUES ($1, $2)
       ON CONFLICT ("dietistaId", "recetaId") DO NOTHING`,
      dietista.id,
      recetaId,
    );
    favorito = true;
  }

  revalidatePath("/recetas");
  revalidatePath(`/recetas/${recetaId}`);
  return { favorito };
}

export async function buscarAlimentosYRecetas(
  query: string,
  filtro: "todos" | "mis-alimentos" | "mis-recetas" = "todos",
) {
  const dietista = await getCurrentDietista();
  if (!dietista) return { alimentos: [], recetas: [] };

  const querySanitizada = sanitizeSearch(query);

  if (!querySanitizada && filtro === "todos") return { alimentos: [], recetas: [] };

  let alimentos: Array<{
    id: string; nombre: string; calorias: number; proteinas: number;
    carbohidratos: number; grasas: number; porcion: number; unidad: string;
    esPropio: boolean;
  }> = [];

  if (filtro !== "mis-recetas") {
    const nombreFilter = querySanitizada
      ? { nombre: { contains: querySanitizada, mode: "insensitive" as const } }
      : {};
    const ownerFilter = filtro === "mis-alimentos"
      ? { dietistaId: dietista.id }
      : { OR: [{ dietistaId: dietista.id }, { dietistaId: null }] };

    const raw = await prisma.alimento.findMany({
      where: { ...ownerFilter, ...nombreFilter },
      take: filtro === "mis-alimentos" ? 30 : 10,
      orderBy: { nombre: "asc" },
      select: {
        id: true, nombre: true, calorias: true, proteinas: true,
        carbohidratos: true, grasas: true, porcion: true, unidad: true,
        dietistaId: true,
      },
    });

    alimentos = raw.map(({ dietistaId, ...rest }) => ({
      ...rest,
      esPropio: dietistaId === dietista.id,
    }));
  }

  let recetas: Array<{
    id: string; nombre: string; porciones: number;
    calorias: number; proteinas: number; carbohidratos: number; grasas: number;
    ingredientes: { alimento: { nombre: string }; cantidad: number; unidad: string }[];
    esPropio: boolean;
  }> = [];

  if (filtro !== "mis-alimentos") {
    let rawRecetas: Array<Record<string, unknown>>;

    if (filtro === "mis-recetas") {
      rawRecetas = querySanitizada
        ? await prisma.$queryRawUnsafe(
            `SELECT r.id, r.nombre, r.porciones, r.calorias, r.proteinas, r.carbohidratos, r.grasas, r."dietistaId"
             FROM recetas r WHERE r."dietistaId" = $1 AND r."nombre" ILIKE $2
             ORDER BY r."nombre" ASC LIMIT 30`,
            dietista.id, `%${querySanitizada}%`,
          )
        : await prisma.$queryRawUnsafe(
            `SELECT r.id, r.nombre, r.porciones, r.calorias, r.proteinas, r.carbohidratos, r.grasas, r."dietistaId"
             FROM recetas r WHERE r."dietistaId" = $1
             ORDER BY r."nombre" ASC LIMIT 30`,
            dietista.id,
          );
    } else {
      rawRecetas = querySanitizada
        ? await prisma.$queryRawUnsafe(
            `SELECT r.id, r.nombre, r.porciones, r.calorias, r.proteinas, r.carbohidratos, r.grasas, r."dietistaId"
             FROM recetas r
             LEFT JOIN receta_favoritos fav ON fav."recetaId" = r.id AND fav."dietistaId" = $1
             WHERE (r."dietistaId" = $1 OR (r."dietistaId" IS NULL AND fav.id IS NOT NULL))
               AND r."nombre" ILIKE $2
             ORDER BY r."nombre" ASC LIMIT 5`,
            dietista.id, `%${querySanitizada}%`,
          )
        : [];
    }

    recetas = await Promise.all(
      rawRecetas.map(async (r) => {
        const ingredientes = await prisma.recetaIngrediente.findMany({
          where: { recetaId: r.id as string },
          select: { cantidad: true, unidad: true, alimento: { select: { nombre: true } } },
        });
        return {
          id: r.id as string,
          nombre: r.nombre as string,
          porciones: Number(r.porciones),
          calorias: Number(r.calorias),
          proteinas: Number(r.proteinas),
          carbohidratos: Number(r.carbohidratos),
          grasas: Number(r.grasas),
          ingredientes,
          esPropio: (r.dietistaId as string | null) === dietista.id,
        };
      }),
    );
  }

  return { alimentos, recetas };
}

export async function buscarAlimentosParaReceta(query: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const querySanitizada = sanitizeSearch(query);
  if (!querySanitizada) return [];

  return prisma.alimento.findMany({
    where: {
      OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
      nombre: { contains: querySanitizada, mode: "insensitive" },
    },
    take: 15,
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      calorias: true,
      proteinas: true,
      carbohidratos: true,
      grasas: true,
      porcion: true,
      unidad: true,
    },
  });
}
