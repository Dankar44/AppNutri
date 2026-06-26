import { prisma } from "@/lib/prisma";

// #75 — Juntar días. Orden de la semana para decidir el día "representante" de un grupo.
export const DIA_ORDEN_SEMANA = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

/** #75 — Expande los grupos de días (juntar días). Cada día miembro de un grupo (mismo `grupoId`)
 *  refleja las comidas del día REPRESENTANTE (el de menor orden de la semana del grupo). Añade
 *  `grupoId` a cada día. Días sin grupo se devuelven igual (`grupoId` = null).
 *  No toca la BD: solo lee el grupoId (columna fuera del cliente Prisma) y reorganiza en memoria.
 *  Reutilizado por TODAS las vistas del plan (editor, ficha, portal, compartido, PDF). */
export async function expandirGruposDeDias<T extends { id: string; dia: string; comidas: unknown[] }>(
  planId: string,
  dias: T[],
): Promise<(T & { grupoId: string | null })[]> {
  const rows = await prisma.$queryRawUnsafe<{ id: string; grupoId: string | null }[]>(
    `SELECT id, "grupoId" FROM dias_del_plan WHERE "planId" = $1`,
    planId,
  );
  const grupoPorDia = new Map(rows.map((r) => [r.id, r.grupoId]));

  // Representante de cada grupo = el día con menor orden de semana.
  const repPorGrupo = new Map<string, T>();
  for (const d of dias) {
    const g = grupoPorDia.get(d.id);
    if (!g) continue;
    const rep = repPorGrupo.get(g);
    if (!rep || DIA_ORDEN_SEMANA.indexOf(d.dia) < DIA_ORDEN_SEMANA.indexOf(rep.dia)) {
      repPorGrupo.set(g, d);
    }
  }

  return dias.map((d) => {
    const g = grupoPorDia.get(d.id) ?? null;
    if (!g) return { ...d, grupoId: null };
    const rep = repPorGrupo.get(g);
    return { ...d, grupoId: g, comidas: rep && rep.id !== d.id ? rep.comidas : d.comidas };
  }) as (T & { grupoId: string | null })[];
}
