/**
 * Funciones de normalización para alimentos.
 * Se usan en todas las vías de creación (manual, API, IA, seed).
 */

export function normalizarNombreAlimento(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function redondearMacros(valor: number): number {
  return Math.round(valor * 10) / 10;
}

/**
 * Normaliza un texto para BÚSQUEDA: minúsculas, sin tildes, espacios colapsados
 * y des-pluralización simple. Se guarda en `nombreNormalizado` y se aplica también
 * al término buscado, de modo que "Jamón" ↔ "jamon" y "huevos" ↔ "huevo" coincidan.
 */
export function normalizarParaBusqueda(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quitar tildes/diacríticos
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(despluralizar)
    .join(" ");
}

// Heurística de plural para español: quitar "s" final en palabras de ≥4 letras
// (cubre la mayoría de alimentos: huevos→huevo, tomates→tomate, fresas→fresa)
// sin romper términos cortos ni la raíz del singular.
function despluralizar(palabra: string): string {
  if (palabra.length >= 4 && palabra.endsWith("s")) return palabra.slice(0, -1);
  return palabra;
}

export function findAlimentoEnLista<T extends { nombre: string }>(
  lista: T[],
  nombre: string,
): T | null {
  const nombreNorm = normalizarNombreAlimento(nombre);
  const normLower = nombreNorm.toLowerCase();
  const sinTildes = nombreNorm.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const sinTildesLower = sinTildes.toLowerCase();

  const exacto = lista.find((a) => a.nombre.toLowerCase() === normLower);
  if (exacto) return exacto;

  const variantes = [normLower];
  if (sinTildesLower !== normLower) variantes.push(sinTildesLower);

  for (const v of variantes) {
    const matches = lista.filter((a) => a.nombre.toLowerCase().startsWith(v));
    if (matches.length > 0) {
      matches.sort((a, b) => a.nombre.length - b.nombre.length);
      return matches[0];
    }
  }

  const primera = nombreNorm.split(" ")[0];
  if (primera && primera.length >= 4) {
    const pLower = primera.toLowerCase();
    const exactaPrimera = lista.find((a) => a.nombre.toLowerCase() === pLower);
    if (exactaPrimera) return exactaPrimera;

    const startPrimera = lista.filter((a) => a.nombre.toLowerCase().startsWith(pLower));
    if (startPrimera.length > 0) {
      startPrimera.sort((a, b) => a.nombre.length - b.nombre.length);
      return startPrimera[0];
    }
  }

  return null;
}
