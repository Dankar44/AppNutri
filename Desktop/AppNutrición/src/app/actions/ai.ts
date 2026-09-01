"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { isAIConfigured } from "@/lib/openai";
import { generateDietPlan } from "@/lib/ai/generate-plan";
import { revalidatePath } from "next/cache";
import type { MacroObjetivos } from "@/lib/ai/types";
import { DiaSemana, TipoComida } from "@/generated/prisma/client";
import { findAlimentoEnLista } from "@/lib/alimento-utils";
import { getCompanyMemberIds } from "@/lib/empresa-utils";
import { sanitizeString, validateNumber, LIMITS } from "@/lib/validation";
import { getTranslations } from "next-intl/server";
import { getAlimentosGlobales, type AlimentoGlobalCached } from "@/lib/alimentos-cache";

// Cuántos alimentos globales incluir en el prompt de la IA por categoría.
// Da más cupo a las categorías que forman el grueso de un plan (proteínas,
// cereales, verduras, frutas) y menos a las accesorias.
// OJO con el total: el tier gratuito de Groq limita a 12.000 tokens/min por
// petición (entrada + salida). Con ~70 globales + propios + system + max_tokens
// 4096, cada petición queda holgada por debajo. Subir esto puede provocar 413.
const LIMITE_POR_CATEGORIA: Record<string, number> = {
  CARNES: 9, PESCADOS: 8, HUEVOS: 2, LEGUMBRES: 5, LACTEOS: 7,
  CEREALES: 9, VERDURAS: 9, FRUTAS: 8, FRUTOS_SECOS: 4, ACEITES: 2,
  BEBIDAS: 2, CONDIMENTOS: 1, DULCES: 1, OTROS: 3,
};
const LIMITE_CATEGORIA_DEFAULT = 3;

// Subcadenas que delatan un preparado / derivado / ultraprocesado / víscera poco
// apto como base de una pauta. El catálogo global es hipergranular (mezcla
// básicos con encurtidos, postres, harinas, casquería…) y no tiene ninguna
// señal de "alimento básico", así que filtramos por nombre antes de muestrear
// para que la IA elija comida "de manual" (no "cebolleta en vinagre" ni "hígado
// de ternera"). NO se vetan las cocciones entre paréntesis —"Lentejas
// (cocidas)", "Arroz (cocido)"— porque son básicos que solo existen así.
const VETO_ALIMENTO = [
  "vinagre", "sashimi", "fiambre", "empanad", "frito", "frita", "relleno", "rellena", "salsa", "precocinad",
  "conserva", "almibar", "escabeche", "encurtid", "deshidratad", "liofiliz", "inflad", "tostad", "marinad", "adobad", "ahumad",
  "harina", "helado", "sorbete", "polo de", "batido", "crema de", "zumo", "nectar", "pure", "postre", "mousse", "flan",
  "natillas", "pannacotta", "tarta", "galleta", "bolleria", "croissant", "donut", "gofre", "pizza", "sirope", "mermelada", "confitura",
  "salchicha", "hamburguesa", "nugget", "salami", "chorizo", "morcilla", "mortadela", "sobrasada", "bacon", "chistorra",
  "higado", "sesos", "rinon", "lengua", "callos", "mollej", "sangre", "casqueria",
  "pasta de", "leche de", "bebida", "orejon", "cookie", "smoothie", "licuado", "muffin", "crep",
  "chicharron", "surimi", "xantana", "almidon", "tapioca", "en aceite", "loncheado", "pinchito", "roast beef", "goma ",
  "en polvo", "colageno", "turron", "trail", "ralladura", "androlla",
  "foie", "confitad", "barrita", "santa teresa", "pulled", "aislada", "eritritol", "proteina vegana",
];
// Alimentos de PRUEBA del nutricionista (sondas de testing: "Test Gramos",
// "Micros Test"…). NO se borran de la BD (los usa para sus pruebas), pero la IA
// debe ignorarlos. Se aplica tanto a globales como a los personalizados del nutri.
const PATRONES_PRUEBA = ["test", "micros", "prueba", "asdf", "xxx", "qwerty"];
function esDePrueba(nombre: string): boolean {
  const n = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return PATRONES_PRUEBA.some((p) => n.includes(p));
}

