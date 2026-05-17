"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  CategoriaAlimento,
  UnidadMedida,
  OrigenAlimento,
} from "@/generated/prisma/client";
import { buscarAlimentosOFF, type AlimentoAPIResult } from "@/lib/openfoodfacts";
import { normalizarNombreAlimento, redondearMacros } from "@/lib/alimento-utils";
import { sanitizeString, validateNumber, validateEnum, validateUrl, validateImageUrl, sanitizeSearch, LIMITS } from "@/lib/validation";
import { type MicroKey, MICRO_KEYS } from "@/lib/micronutrientes";

export interface AlimentoFormData {
  nombre: string;
  categoria: CategoriaAlimento;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  porcion: number;
  unidad: UnidadMedida;
  enlaceProducto?: string | null;
  imagenUrl?: string | null;
  micronutrientes?: Partial<Record<MicroKey, number | null>>;
}

function validarMicros(raw: Partial<Record<MicroKey, number | null>> | undefined): Partial<Record<MicroKey, number | null>> {
  if (!raw) return {};
  const result: Partial<Record<MicroKey, number | null>> = {};
  for (const key of MICRO_KEYS) {
    const v = raw[key];
    if (v === null || v === undefined) {
      result[key] = null;
    } else {
      result[key] = redondearMacros(validateNumber(v, 0, LIMITS.MICRO_MAX));
    }
  }
  return result;
}

export async function crearAlimento(data: AlimentoFormData) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  // Validación server-side
  const nombreSanitizado = sanitizeString(data.nombre, LIMITS.NOMBRE);
  if (!nombreSanitizado) throw new Error(t("alimento.nombreObligatorio"));
  data.calorias = validateNumber(data.calorias, 0, LIMITS.CALORIAS_MAX);
  data.proteinas = validateNumber(data.proteinas, 0, LIMITS.MACROS_MAX);
  data.carbohidratos = validateNumber(data.carbohidratos, 0, LIMITS.MACROS_MAX);
  data.grasas = validateNumber(data.grasas, 0, LIMITS.MACROS_MAX);
  data.fibra = validateNumber(data.fibra, 0, LIMITS.MACROS_MAX);
  data.porcion = validateNumber(data.porcion, 0.1, LIMITS.PORCION_MAX);
  const categoriaValida = validateEnum(data.categoria, Object.values(CategoriaAlimento));
  if (!categoriaValida) throw new Error(t("alimento.categoriaNoValida"));
  data.categoria = categoriaValida;
  const unidadValida = validateEnum(data.unidad, Object.values(UnidadMedida));
  if (!unidadValida) throw new Error(t("alimento.unidadNoValida"));
  data.unidad = unidadValida;
  const enlaceValidado = validateUrl(data.enlaceProducto);
  if (data.enlaceProducto && data.enlaceProducto.trim() && !enlaceValidado)
    throw new Error(t("alimento.enlaceNoValido"));
  const imagenUrlValidada = validateUrl(data.imagenUrl);
  if (data.imagenUrl && data.imagenUrl.trim() && !imagenUrlValidada)
    throw new Error(t("alimento.urlImagenNoValida"));
  const micros = validarMicros(data.micronutrientes);

  const nombreNorm = normalizarNombreAlimento(nombreSanitizado);

  // Prevenir duplicados por nombre normalizado
  const existente = await prisma.alimento.findFirst({
    where: {
      OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
      nombre: { equals: nombreNorm, mode: "insensitive" },
    },
  });
  if (existente) throw new Error(t("alimento.yaExisteNombre"));

  const alimento = await prisma.alimento.create({
    data: {
      dietista: { connect: { id: dietista.id } },
      nombre: nombreNorm,
      categoria: data.categoria,
      calorias: redondearMacros(data.calorias),
      proteinas: redondearMacros(data.proteinas),
      carbohidratos: redondearMacros(data.carbohidratos),
      grasas: redondearMacros(data.grasas),
      fibra: redondearMacros(data.fibra),
      porcion: data.porcion,
      unidad: data.unidad,
      enlaceProducto: enlaceValidado,
      imagenUrl: imagenUrlValidada,
      origen: "PERSONALIZADO",
      ...micros,
    },
  });

  revalidatePath("/alimentos");
  redirect(`/alimentos/${alimento.id}`);
}

