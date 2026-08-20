// #78-C — Reparto de kcal/macros POR COMIDA definido en la planificación.
// Lógica compartida entre el editor de planificación (donde se configura) y el editor de
// dietas (donde se muestra el cumplimiento por comida). Client-safe: sin dependencias de servidor.

import { TIPO_KEYS } from "@/lib/seguimiento";

/** Reparto por comida: una fila por comida (valor del enum TipoComida: "DESAYUNO", …). */
export type RepartoComida = {
  tipo: string;
  /** Si esta comida participa en el reparto (permite montar planes de 3, 4, 5 comidas). */
  incluida: boolean;
  /** % de las kcal del día asignadas a esta comida. La suma de las incluidas debería ser 100. */
  kcalPct: number;
  /** Override de la distribución de macros de ESTA comida (ej. desayuno 70% carbo).
   *  Si están undefined, la comida hereda la distribución de macros del día. */
  grasaPct?: number;
  carbPct?: number;
  protPct?: number;
  /** Nombre que ve el nutri. En las 6 fijas es un alias opcional ("Comida" para el Almuerzo); en las
   *  comidas añadidas (tipo OTRA) es su identidad: dos OTRA distintas se distinguen por el nombre. */
  nombre?: string;
  /** Hora "HH:MM" con la que se creará la comida en la dieta. */
  hora?: string;
  /** Días en los que se CREARÁ esta comida al montar una dieta nueva (valores de DiaSemana).
   *  Vacío/undefined = todos. Es solo una plantilla de creación, NO una restricción: para el cálculo
   *  manda lo que la dieta tiene de verdad, así mover una comida de día no rompe nada ni avisa. */
  dias?: string[];
};

export type RepartoPorComida = {
  /** Si el nutricionista activó la configuración avanzada por comida. */
  activo: boolean;
  comidas: RepartoComida[];
};

/** Días de la semana en orden (valores de DiaSemana). Aquí y no en `grupos-dias.ts` porque ese
 *  importa Prisma y esta lib la usan también componentes de cliente. */
export const DIAS_SEMANA = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;

/** Identidad de una comida a efectos del reparto: las 6 fijas por su tipo; las añadidas por su
 *  nombre (así "Pre-entreno" y "Snack" del mismo día no comparten cuota, que era el error de
 *  emparejar solo por tipo). Se normaliza el nombre para que "Pre-Entreno" y "pre entreno" casen. */