function esAlimentoBasico(nombre: string): boolean {
  if (esDePrueba(nombre)) return false;
  if (nombre.trim().split(/\s+/).length >= 5) return false; // demasiado específico
  const n = nombre.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return !VETO_ALIMENTO.some((v) => n.includes(v));
}

/**
 * Selecciona un subconjunto variado de los alimentos globales (que pueden ser
 * miles) para meterlo en el prompt sin reventar el límite de tokens. Filtra los
 * no-básicos (ver VETO_ALIMENTO), agrupa por categoría y, dentro de cada una,
 * muestrea de forma espaciada con un offset aleatorio (para que dos
 * generaciones no salgan idénticas).
 */
function muestrearGlobalesVariado(globales: AlimentoGlobalCached[]): AlimentoGlobalCached[] {
  const grupos = new Map<string, AlimentoGlobalCached[]>();
  for (const a of globales) {
    if (!esAlimentoBasico(a.nombre)) continue;
    const cat = a.categoria || "OTROS";
    if (!grupos.has(cat)) grupos.set(cat, []);
    grupos.get(cat)!.push(a);
  }

  const out: AlimentoGlobalCached[] = [];
  for (const [cat, items] of grupos) {
    const limite = LIMITE_POR_CATEGORIA[cat] ?? LIMITE_CATEGORIA_DEFAULT;
    if (items.length <= limite) {
      out.push(...items);
      continue;
    }
    const step = items.length / limite;
    const offset = Math.random() * step;
    for (let i = 0; i < limite; i++) {
      out.push(items[Math.min(items.length - 1, Math.floor(offset + i * step))]);
    }
  }
  return out;
}

// Qué comidas debe generar la IA según el nº elegido en el formulario. El plan
// tiene 6 slots fijos; las que no se generen quedan vacías (correcto si el nutri
// quiere menos comidas). Antes la IA decidía por su cuenta y solo hacía 3.
const COMIDAS_POR_NUM: Record<number, string[]> = {
  3: ["DESAYUNO", "ALMUERZO", "CENA"],
  4: ["DESAYUNO", "ALMUERZO", "MERIENDA", "CENA"],
  5: ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA"],
  6: ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"],
};

const normTexto = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Exclusiones por alergia/intolerancia (texto libre del paciente). Si alguna
// palabra clave aparece en las restricciones, se quitan del catálogo los
// alimentos que cumplan `excluir` — así ni se le ofrecen a la IA (defensa dura,
// además de la instrucción del prompt). Cubre los alérgenos más comunes.
const RESTRICCIONES: { claves: string[]; excluir: (nombreNorm: string, categoria: string) => boolean }[] = [
  { claves: ["lact", "leche", "lacteo", "queso", "yogur"], excluir: (_n, c) => c === "LACTEOS" },
  { claves: ["fruto seco", "frutos secos", "nuez", "nueces", "almendra", "avellana", "anacardo", "pistacho", "cacahuete"], excluir: (_n, c) => c === "FRUTOS_SECOS" },
  { claves: ["huevo"], excluir: (_n, c) => c === "HUEVOS" },
  { claves: ["marisco", "crustaceo", "molusco"], excluir: (n) => /gamba|langostino|mejillon|almeja|pulpo|sepia|calamar|cangrejo|ostra|navaja|berberecho|vieira|cigala|centollo|bogavante|carabinero|necora|percebe/.test(n) },
  { claves: ["pescado"], excluir: (_n, c) => c === "PESCADOS" },
  { claves: ["gluten", "celiac", "celiaqu", "trigo"], excluir: (n) => /trigo|cebada|centeno|espelta|avena|pan|pasta|cuscus|harina|seitan|galleta|pizza|gluten/.test(n) },
  { claves: ["soja"], excluir: (n) => /soja|tofu|tempeh|edamame|miso/.test(n) },
];