export async function actualizarAlimento(id: string, data: AlimentoFormData) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  // Validación server-side
  const nombreSanitizado = sanitizeString(data.nombre, LIMITS.NOMBRE);
  if (!nombreSanitizado) throw new Error(t("alimento.nombreObligatorio"));
  data.calorias = validateNumber(data.calorias, 0, LIMITS.CALORIAS_MAX);
  data.proteinas = validateNumber(data.proteinas, 0, LIMITS.MACROS_MAX);
  data.carbohidratos = validateNumber(data.carbohidratos, 0, LIMITS.MACROS_MAX);
  data.grasas = validateNumber(data.grasas, 0, LIMITS.MACROS_MAX);
  data.fibra = validateNumber(data.fibra, 0, LIMITS.MACROS_MAX);
  data.porcion = validateNumber(data.porcion, 0.1, LIMITS.PORCION_MAX);
  const categoriaValida = validateEnum(data.categoria, Object.values(CategoriaAlimento));
  if (!categoriaValida) throw new Error(t("alimento.categoriaNoValida"));
  data.categoria = categoriaValida;
  const unidadValida = validateEnum(data.unidad, Object.values(UnidadMedida));
  if (!unidadValida) throw new Error(t("alimento.unidadNoValida"));
  data.unidad = unidadValida;
  const enlaceValidado = validateUrl(data.enlaceProducto);
  if (data.enlaceProducto && data.enlaceProducto.trim() && !enlaceValidado)
    throw new Error(t("alimento.enlaceNoValido"));
  const imagenUrlValidada = validateUrl(data.imagenUrl);
  if (data.imagenUrl && data.imagenUrl.trim() && !imagenUrlValidada)
    throw new Error(t("alimento.urlImagenNoValida"));
  const micros = validarMicros(data.micronutrientes);

  await prisma.alimento.update({
    where: { id, dietistaId: dietista.id },
    data: {
      nombre: normalizarNombreAlimento(nombreSanitizado),
      categoria: data.categoria,
      calorias: redondearMacros(data.calorias),
      proteinas: redondearMacros(data.proteinas),
      carbohidratos: redondearMacros(data.carbohidratos),
      grasas: redondearMacros(data.grasas),
      fibra: redondearMacros(data.fibra),
      porcion: data.porcion,
      unidad: data.unidad,
      enlaceProducto: enlaceValidado,
      imagenUrl: imagenUrlValidada,
      ...micros,
    },
  });

  revalidatePath("/alimentos");
  revalidatePath(`/alimentos/${id}`);
  redirect(`/alimentos/${id}`);
}

export async function eliminarAlimento(id: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await prisma.alimento.delete({
    where: { id, dietistaId: dietista.id },
  });

  revalidatePath("/alimentos");
}

