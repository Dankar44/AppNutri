import { prisma } from "@/lib/prisma";

export interface AlimentoGlobalCached {
  id: string;
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
}

const CACHE_TTL = 60 * 60 * 1000; // 1 hora

let cached: AlimentoGlobalCached[] | null = null;
let cachedAt = 0;

export async function getAlimentosGlobales(): Promise<AlimentoGlobalCached[]> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL) return cached;

  cached = await prisma.alimento.findMany({
    where: { dietistaId: null },
    select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true },
    orderBy: { nombre: "asc" },
  });
  cachedAt = now;
  return cached;
}

export function invalidateAlimentosGlobalesCache() {
  cached = null;
  cachedAt = 0;
}
