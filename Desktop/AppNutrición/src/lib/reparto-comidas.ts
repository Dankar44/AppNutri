// #78-C — Reparto de kcal/macros POR COMIDA definido en la planificación.
// Lógica compartida entre el editor de planificación (donde se configura) y el editor de
// dietas (donde se muestra el cumplimiento por comida). Client-safe: sin dependencias de servidor.

import { TIPO_KEYS } from "@/lib/seguimiento";
import { ordenarComidasPorHora } from "@/lib/comida-horas";

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
  /** % de kcal propio de esta comida en días concretos (clave = valor de DiaSemana). Manda sobre
   *  `kcalPct` en los días que aparecen aquí.
   *
   *  Solo se usa DENTRO DE UNA DIETA: en la planificación los % son de la semana, porque es una
   *  plantilla. En una dieta los días son concretos y pueden tener distinto número de comidas, así
   *  que un único % semanal no puede cuadrar los dos a la vez (3 comidas el martes → 33% cada una;
   *  4 el miércoles → 25%): al activar el reparto desde la dieta cada día se reparte por separado. */
  pctPorDia?: Record<string, number>;
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

/** % de kcal que le toca a esta comida EN ESE DÍA: el propio del día si lo tiene, y si no el de la
 *  semana. Todo lo que reparta o sume kcal tiene que pasar por aquí, o los días con reparto propio
 *  saldrían con los números del semanal. */
export function pctDeFila(fila: RepartoComida, diaSemana?: string | null): number {
  if (diaSemana && fila.pctPorDia && fila.pctPorDia[diaSemana] != null) {
    return fila.pctPorDia[diaSemana];
  }
  return fila.kcalPct;
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
 *  2. Aplica los % TAL CUAL, sin re-escalar: si las comidas de ese día suman 110% se reparten 2730
 *     de 2482 kcal, y si suman 78% se queda corto. Tapar el descuadre daba números contradictorios
 *     y ocultaba al nutri que su reparto no cuadra: quien avisa es la pantalla, no el cálculo.
 *  3. Reparte las kcal con restos mayores (sin perder ni inventar calorías por el redondeo).
 *
 *  Devuelve null si no hay reparto activo o el día no tiene kcal. */
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
  const alCero = new Set<string>();
  for (const c of reparto.comidas) {
    if (!c.incluida) continue;
    if (pctDeFila(c, diaSemana) <= 0) { alCero.add(claveComida(c)); continue; }
    filas.set(claveComida(c), c);
  }

  // Solo las comidas que existen HOY y están en el reparto reciben objetivo; sus cuotas se
  // renormalizan entre ellas (de ahí que el día siempre cuadre al 100%).
  const emparejadas = comidasDelDia
    .map((cd) => ({ cd, fila: filas.get(claveComida(cd)) }))
    .filter((x): x is { cd: (typeof comidasDelDia)[number]; fila: RepartoComida } => !!x.fila);
  // Comidas del día que están en el reparto pero a 0%: objetivo 0, y se muestran como las demás
  // ("137 / 0 kcal"). ESTE BUCLE NO SE PUEDE QUITAR: si la comida al 0% se cae del mapa, el editor
  // le pinta "no está en el reparto", que es falso — sí está, con 0%.
  const out0: Record<string, ObjetivoComida> = {};
  for (const cd of comidasDelDia) {
    if (alCero.has(claveComida(cd))) {
      out0[cd.id] = { kcal: 0, protG: 0, carbG: 0, grasaG: 0 };
    }
  }
  if (emparejadas.length === 0) return out0;

  const sumaPct = emparejadas.reduce((s, x) => s + pctDeFila(x.fila, diaSemana), 0);
  if (sumaPct <= 0) return out0;
  // Los % se aplican TAL CUAL: si el día suma 110% reparte 2730 de 2482 y si suma 78% se queda
  // corto. No se re-escala nada: tapar el descuadre daba números contradictorios ("110% del día"
  // junto a "2482 de 2482") y ocultaba al nutri que su reparto no cuadra.
  const kcalPorComida = repartirKcal(
    kcalDia,
    emparejadas.map((x) => pctDeFila(x.fila, diaSemana)),
  );

  const out: Record<string, ObjetivoComida> = { ...out0 };
  emparejadas.forEach(({ cd, fila }, idx) => {
    out[cd.id] = objetivoDeFila(kcalPorComida[idx], pctDeFila(fila, diaSemana), fila, dia);
  });
  return out;
}