function filtrarPorRestricciones<T extends { nombre: string; categoria: string }>(lista: T[], restricciones: string[]): T[] {
  const restr = restricciones.map(normTexto).filter(Boolean);
  if (restr.length === 0) return lista;
  const activas = RESTRICCIONES.filter((r) => r.claves.some((c) => restr.some((x) => x.includes(c))));
  if (activas.length === 0) return lista;
  return lista.filter((a) => { const n = normTexto(a.nombre); return !activas.some((r) => r.excluir(n, a.categoria)); });
}

export async function checkAIConfigured() {
  return isAIConfigured();
}

export async function generarPlanIA(
  pacienteId: string,
  objetivos: MacroObjetivos,
  instrucciones: string,
  numComidas: number = 6
): Promise<{ generacionId: string; plan: unknown } | { error: string }> {
  try {
    const t = await getTranslations("validation");
    // Validar y sanitizar inputs
    instrucciones = sanitizeString(instrucciones, LIMITS.INSTRUCCIONES_IA);
    objetivos = {
      calorias: validateNumber(objetivos.calorias, 500, 10000),
      proteinas: validateNumber(objetivos.proteinas, 0, LIMITS.MACROS_MAX),
      carbohidratos: validateNumber(objetivos.carbohidratos, 0, LIMITS.MACROS_MAX),
      grasas: validateNumber(objetivos.grasas, 0, LIMITS.MACROS_MAX),
    };

    const dietista = await getCurrentDietista();
    if (!dietista) return { error: t("auth.noAutorizado") };
    if (dietista.isDemo) return { error: t("general.noDisponibleDemo") };
    if (!isAIConfigured()) return { error: t("generacionIA.apiKeysNoConfiguradas") };

    const paciente = await prisma.paciente.findFirst({
      where: { id: pacienteId, dietistaId: dietista.id },
    });
    if (!paciente) return { error: t("paciente.pacienteNoEncontrado") };

    const empresaRow = await prisma.dietista.findUnique({ where: { id: dietista.id }, select: { empresaId: true } });
    const memberIds = await getCompanyMemberIds(dietista.id, empresaRow?.empresaId ?? null);

    const [alimentosGlobales, alimentosDietista, recetas] = await Promise.all([
      getAlimentosGlobales(),
      prisma.alimento.findMany({
        where: { dietistaId: { in: memberIds }, origen: "PERSONALIZADO" },
        select: { nombre: true, categoria: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true },
        orderBy: { nombre: "asc" },
        take: 30,
      }),
      prisma.receta.findMany({
        where: { dietistaId: dietista.id },
        select: { nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true, porciones: true },
      }),
    ]);
    // Catálogo para el prompt de la IA: alimentos del nutricionista + muestreo
    // amplio de globales por categoría. Antes el prompt ignoraba la BD y usaba
    // una tabla fija de ~30 alimentos (#44). Se filtran además los incompatibles
    // con las alergias/intolerancias del paciente (no se le ofrecen a la IA).
    const restricciones = [...(paciente.alergias ?? []), ...(paciente.intolerancias ?? [])];
    const globalesPermitidos = filtrarPorRestricciones(alimentosGlobales, restricciones);
    const personalizadosPermitidos = filtrarPorRestricciones(alimentosDietista, restricciones).filter((a) => !esDePrueba(a.nombre));
    const alimentosParaPrompt = [...personalizadosPermitidos, ...muestrearGlobalesVariado(globalesPermitidos)];

    const comidas = COMIDAS_POR_NUM[numComidas] ?? COMIDAS_POR_NUM[6];

    const { plan, promptUsado } = await generateDietPlan(
      paciente,
      objetivos,
      instrucciones,
      alimentosParaPrompt,
      recetas,
      comidas
    );

    const todosAlimentos = [
      ...alimentosGlobales,
      ...await prisma.alimento.findMany({
        where: { dietistaId: { in: memberIds } },
        select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true },
      }),
    ];
    const matchCache = new Map<string, typeof todosAlimentos[0] | null>();

    function findEnMemoria(nombre: string) {
      if (matchCache.has(nombre)) return matchCache.get(nombre)!;
      const result = findAlimentoEnLista(todosAlimentos, nombre);
      matchCache.set(nombre, result);
      return result;
    }

    function recalcularMacros() {
      for (const dia of plan.dias) {
        for (const comida of dia.comidas) {
          for (const a of comida.alimentos) {
            const real = findEnMemoria(a.nombre);
            if (real) {
              a.cantidadGramos = Math.round(a.cantidadGramos / 5) * 5 || 5;
              const f = a.cantidadGramos / 100;
              a.nombre = real.nombre;
              a.estimacion = {
                calorias: Math.round(real.calorias * f),
                proteinas: Math.round(real.proteinas * f * 10) / 10,
                carbohidratos: Math.round(real.carbohidratos * f * 10) / 10,
                grasas: Math.round(real.grasas * f * 10) / 10,
              };
            }
          }
        }
      }
    }

    recalcularMacros();

    for (const dia of plan.dias) {
      const totalDia = dia.comidas.reduce((sum, c) =>
        sum + c.alimentos.reduce((s, a) => s + (a.estimacion?.calorias || 0), 0), 0);
      if (totalDia > 0 && Math.abs(totalDia - objetivos.calorias) > objetivos.calorias * 0.1) {
        const ratio = objetivos.calorias / totalDia;
        for (const comida of dia.comidas) {
          for (const a of comida.alimentos) {
            a.cantidadGramos = Math.round((a.cantidadGramos * ratio) / 5) * 5 || 5;
          }
        }
      }
    }

    recalcularMacros();

    const generacion = await prisma.generacionIA.create({
      data: {
        dietista: { connect: { id: dietista.id } },
        paciente: { connect: { id: pacienteId } },
        prompt: promptUsado,
        respuesta: JSON.parse(JSON.stringify(plan)),
      },
    });

    return { generacionId: generacion.id, plan };
  } catch (err) {
    const t = await getTranslations("validation");
    const msg = err instanceof Error ? err.message : t("general.errorDesconocido");
    return { error: t("generacionIA.errorAlGenerar", { msg }) };
  }
}

