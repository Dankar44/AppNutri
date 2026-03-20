export interface AlimentoAPIResult {
  codigoBarras: string;
  nombre: string;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  fibra: number;
  imagen?: string;
}

interface OFFProduct {
  code: string;
  product_name?: string;
  product_name_es?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    fiber_100g?: number;
  };
  image_front_small_url?: string;
}

interface OFFSearchResponse {
  products: OFFProduct[];
  count: number;
}

function mapProduct(p: OFFProduct): AlimentoAPIResult | null {
  const nombre = p.product_name_es || p.product_name;
  if (!nombre || !p.nutriments) return null;

  return {
    codigoBarras: p.code,
    nombre,
    calorias: p.nutriments["energy-kcal_100g"] || 0,
    proteinas: p.nutriments.proteins_100g || 0,
    carbohidratos: p.nutriments.carbohydrates_100g || 0,
    grasas: p.nutriments.fat_100g || 0,
    fibra: p.nutriments.fiber_100g || 0,
    imagen: p.image_front_small_url,
  };
}

export async function buscarAlimentosOFF(
  query: string,
  page = 1,
  pageSize = 20
): Promise<{ resultados: AlimentoAPIResult[]; total: number }> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}&lc=es&cc=es`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return { resultados: [], total: 0 };

  const data: OFFSearchResponse = await res.json();
  const resultados = data.products
    .map(mapProduct)
    .filter((p): p is AlimentoAPIResult => p !== null);

  return { resultados, total: data.count };
}

export async function obtenerAlimentoOFF(
  codigoBarras: string
): Promise<AlimentoAPIResult | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${codigoBarras}.json`
  );
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== 1) return null;

  return mapProduct(data.product);
}