/** Objetivo de UNA comida a partir de sus kcal ya repartidas. Fórmula ÚNICA de los gramos, que usan
 *  tanto las pastillas "llevas / objetivo" del editor como la tabla del reparto: si cada pantalla
 *  hiciera su cuenta, la tabla diría "P 46 g" y la comida "P 45 g" para lo mismo.
 *
 *  Con override de macros en la comida, los gramos salen de SUS % sobre sus kcal. Sin override, se
 *  hereda la parte proporcional de los gramos del día (no se recalculan desde los % del día: los
 *  gramos objetivo son lo que el nutri fijó, y así las comidas suman exactamente el día). */
export function objetivoDeFila(
  kcal: number,
  cuota: number,
  fila: Pick<RepartoComida, "protPct" | "carbPct" | "grasaPct">,
  dia: { proteinas?: number | null; carbohidratos?: number | null; grasas?: number | null },
): ObjetivoComida {
  return {
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
}

/** Nombre de una comida propia normalizado igual que en `claveComida` (para comparar sin
 *  depender de mayúsculas ni de espacios de más: "Pre-Entreno" == "pre  entreno"). */
export function nombreNormalizado(nombre?: string | null): string {
  return (nombre ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Renombra la fila de una comida propia dentro del reparto. La identidad de una comida OTRA es su
 *  NOMBRE (`claveComida`), así que renombrarla en la dieta sin tocar el reparto la dejaba huérfana y
 *  el editor le pintaba "no está en el reparto".
 *
 *  Devuelve el reparto ya modificado, o `null` si no hay nada que cambiar (no hay fila con ese
 *  nombre, o ya existe una fila con el nombre nuevo: en ese caso la comida se empareja con ella y
 *  crear un duplicado sería peor). */
export function renombrarFilaReparto(
  reparto: RepartoPorComida | null | undefined,
  nombreViejo?: string | null,
  nombreNuevo?: string | null,
): RepartoPorComida | null {
  if (!reparto?.comidas?.length) return null;
  const viejo = nombreNormalizado(nombreViejo);
  const nuevo = nombreNormalizado(nombreNuevo);
  if (!viejo || !nuevo || viejo === nuevo) return null;

  const propias = reparto.comidas.filter((c) => c.tipo === "OTRA");
  if (!propias.some((c) => nombreNormalizado(c.nombre) === viejo)) return null;
  if (propias.some((c) => nombreNormalizado(c.nombre) === nuevo)) return null;

  return {
    ...reparto,
    comidas: reparto.comidas.map((c) =>
      c.tipo === "OTRA" && nombreNormalizado(c.nombre) === viejo
        ? { ...c, nombre: (nombreNuevo ?? "").trim() }
        : c,
    ),
  };
}

/** Filas del reparto que se CREAN en un día concreto, ya en orden cronológico.
 *
 *  Es la regla única de "qué comidas tiene que tener este día según el reparto": la usan tanto la
 *  creación de una dieta nueva como la sincronización al asignarle una planificación a un día, para
 *  que no puedan divergir. Descarta las no incluidas y las propias sin nombre (sin nombre no tienen
 *  identidad: `claveComida` no las distinguiría). Ordenadas por hora efectiva para que el `orden` con
 *  el que se guardan coincida con el orden en que se ven. */
export function filasParaDia(
  reparto: RepartoPorComida | null | undefined,
  diaSemana?: string | null,
): RepartoComida[] {
  if (!reparto?.activo) return [];
  const filas = (reparto.comidas ?? []).filter(
    (c) =>
      c.incluida &&
      (c.tipo !== "OTRA" || (c.nombre ?? "").trim().length > 0) &&
      seCreaEnDia(c, diaSemana),
  );
  return ordenarComidasPorHora(filas);
}

/* ────────────────────────────────────────────────────────────────────────────
 * Presets y mutadores del reparto. Aquí y no en la pantalla de planificación
 * porque el editor de dietas edita el MISMO reparto (su copia): si cada
 * pantalla trajera su propia versión del re-equilibrio, acabarían dando
 * números distintos para lo mismo. Todas las funciones son PURAS
 * (comidas → comidas nuevas): los updaters de React se invocan dos veces en
 * StrictMode y cualquier estado externo se perdería en la segunda pasada.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Presets de reparto de kcal POR COMIDA con nombre (#78-C): distribuciones clásicas de la
 *  práctica dietética. Comida ausente en el mapa = excluida del reparto. Todas suman 100. */
export const REPARTO_PRESETS: { id: string; kcal: Record<string, number> }[] = [
  { id: "tradicional5", kcal: { DESAYUNO: 25, MEDIA_MANANA: 10, ALMUERZO: 30, MERIENDA: 10, CENA: 25 } },
  { id: "completo6", kcal: { DESAYUNO: 25, MEDIA_MANANA: 10, ALMUERZO: 30, MERIENDA: 10, CENA: 20, RECENA: 5 } },
  { id: "tresComidas", kcal: { DESAYUNO: 30, ALMUERZO: 40, CENA: 30 } },
  { id: "cuatroComidas", kcal: { DESAYUNO: 25, ALMUERZO: 35, MERIENDA: 10, CENA: 30 } },
  { id: "desayunoFuerte", kcal: { DESAYUNO: 35, MEDIA_MANANA: 10, ALMUERZO: 30, MERIENDA: 10, CENA: 15 } },
  { id: "cenaLigera", kcal: { DESAYUNO: 25, MEDIA_MANANA: 10, ALMUERZO: 35, MERIENDA: 15, CENA: 15 } },
];

/** Presets de distribución de macros con nombre (#78-C). Valores en % (grasa/carb/prot). */
export type MacroPreset = { id: string; grasa: number; carb: number; prot: number };
export const MACRO_PRESETS: MacroPreset[] = [
  { id: "equilibrada", grasa: 30, carb: 50, prot: 20 },
  { id: "zona", grasa: 30, carb: 40, prot: 30 },
  { id: "carb602020", grasa: 20, carb: 60, prot: 20 },
  { id: "cetogenica", grasa: 70, carb: 10, prot: 20 },
  { id: "altaProteina", grasa: 25, carb: 35, prot: 40 },
  { id: "lowCarb", grasa: 40, carb: 25, prot: 35 },
];

/** Parchea una fila identificada por su clave (tipo en las fijas, nombre en las propias). */
export function setFila(
  comidas: RepartoComida[],
  clave: string,
  patch: Partial<RepartoComida>,
): RepartoComida[] {
  return comidas.map((c) => (claveComida(c) === clave ? { ...c, ...patch } : c));
}

/** Esa comida vuelve a heredar los macros del día (se le quitan sus overrides). */
export function heredarMacrosFila(comidas: RepartoComida[], clave: string): RepartoComida[] {
  return setFila(comidas, clave, { grasaPct: undefined, carbPct: undefined, protPct: undefined });
}

export function quitarFila(comidas: RepartoComida[], clave: string): RepartoComida[] {
  return comidas.filter((c) => claveComida(c) !== clave);
}

export function renombrarFila(comidas: RepartoComida[], clave: string, nombre: string): RepartoComida[] {
  return setFila(comidas, clave, { nombre: nombre.trim().slice(0, 60) || undefined });
}

/** Reparte el 100% a partes iguales entre las comidas incluidas (el punto sobrante va a las
 *  primeras, así la suma es 100 exacto). */
export function repartirEquitativo(comidas: RepartoComida[]): RepartoComida[] {
  const nIncluidas = comidas.filter((c) => c.incluida).length;
  if (nIncluidas === 0) return comidas;
  const base = Math.floor(100 / nIncluidas);
  const resto = 100 - base * nIncluidas;
  let i = 0;
  return comidas.map((c) => {
    if (!c.incluida) return { ...c, kcalPct: 0 };
    const val = base + (i < resto ? 1 : 0);
    i++;
    return { ...c, kcalPct: val };
  });
}

/** Marca/desmarca un día de una comida. Quitar TODOS los días = la comida no va ningún día, o sea
 *  fuera del reparto (antes se interpretaba como "todos" y los días volvían a encenderse solos);
 *  marcar un día en una comida desactivada la vuelve a activar, que es lo que el gesto implica. */
export function toggleDiaFila(comidas: RepartoComida[], clave: string, dia: string): RepartoComida[] {
  return comidas.map((c) => {
    if (claveComida(c) !== clave) return c;
    const actuales = c.dias && c.dias.length > 0 ? c.dias : [...DIAS_SEMANA];
    const siguiente = actuales.includes(dia) ? actuales.filter((d) => d !== dia) : [...actuales, dia];
    if (siguiente.length === 0) return { ...c, incluida: false, dias: undefined };
    return {
      ...c,
      incluida: true,
      dias: siguiente.length === DIAS_SEMANA.length ? undefined : siguiente,
    };
  });
}

/** Aplica un preset de kcal. Las comidas propias NO se tocan: un preset de las 6 clásicas no debe
 *  borrarle al nutri el pre-entreno que acaba de crear. */
export function aplicarPresetKcal(comidas: RepartoComida[], presetId: string): RepartoComida[] {
  const p = REPARTO_PRESETS.find((x) => x.id === presetId);
  if (!p) return comidas;
  return comidas.map((c) => {
    if (c.tipo === "OTRA") return c;
    const val = p.kcal[c.tipo];
    return val != null ? { ...c, incluida: true, kcalPct: val } : { ...c, incluida: false, kcalPct: 0 };
  });
}

/** Aplica un preset de macros con nombre SOLO a esa comida (le crea su override). */
export function aplicarPresetMacrosFila(
  comidas: RepartoComida[],
  clave: string,
  presetId: string,
): RepartoComida[] {
  const p = MACRO_PRESETS.find((x) => x.id === presetId);
  if (!p) return comidas;
  return setFila(comidas, clave, { grasaPct: p.grasa, carbPct: p.carb, protPct: p.prot });
}

/** Preset de kcal que coincide con el estado actual ("" = personalizada). Solo compara inclusión y
 *  % de kcal. Con comidas propias incluidas nunca hay coincidencia exacta (los presets solo hablan
 *  de las 6 fijas), así que se muestra como personalizada. */
export function presetKcalActivo(comidas: RepartoComida[]): string {
  if (comidas.some((c) => c.tipo === "OTRA" && c.incluida)) return "";
  return (
    REPARTO_PRESETS.find((p) =>
      comidas
        .filter((c) => c.tipo !== "OTRA")
        .every((c) => {
          const val = p.kcal[c.tipo];
          return val != null ? c.incluida && c.kcalPct === val : !c.incluida;
        }),
    )?.id ?? ""
  );
}

/** Fija el % de una comida y re-equilibra las DEMÁS incluidas en proporción a lo que tenían,
 *  cuadrando la suma en 100 exacto (el punto sobrante va a las de mayor parte decimal). Es lo que
 *  usan el slider y el campo de kcal, y también "cuadrar el resto" (aplicándolo al valor actual). */
export function fijarPctFila(comidas: RepartoComida[], clave: string, pct: number): RepartoComida[] {
  const clamped = Math.max(0, Math.min(100, pct));
  const objetivo = comidas.find((c) => claveComida(c) === clave);
  if (!objetivo?.incluida) return comidas;
  const otras = comidas.filter((c) => c.incluida && claveComida(c) !== clave);
  if (otras.length === 0) return setFila(comidas, clave, { kcalPct: clamped });

  const remaining = 100 - clamped;
  const otherTotal = otras.reduce((s, c) => s + c.kcalPct, 0);
  const cuotas = otras.map((c) =>
    otherTotal === 0 ? remaining / otras.length : (c.kcalPct / otherTotal) * remaining,
  );
  const nuevos = cuotas.map((q) => Math.floor(q));
  let sobra = remaining - nuevos.reduce((s, v) => s + v, 0);
  Array.from(cuotas.keys())
    .sort((a, b) => cuotas[b] - Math.floor(cuotas[b]) - (cuotas[a] - Math.floor(cuotas[a])))
    .forEach((idx) => {
      if (sobra > 0) {
        nuevos[idx] += 1;
        sobra -= 1;
      }
    });
  const porClave = new Map(otras.map((c, i) => [claveComida(c), nuevos[i]]));
  return comidas.map((c) => {
    const k = claveComida(c);
    return k === clave
      ? { ...c, kcalPct: clamped }
      : porClave.has(k)
        ? { ...c, kcalPct: porClave.get(k)! }
        : c;
  });
}

/** Añade una comida propia al reparto. Devuelve `null` si ya hay una con ese nombre (su identidad
 *  es el nombre: dos iguales compartirían cuota) o si el nombre viene vacío. */
export function anadirFila(
  comidas: RepartoComida[],
  data: { nombre: string; hora?: string; dias?: string[]; kcalPct?: number },
): RepartoComida[] | null {
  const limpio = data.nombre.trim().slice(0, 60);
  if (!limpio) return null;
  const clave = claveComida({ tipo: "OTRA", nombre: limpio });
  if (comidas.some((c) => claveComida(c) === clave)) return null;
  const hora = (data.hora ?? "").trim();
  const dias = data.dias ?? [];
  return [
    ...comidas,
    {
      tipo: "OTRA",
      nombre: limpio,
      hora: /^([01]?\d|2[0-3]):[0-5]\d$/.test(hora) ? hora : undefined,
      dias: dias.length > 0 && dias.length < DIAS_SEMANA.length ? dias : undefined,
      incluida: true,
      kcalPct: data.kcalPct ?? 10,
    },
  ];
}

/* ────────────────────────────────────────────────────────────────────────────
 * Lo que guarda la DIETA en `planes_alimenticios.repartoPorComida`.
 *
 * Formato v1 (dietas creadas antes): un `RepartoPorComida` para toda la dieta.
 * Formato v2: un reparto POR PLANIFICACIÓN, porque una dieta puede tener
 * varias y cada día usa la suya (el lunes la de volumen, el martes la de
 * descanso). El slot `global` es imprescindible y no es un caso raro: con UNA
 * sola planificación, `crearPlan` no le asigna `planificacionId` a ningún día,
 * así que el caso normal es "día sin planificación".
 *
 * Se leen los dos formatos siempre. No hay migración de datos: la columna es
 * JSONB y las dietas viejas se siguen entendiendo tal cual.
 * ──────────────────────────────────────────────────────────────────────────── */

export type RepartoGuardadoV2 = {
  v: 2;
  /** Para los días sin planificación asignada. */
  global?: RepartoPorComida | null;
  porPlani?: Record<string, RepartoPorComida>;
};

export type RepartoGuardado = RepartoPorComida | RepartoGuardadoV2;

export function esRepartoV2(g: RepartoGuardado | null | undefined): g is RepartoGuardadoV2 {
  return !!g && typeof g === "object" && (g as RepartoGuardadoV2).v === 2;
}

/** El reparto que le toca a un día según su planificación. Sin slot propio cae en `global`, que es
 *  donde vive el reparto de las dietas con una sola planificación (o ninguna). */
export function repartoParaPlani(
  guardado: RepartoGuardado | null | undefined,
  planificacionId?: string | null,
): RepartoPorComida | null {
  if (!guardado) return null;
  if (!esRepartoV2(guardado)) return guardado; // v1: uno solo para toda la dieta
  if (planificacionId && guardado.porPlani?.[planificacionId]) {
    return guardado.porPlani[planificacionId];
  }
  return guardado.global ?? null;
}

/** Escribe el reparto de UNA planificación (o el global) dejando los demás como estaban.
 *
 *  Al pasar de v1 a v2 se siembra el reparto viejo en `global` y en el slot de todas las
 *  planificaciones conocidas ANTES de sustituir el editado: si no, los días de las otras
 *  planificaciones perderían de golpe el reparto que estaban usando, sin que nadie lo pidiera. */
export function ponerRepartoParaPlani(
  guardado: RepartoGuardado | null | undefined,
  planificacionId: string | null | undefined,
  reparto: RepartoPorComida | null,
  planificacionIdsConocidos: string[] = [],
): RepartoGuardadoV2 {
  let base: RepartoGuardadoV2;
  if (esRepartoV2(guardado)) {
    base = { v: 2, global: guardado.global ?? null, porPlani: { ...(guardado.porPlani ?? {}) } };
  } else if (guardado) {
    const porPlani: Record<string, RepartoPorComida> = {};
    for (const id of planificacionIdsConocidos) porPlani[id] = guardado;
    base = { v: 2, global: guardado, porPlani };
  } else {
    base = { v: 2, global: null, porPlani: {} };
  }

  if (planificacionId) {
    const porPlani = { ...(base.porPlani ?? {}) };
    if (reparto) porPlani[planificacionId] = reparto;
    else delete porPlani[planificacionId];
    return { ...base, porPlani };
  }
  return { ...base, global: reparto };
}

/** Reparte el 100% de CADA día por separado entre las comidas que ese día tiene, y lo guarda como
 *  % por día (`pctPorDia`). Es lo que hace "activar el reparto" desde dentro de una dieta: los días
 *  pueden tener distinto número de comidas, así que un único % semanal no cuadraría los dos a la vez.
 *
 *  `comidasPorDia` son las comidas REALES de la dieta, por día de la semana. Las filas que ese día
 *  no existen no reciben % (se quedan sin entrada, así que ese día no consumen cuota). */
export function repartoEquitativoPorDia(
  comidas: RepartoComida[],
  comidasPorDia: Record<string, { tipo: string; nombre?: string | null }[]>,
): RepartoComida[] {
  const pctPorClave = new Map<string, Record<string, number>>();
  for (const [dia, delDia] of Object.entries(comidasPorDia)) {
    const claves = [...new Set(delDia.map((c) => claveComida(c)))];
    if (claves.length === 0) continue;
    const base = Math.floor(100 / claves.length);
    const resto = 100 - base * claves.length;
    claves.forEach((clave, i) => {
      const prev = pctPorClave.get(clave) ?? {};
      prev[dia] = base + (i < resto ? 1 : 0);
      pctPorClave.set(clave, prev);
    });
  }
  return comidas.map((c) => {
    const clave = claveComida(c);
    const porDia = pctPorClave.get(clave);
    if (!porDia) return { ...c, incluida: false, pctPorDia: undefined };
    const valores = Object.values(porDia);
    return {
      ...c,
      incluida: true,
      // El % de semana se deja en la media, para que la fila diga algo coherente si algún día
      // aparece luego sin entrada propia.
      kcalPct: Math.round(valores.reduce((s, v) => s + v, 0) / valores.length),
      pctPorDia: porDia,
    };
  });
}

/** Renombra una comida propia en TODOS los repartos que guarde la dieta (el global y el de cada
 *  planificación): la comida es la misma en todos, y dejar uno con el nombre viejo la sacaría del
 *  reparto en cuanto ese día usara esa planificación. Devuelve null si no hay nada que cambiar. */
export function renombrarFilaEnGuardado(
  guardado: RepartoGuardado | null | undefined,
  nombreViejo?: string | null,
  nombreNuevo?: string | null,
): RepartoGuardado | null {
  if (!guardado) return null;
  if (!esRepartoV2(guardado)) return renombrarFilaReparto(guardado, nombreViejo, nombreNuevo);

  let cambiado = false;
  const global = renombrarFilaReparto(guardado.global, nombreViejo, nombreNuevo);
  if (global) cambiado = true;
  const porPlani: Record<string, RepartoPorComida> = {};
  for (const [id, r] of Object.entries(guardado.porPlani ?? {})) {
    const nuevo = renombrarFilaReparto(r, nombreViejo, nombreNuevo);
    if (nuevo) cambiado = true;
    porPlani[id] = nuevo ?? r;
  }
  if (!cambiado) return null;
  return { v: 2, global: global ?? guardado.global ?? null, porPlani };
}

/** Firma estable de un reparto, para comparar el borrador optimista de la UI con lo que devuelve el
 *  servidor. No vale `JSON.stringify`: el objeto viene de una columna JSONB, que reordena las claves,
 *  así que dos repartos idénticos darían cadenas distintas y el borrador no se podaría nunca. */
export function firmaReparto(r: RepartoPorComida | null | undefined): string {
  if (!r) return "";
  const filas = (r.comidas ?? [])
    .map((c) =>
      [
        claveComida(c),
        c.incluida ? "1" : "0",
        c.kcalPct,
        c.grasaPct ?? "",
        c.carbPct ?? "",
        c.protPct ?? "",
        (c.nombre ?? "").trim(),
        c.hora ?? "",
        [...(c.dias ?? [])].sort().join(","),
        Object.entries(c.pctPorDia ?? {})
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([d, v]) => `${d}:${v}`)
          .join(","),
      ].join("|"),
    )
    .sort();
  return `${r.activo ? "1" : "0"}#${filas.join(";")}`;
}