export function claveComida(c: { tipo: string; nombre?: string | null }): string {
  if (c.tipo !== "OTRA") return c.tipo;
  const n = (c.nombre ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return `OTRA:${n}`;
}

/** ¿Se crea esta comida el día indicado al montar una dieta nueva? Sin `dias` (o vacío), todos.
 *  OJO: solo para CREAR. El cumplimiento se calcula sobre las comidas que la dieta tiene de verdad. */
export function seCreaEnDia(c: RepartoComida, dia?: string | null): boolean {
  if (!c.dias || c.dias.length === 0) return true;
  if (!dia) return true;
  return c.dias.includes(dia);
}

/** Reparto de kcal por comida por defecto al activar la configuración avanzada (suma 100). */
export const DEFAULT_REPARTO_KCAL_PCT: Record<string, number> = {
  DESAYUNO: 25,
  MEDIA_MANANA: 10,
  ALMUERZO: 30,
  MERIENDA: 10,
  CENA: 20,
  RECENA: 5,
};

/** Normaliza el reparto guardado: SIEMPRE las 6 comidas fijas en orden (mezclando lo guardado con
 *  los defaults) MÁS las comidas añadidas por el nutri, que se conservan tal cual y van al final.
 *  Así el editor no depende de qué se guardó y las comidas personalizadas no se pierden. */
export function normalizeReparto(saved?: { activo?: boolean; comidas?: RepartoComida[] } | null): {
  activo: boolean;
  comidas: RepartoComida[];
} {
  const guardadas = saved?.comidas ?? [];
  const byTipo = new Map(guardadas.filter((c) => c.tipo !== "OTRA").map((c) => [c.tipo, c]));
  const fijas: RepartoComida[] = TIPO_KEYS.map((tipo) => {
    const prev = byTipo.get(tipo);
    return {
      tipo,
      incluida: prev?.incluida ?? true,
      kcalPct: prev?.kcalPct ?? DEFAULT_REPARTO_KCAL_PCT[tipo] ?? 0,
      grasaPct: prev?.grasaPct,
      carbPct: prev?.carbPct,
      protPct: prev?.protPct,
      nombre: prev?.nombre,
      hora: prev?.hora,
      dias: prev?.dias,
    };
  });
  // Comidas añadidas: se identifican por nombre, así que se descartan las que no lo tengan.
  const anadidas = guardadas.filter((c) => c.tipo === "OTRA" && (c.nombre ?? "").trim().length > 0);
  return { activo: saved?.activo ?? false, comidas: [...fijas, ...anadidas] };
}

/** Reparte las kcal del día entre las comidas según sus %, SIN perder ni inventar calorías por el
 *  redondeo: se reparte el resto entre las comidas de mayor parte decimal (restos mayores). Si los
 *  % suman 100, las kcal por comida suman EXACTAMENTE el objetivo del día (así el pie de la tabla no
 *  dice "2484 de 2482"). Si no suman 100, el desvío se mantiene: es información real para el nutri. */
export function repartirKcal(kcalDia: number, pcts: number[]): number[] {
  if (pcts.length === 0) return [];
  const sumaPct = pcts.reduce((s, v) => s + v, 0);
  const exactos = pcts.map((p) => (kcalDia * p) / 100);
  const base = exactos.map((v) => Math.floor(v));
  const objetivo = sumaPct === 100 ? Math.round(kcalDia) : Math.round((kcalDia * sumaPct) / 100);
  let resto = objetivo - base.reduce((s, v) => s + v, 0);
  const porFraccion = exactos
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  const out = [...base];
  for (const { i } of porFraccion) {
    if (resto <= 0) break;
    out[i] += 1;
    resto -= 1;
  }
  return out;
}

/** Objetivo calculado de una comida (kcal + gramos por macro; un macro es null si no se puede
 *  derivar, p. ej. la comida hereda y el día no tiene objetivo para ese macro). */
export type ObjetivoComida = {
  kcal: number;
  protG: number | null;
  carbG: number | null;
  grasaG: number | null;
};

/** Objetivos de las comidas REALES de un día concreto, indexado por id de comida.
 *
 *  Es la función que usa el editor de dietas, y hace tres cosas que antes fallaban:
 *  1. Empareja por identidad (`claveComida`): las comidas añadidas se distinguen por su nombre, así
 *     que dos "OTRA" del mismo día no comparten cuota.
 *  2. **Renormaliza según las comidas que ese día EXISTEN**: si el lunes no tiene desayuno (borrado)
 *     o tiene un pre-entreno que otros días no, las cuotas se re-escalan a 100% entre las presentes.
 *     Así el total del día siempre cuadra y no quedan kcal colgadas e invisibles.
 *  3. Reparte las kcal con restos mayores, para que las comidas sumen justo el objetivo del día.
 *
 *  Los macros de una comida que hereda se derivan de su cuota YA renormalizada, para que también
 *  sumen los gramos del día. Devuelve null si no hay reparto activo o el día no tiene kcal. */
export function objetivosPorComidaDia(
  dia: {
    kcal?: number | null;
    proteinas?: number | null;
    carbohidratos?: number | null;
    grasas?: number | null;
  },
  reparto: RepartoPorComida | null | undefined,
  comidasDelDia: { id: string; tipo: string; nombre?: string | null }[],
  diaSemana?: string | null
): Record<string, ObjetivoComida> | null {
  if (!reparto?.activo) return null;
  const kcalDia = dia.kcal ?? 0;
  if (kcalDia <= 0) return null;

  // Filas utilizables: incluidas y con cuota. NO se filtra por `dias`: manda lo que el día tiene de
  // verdad, así mover una comida de un día a otro en la dieta sigue funcionando sin tocar la pauta.
  const filas = new Map<string, RepartoComida>();
  for (const c of reparto.comidas) {
    if (!c.incluida || c.kcalPct <= 0) continue;
    filas.set(claveComida(c), c);
  }

  // Solo las comidas que existen HOY y están en el reparto reciben objetivo; sus cuotas se
  // renormalizan entre ellas (de ahí que el día siempre cuadre al 100%).
  const emparejadas = comidasDelDia
    .map((cd) => ({ cd, fila: filas.get(claveComida(cd)) }))
    .filter((x): x is { cd: (typeof comidasDelDia)[number]; fila: RepartoComida } => !!x.fila);
  if (emparejadas.length === 0) return {};

  const sumaPct = emparejadas.reduce((s, x) => s + x.fila.kcalPct, 0);
  if (sumaPct <= 0) return {};
  // Cuotas renormalizadas a 100 (en tanto por uno, sin redondear todavía).
  const pesos = emparejadas.map((x) => (x.fila.kcalPct / sumaPct) * 100);
  const kcalPorComida = repartirKcal(kcalDia, pesos);

  const out: Record<string, ObjetivoComida> = {};
  emparejadas.forEach(({ cd, fila }, idx) => {
    const kcal = kcalPorComida[idx];
    const cuota = pesos[idx]; // % del día que le corresponde ya renormalizado
    out[cd.id] = {
      kcal,
      protG:
        fila.protPct != null
          ? Math.round((kcal * fila.protPct) / 100 / 4)
          : dia.proteinas != null
            ? Math.round((dia.proteinas * cuota) / 100)
            : null,
      carbG:
        fila.carbPct != null
          ? Math.round((kcal * fila.carbPct) / 100 / 4)
          : dia.carbohidratos != null
            ? Math.round((dia.carbohidratos * cuota) / 100)
            : null,
      grasaG:
        fila.grasaPct != null
          ? Math.round((kcal * fila.grasaPct) / 100 / 9)
          : dia.grasas != null
            ? Math.round((dia.grasas * cuota) / 100)
            : null,
    };
  });
  return out;
}