const DIAS_MAP: Record<string, DiaSemana> = {
  LUNES: "LUNES", MARTES: "MARTES", MIERCOLES: "MIERCOLES",
  JUEVES: "JUEVES", VIERNES: "VIERNES", SABADO: "SABADO", DOMINGO: "DOMINGO",
};

const COMIDAS_MAP: Record<string, TipoComida> = {
  DESAYUNO: "DESAYUNO", MEDIA_MANANA: "MEDIA_MANANA", ALMUERZO: "ALMUERZO",
  MERIENDA: "MERIENDA", CENA: "CENA", RECENA: "RECENA",
};


export async function aceptarPlanIA(
  generacionId: string,
  planId: string,
  objetivos: MacroObjetivos
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const generacion = await prisma.generacionIA.findFirst({
    where: { id: generacionId, dietistaId: dietista.id },
  });
  if (!generacion) throw new Error(t("generacionIA.generacionNoEncontrada"));

  // Obtener el plan existente con sus días y comidas
  const planExistente = await prisma.planAlimenticio.findUnique({
    where: { id: planId, dietistaId: dietista.id },
    include: {
      dias: {
        include: {
          comidas: {
            include: { alimentos: { select: { id: true } } },
          },
        },
      },
    },
  });
  if (!planExistente) throw new Error(t("plan.planNoEncontrado"));

  const planIA = generacion.respuesta as unknown as {
    dias: {
      dia: string;
      comidas: {
        tipo: string;
        descripcion?: string;
        alimentos: {
          nombre: string;
          cantidadGramos: number;
          estimacion: { calorias: number; proteinas: number; carbohidratos: number; grasas: number };
        }[];
      }[];
    }[];
  } | null;

  if (!planIA?.dias || !Array.isArray(planIA.dias)) {
    throw new Error(t("generacionIA.respuestaFormatoInvalido"));
  }

  const empresaRow2 = await prisma.dietista.findUnique({ where: { id: dietista.id }, select: { empresaId: true } });
  const memberIds2 = await getCompanyMemberIds(dietista.id, empresaRow2?.empresaId ?? null);

  const [alimentosGlobales, alimentosDietista] = await Promise.all([
    getAlimentosGlobales(),
    prisma.alimento.findMany({
      where: { dietistaId: { in: memberIds2 } },
      select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true },
    }),
  ]);
  const todosAlimentos = [...alimentosGlobales, ...alimentosDietista];

  const alimentoCache = new Map<string, string | null>();
  for (const dia of planIA.dias) {
    for (const comida of dia.comidas) {
      for (const a of comida.alimentos) {
        if (!alimentoCache.has(a.nombre)) {
          const match = findAlimentoEnLista(todosAlimentos, a.nombre);
          alimentoCache.set(a.nombre, match?.id ?? null);
        }
      }
    }
  }

  // Limpiar los alimentos existentes de todas las comidas del plan
  for (const dia of planExistente.dias) {
    for (const comida of dia.comidas) {
      if (comida.alimentos.length > 0) {
        await prisma.alimentoEnComida.deleteMany({ where: { comidaId: comida.id } });
      }
    }
  }

  // Rellenar las comidas existentes con los alimentos de la IA
  for (const diaIA of planIA.dias) {
    const diaExistente = planExistente.dias.find((d) => d.dia === (DIAS_MAP[diaIA.dia] || diaIA.dia));
    if (!diaExistente) continue;

    for (const comidaIA of diaIA.comidas) {
      const comidaExistente = diaExistente.comidas.find(
        (c) => c.tipo === (COMIDAS_MAP[comidaIA.tipo] || comidaIA.tipo)
      );
      if (!comidaExistente) continue;

      // Guardar la descripción del plato generada por la IA
      if (comidaIA.descripcion) {
        await prisma.comidaDelDia.update({
          where: { id: comidaExistente.id },
          data: { descripcion: comidaIA.descripcion },
        });
      }

      let orden = 0;
      for (const a of comidaIA.alimentos) {
        const alimentoId = alimentoCache.get(a.nombre) ?? null;
        // Solo añadir si se encontró un alimento real en la DB
        if (!alimentoId) continue;
        await prisma.alimentoEnComida.create({
          data: {
            comidaId: comidaExistente.id,
            alimentoId,
            cantidad: a.cantidadGramos,
            unidad: "GRAMOS",
            orden: orden++,
          },
        });
      }
    }
  }

  // Actualizar objetivos del plan
  await prisma.planAlimenticio.update({
    where: { id: planId },
    data: {
      caloriasObjetivo: objetivos.calorias,
      proteinasObjetivo: objetivos.proteinas,
      carbohidratosObjetivo: objetivos.carbohidratos,
      grasasObjetivo: objetivos.grasas,
    },
  });

  await prisma.generacionIA.update({
    where: { id: generacionId },
    data: { estado: "APLICADO" },
  });

  // El plan de IA rellena un plan que ya existe, y ese plan cuelga de un paciente: hay que
  // refrescar también su ficha. Sin esto, la nutricionista acepta el plan, se va a la pestaña
  // "Plan de alimentación" del paciente y sigue viendo la versión en caché SIN el plan, así que
  // parece que no se ha guardado. Reportado el 31 ago 2026: "he dado a guardar plan, estoy
  // mirando en dietas del paciente y no me aparece".
  // planes.ts revalida la ficha del paciente en 8 sitios; aquí no se hacía en ninguno.
  if (planExistente?.pacienteId) {
    revalidatePath(`/pacientes/${planExistente.pacienteId}`);
  }
  revalidatePath(`/dietas/${planId}`);
  revalidatePath("/dietas");
}
