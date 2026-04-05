"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CategoriaAlimento,
  UnidadMedida,
  OrigenAlimento,
} from "@/generated/prisma/client";
import { buscarAlimentosOFF, type AlimentoAPIResult } from "@/lib/openfoodfacts";
import { normalizarNombreAlimento, redondearMacros } from "@/lib/alimento-utils";
import { sanitizeString, validateNumber, validateEnum, sanitizeSearch, LIMITS } from "@/lib/validation";

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
}

export async function crearAlimento(data: AlimentoFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  // Validación server-side
  const nombreSanitizado = sanitizeString(data.nombre, LIMITS.NOMBRE);
  if (!nombreSanitizado) throw new Error("El nombre es obligatorio");
  data.calorias = validateNumber(data.calorias, 0, LIMITS.CALORIAS_MAX);
  data.proteinas = validateNumber(data.proteinas, 0, LIMITS.MACROS_MAX);
  data.carbohidratos = validateNumber(data.carbohidratos, 0, LIMITS.MACROS_MAX);
  data.grasas = validateNumber(data.grasas, 0, LIMITS.MACROS_MAX);
  data.fibra = validateNumber(data.fibra, 0, LIMITS.MACROS_MAX);
  data.porcion = validateNumber(data.porcion, 0.1, LIMITS.PORCION_MAX);
  const categoriaValida = validateEnum(data.categoria, Object.values(CategoriaAlimento));
  if (!categoriaValida) throw new Error("Categoría no válida");
  data.categoria = categoriaValida;
  const unidadValida = validateEnum(data.unidad, Object.values(UnidadMedida));
  if (!unidadValida) throw new Error("Unidad no válida");
  data.unidad = unidadValida;

  const nombreNorm = normalizarNombreAlimento(nombreSanitizado);

  // Prevenir duplicados por nombre normalizado
  const existente = await prisma.alimento.findFirst({
    where: {
      OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
      nombre: { equals: nombreNorm, mode: "insensitive" },
    },
  });
  if (existente) throw new Error("Ya existe un alimento con ese nombre");

  const alimento = await prisma.alimento.create({
    data: {
      dietistaId: dietista.id,
      nombre: nombreNorm,
      categoria: data.categoria,
      calorias: redondearMacros(data.calorias),
      proteinas: redondearMacros(data.proteinas),
      carbohidratos: redondearMacros(data.carbohidratos),
      grasas: redondearMacros(data.grasas),
      fibra: redondearMacros(data.fibra),
      porcion: data.porcion,
      unidad: data.unidad,
      origen: "PERSONALIZADO",
    },
  });

  revalidatePath("/alimentos");
  redirect(`/alimentos/${alimento.id}`);
}

export async function actualizarAlimento(id: string, data: AlimentoFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  // Validación server-side
  const nombreSanitizado = sanitizeString(data.nombre, LIMITS.NOMBRE);
  if (!nombreSanitizado) throw new Error("El nombre es obligatorio");
  data.calorias = validateNumber(data.calorias, 0, LIMITS.CALORIAS_MAX);
  data.proteinas = validateNumber(data.proteinas, 0, LIMITS.MACROS_MAX);
  data.carbohidratos = validateNumber(data.carbohidratos, 0, LIMITS.MACROS_MAX);
  data.grasas = validateNumber(data.grasas, 0, LIMITS.MACROS_MAX);
  data.fibra = validateNumber(data.fibra, 0, LIMITS.MACROS_MAX);
  data.porcion = validateNumber(data.porcion, 0.1, LIMITS.PORCION_MAX);
  const categoriaValida = validateEnum(data.categoria, Object.values(CategoriaAlimento));
  if (!categoriaValida) throw new Error("Categoría no válida");
  data.categoria = categoriaValida;
  const unidadValida = validateEnum(data.unidad, Object.values(UnidadMedida));
  if (!unidadValida) throw new Error("Unidad no válida");
  data.unidad = unidadValida;

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
    },
  });

  revalidatePath("/alimentos");
  revalidatePath(`/alimentos/${id}`);
  redirect(`/alimentos/${id}`);
}

export async function eliminarAlimento(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

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
  calMin?: number;
  calMax?: number;
  protMin?: number;
  protMax?: number;
  carbMin?: number;
  carbMax?: number;
  grasaMin?: number;
  grasaMax?: number;
}

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

  const where = {
    OR: [{ dietistaId: dietista.id }, { dietistaId: null }],
    ...(categoria ? { categoria } : {}),
    ...(f.origen && (f.origen === "PERSONALIZADO" || f.origen === "API") ? { origen: f.origen as "PERSONALIZADO" | "API" } : {}),
    ...(busquedaSanitizada
      ? { nombre: { contains: busquedaSanitizada, mode: "insensitive" as const } }
      : {}),
    ...(f.calMin || f.calMax ? { calorias: { ...(f.calMin ? { gte: f.calMin } : {}), ...(f.calMax ? { lte: f.calMax } : {}) } } : {}),
    ...(f.protMin || f.protMax ? { proteinas: { ...(f.protMin ? { gte: f.protMin } : {}), ...(f.protMax ? { lte: f.protMax } : {}) } } : {}),
    ...(f.carbMin || f.carbMax ? { carbohidratos: { ...(f.carbMin ? { gte: f.carbMin } : {}), ...(f.carbMax ? { lte: f.carbMax } : {}) } } : {}),
    ...(f.grasaMin || f.grasaMax ? { grasas: { ...(f.grasaMin ? { gte: f.grasaMin } : {}), ...(f.grasaMax ? { lte: f.grasaMax } : {}) } } : {}),
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
  categoria?: string
) {
  const busquedaSanitizada = busqueda ? sanitizeSearch(busqueda) : undefined;
  return getAlimentosPaginados(busquedaSanitizada, categoria as CategoriaAlimento | undefined, cursor);
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
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  // Validación server-side
  data.nombre = sanitizeString(data.nombre, 200) || "Sin nombre";
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
      dietistaId: dietista.id,
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