export async function getAlimentos(
  busqueda?: string,
  categoria?: CategoriaAlimento
) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const busquedaSanitizada = busqueda ? sanitizeSearch(busqueda) : undefined;

  return prisma.alimento.findMany({
    where: {
      OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
      ...(categoria ? { categoria } : {}),
      ...(busquedaSanitizada
        ? { nombre: { contains: busquedaSanitizada, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { nombre: "asc" },
  });
}

const PAGE_SIZE = 100;

interface MacroFilters {
  origen?: string;
  propios?: boolean;
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

const MICRO_COLUMNS_ALLOWED = new Set([
  "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
  "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
  "folato","acidoPantotenico","colina","calcio","hierro",
  "magnesio","fosforo","potasio","sodio","cinc",
  "cobre","manganeso","selenio","fluor",
]);

export async function getAlimentosPaginados(
  busqueda?: string,
  categoria?: CategoriaAlimento,
  cursor?: string,
  macroFilters?: MacroFilters
) {
  const dietista = await getCurrentDietista();
  if (!dietista) return { alimentos: [], total: 0, nextCursor: null as string | null };

  const busquedaSanitizada = busqueda ? sanitizeSearch(busqueda) : undefined;
  const f = macroFilters || {};

  let microIdFilter: { id: { in: string[] } } | undefined;
  const microEntries = Object.entries(f.microMin || {}).filter(
    ([k, v]) => MICRO_COLUMNS_ALLOWED.has(k) && typeof v === "number" && v > 0,
  );
  if (microEntries.length > 0) {
    const conditions = microEntries
      .map(([k], i) => `"${k}" >= $${i + 1}`)
      .join(" AND ");
    const values = microEntries.map(([, v]) => v);
    const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM alimentos WHERE ${conditions}`,
      ...values,
    );
    microIdFilter = { id: { in: rows.map((r) => r.id) } };
    if (rows.length === 0) {
      return { alimentos: [], total: 0, nextCursor: null as string | null };
    }
  }

  const ownerFilter = f.propios
    ? { dietistaId: dietista.id }
    : { OR: [{ dietistaId: dietista.id }, { dietistaId: null }] };

  const where = {
    ...ownerFilter,
    ...(categoria ? { categoria } : {}),
    ...(f.origen && (f.origen === "PERSONALIZADO" || f.origen === "API") ? { origen: f.origen as "PERSONALIZADO" | "API" } : {}),
    ...(busquedaSanitizada
      ? { nombre: { contains: busquedaSanitizada, mode: "insensitive" as const } }
      : {}),
    ...(f.calMin || f.calMax ? { calorias: { ...(f.calMin ? { gte: f.calMin } : {}), ...(f.calMax ? { lte: f.calMax } : {}) } } : {}),
    ...(f.protMin || f.protMax ? { proteinas: { ...(f.protMin ? { gte: f.protMin } : {}), ...(f.protMax ? { lte: f.protMax } : {}) } } : {}),
    ...(f.carbMin || f.carbMax ? { carbohidratos: { ...(f.carbMin ? { gte: f.carbMin } : {}), ...(f.carbMax ? { lte: f.carbMax } : {}) } } : {}),
    ...(f.grasaMin || f.grasaMax ? { grasas: { ...(f.grasaMin ? { gte: f.grasaMin } : {}), ...(f.grasaMax ? { lte: f.grasaMax } : {}) } } : {}),
    ...(microIdFilter || {}),
  };

  const [alimentos, total] = await Promise.all([
    prisma.alimento.findMany({
      where,
      orderBy: { nombre: "asc" },
      take: PAGE_SIZE + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    }),
    prisma.alimento.count({ where }),
  ]);

  const hasMore = alimentos.length > PAGE_SIZE;
  if (hasMore) alimentos.pop();

  return {
    alimentos,
    total,
    nextCursor: hasMore ? alimentos[alimentos.length - 1].id : null,
  };
}

export async function cargarMasAlimentos(
  cursor: string,
  busqueda?: string,
  categoria?: string,
  propios?: boolean,
) {
  const busquedaSanitizada = busqueda ? sanitizeSearch(busqueda) : undefined;
  return getAlimentosPaginados(
    busquedaSanitizada,
    categoria as CategoriaAlimento | undefined,
    cursor,
    propios ? { propios: true } : undefined,
  );
}

export async function contarMisAlimentos(): Promise<number> {
  const dietista = await getCurrentDietista();
  if (!dietista) return 0;
  return prisma.alimento.count({ where: { dietistaId: dietista.id } });
}

export async function getAlimento(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  return prisma.alimento.findFirst({
    where: {
      id,
      OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
    },
  });
}

export async function buscarAlimentosAPI(query: string) {
  if (!query || query.length < 2) return [];
  const { resultados } = await buscarAlimentosOFF(query, 1, 15);
  return resultados;
}

export async function importarAlimentoAPI(data: AlimentoAPIResult) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  // Validación server-side
  data.nombre = sanitizeString(data.nombre, 200) || t("auth.sinNombre");
  data.calorias = validateNumber(data.calorias, 0, LIMITS.CALORIAS_MAX);
  data.proteinas = validateNumber(data.proteinas, 0, LIMITS.MACROS_MAX);
  data.carbohidratos = validateNumber(data.carbohidratos, 0, LIMITS.MACROS_MAX);
  data.grasas = validateNumber(data.grasas, 0, LIMITS.MACROS_MAX);
  data.fibra = validateNumber(data.fibra, 0, LIMITS.MACROS_MAX);

  // Buscar por código de barras
  const existentePorCodigo = await prisma.alimento.findFirst({
    where: { codigoBarras: data.codigoBarras, dietistaId: dietista.id },
  });
  if (existentePorCodigo) return existentePorCodigo;

  const nombreNorm = normalizarNombreAlimento(data.nombre);

  // Buscar también por nombre normalizado
  const existentePorNombre = await prisma.alimento.findFirst({
    where: {
      OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
      nombre: { equals: nombreNorm, mode: "insensitive" },
    },
  });
  if (existentePorNombre) return existentePorNombre;

  const alimento = await prisma.alimento.create({
    data: {
      dietista: { connect: { id: dietista.id } },
      nombre: nombreNorm,
      categoria: "OTROS",
      calorias: redondearMacros(data.calorias),
      proteinas: redondearMacros(data.proteinas),
      carbohidratos: redondearMacros(data.carbohidratos),
      grasas: redondearMacros(data.grasas),
      fibra: redondearMacros(data.fibra),
      porcion: 100,
      unidad: "GRAMOS",
      origen: "API",
      codigoBarras: data.codigoBarras,
      imagenUrl: validateUrl(data.imagen) || null,
    },
  });

  revalidatePath("/alimentos");
  return alimento;
}

export async function buscarEquivalentes(
  alimentoIdExcluir: string,
  caloriasReferencia: number,
  busqueda?: string
) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const search = busqueda ? sanitizeSearch(busqueda) : undefined;

  // Obtener la categoría y macros del alimento de referencia
  const ref = await prisma.alimento.findUnique({
    where: { id: alimentoIdExcluir },
    select: { categoria: true, proteinas: true, carbohidratos: true, grasas: true },
  });

  const baseWhere = {
    OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
    id: { not: alimentoIdExcluir },
    calorias: { gte: 5 as number },
    ...(search ? { nombre: { contains: search, mode: "insensitive" as const } } : {}),
  };

  // Primero: misma categoría (priorizados)
  const mismaCategoria = ref
    ? await prisma.alimento.findMany({
        where: { ...baseWhere, categoria: ref.categoria },
        select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true },
        orderBy: { nombre: "asc" },
        take: 40,
      })
    : [];

  // Segundo: otras categorías para completar
  const idsYaIncluidos = new Set(mismaCategoria.map((a) => a.id));
  const otrasNeeded = 60 - mismaCategoria.length;
  const otras = otrasNeeded > 0
    ? await prisma.alimento.findMany({
        where: {
          ...baseWhere,
          ...(ref ? { categoria: { not: ref.categoria } } : {}),
        },
        select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true },
        orderBy: { nombre: "asc" },
        take: otrasNeeded + 10,
      })
    : [];

  // Combinar: primero misma categoría, luego otros
  const todos = [
    ...mismaCategoria,
    ...otras.filter((a) => !idsYaIncluidos.has(a.id)),
  ].slice(0, 60);

  // Ordenar por similitud de macros si tenemos referencia
  if (ref) {
    const refP = ref.proteinas;
    const refC = ref.carbohidratos;
    const refG = ref.grasas;
    todos.sort((a, b) => {
      const diffA = Math.abs(a.proteinas - refP) + Math.abs(a.carbohidratos - refC) + Math.abs(a.grasas - refG);
      const diffB = Math.abs(b.proteinas - refP) + Math.abs(b.carbohidratos - refC) + Math.abs(b.grasas - refG);
      return diffA - diffB;
    });
  }

  return todos;
}
