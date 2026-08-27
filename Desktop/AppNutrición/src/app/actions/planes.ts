"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import type { PlanificacionDatos } from "./planificaciones";
import {
  filasParaDia,
  repartoParaPlani,
  esRepartoV2,
  claveComida,
  nombreNormalizado,
  renombrarFilaEnGuardado,
  ponerRepartoParaPlani,
  type RepartoPorComida,
  type RepartoGuardado,
} from "@/lib/reparto-comidas";
import { randomUUID } from "crypto";
import { expandirGruposDeDias, DIA_ORDEN_SEMANA } from "@/lib/grupos-dias";
import { ordenarComidasPorHora } from "@/lib/comida-horas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DiaSemana, TipoComida, UnidadMedida } from "@/generated/prisma/client";
import {
  sanitizeString,
  sanitizeSearch,
  validateNumber,
  validateNumberOptional,
  LIMITS,
} from "@/lib/validation";
import { esUnidadDiscreta } from "@/lib/units";
import { capitalizarNombre } from "@/lib/utils";
import { getRecomendaciones } from "./pacientes";
import type { PlanPDFData } from "@/lib/pdf/generate-plan-pdf";

/**
 * Helper: verifica que una comida pertenezca a un plan del dietista actual.
 * Devuelve el dietistaId del plan o null si no se encuentra la cadena.
 */
async function verificarPropietarioComida(
  comidaId: string,
  dietistaId: string,
  t: (key: string) => string,
): Promise<{ planId: string; pacienteId: string }> {
  const comida = await prisma.comidaDelDia.findUnique({
    where: { id: comidaId },
    include: {
      diaDelPlan: { include: { plan: { select: { dietistaId: true, pacienteId: true } } } },
    },
  });
  if (!comida || comida.diaDelPlan.plan.dietistaId !== dietistaId) {
    throw new Error(t("auth.noAutorizado"));
  }
  return { planId: comida.diaDelPlan.planId, pacienteId: comida.diaDelPlan.plan.pacienteId };
}

/** Revalida las pantallas donde se ve una comida. Sin esto, cambiar su nombre, su hora o sus notas
 *  se guardaba en la BD pero al salir y volver Next servía la página cacheada con el valor viejo:
 *  parecía que no se había guardado nada. */
function revalidarComida(planId: string, pacienteId: string) {
  revalidatePath(`/dietas/${planId}`);
  revalidatePath(`/pacientes/${pacienteId}`);
}

/**
 * Helper: verifica que un alimentoEnComida pertenezca a un plan del dietista actual.
 */
async function verificarPropietarioAlimentoEnComida(alimentoEnComidaId: string, dietistaId: string, t: (key: string) => string) {
  const item = await prisma.alimentoEnComida.findUnique({
    where: { id: alimentoEnComidaId },
    include: { comida: { include: { diaDelPlan: { include: { plan: { select: { dietistaId: true } } } } } } },
  });
  if (!item || item.comida.diaDelPlan.plan.dietistaId !== dietistaId) {
    throw new Error(t("auth.noAutorizado"));
  }
}

export interface PlanFormData {
  nombre: string;
  pacienteId: string;
  caloriasObjetivo?: number;
  proteinasObjetivo?: number;
  carbohidratosObjetivo?: number;
  grasasObjetivo?: number;
  /** #78 (bloque 2) — planificaciones que usa este plan (1 = a todo el plan; varias = elegir por día). */
  planificacionIds?: string[];
  /** #78 (bloque 2) — objetivos por planificación propios de ESTA dieta (override editable, no toca la planificación). */
  objetivosPorPlani?: Record<string, { kcal: number | null; proteinas: number | null; carbohidratos: number | null; grasas: number | null }>;
}

const DIAS: DiaSemana[] = [
  "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO",
];

const COMIDAS: TipoComida[] = [
  "DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA",
];

export async function crearPlan(data: PlanFormData) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const nombre = sanitizeString(data.nombre, LIMITS.NOMBRE);
  if (!nombre) throw new Error(t("plan.nombreObligatorio"));
  const caloriasObjetivo = data.caloriasObjetivo != null
    ? validateNumber(data.caloriasObjetivo, 0, LIMITS.CALORIAS_MAX)
    : null;
  const proteinasObjetivo = data.proteinasObjetivo != null
    ? validateNumber(data.proteinasObjetivo, 0, LIMITS.MACROS_MAX)
    : null;
  const carbohidratosObjetivo = data.carbohidratosObjetivo != null
    ? validateNumber(data.carbohidratosObjetivo, 0, LIMITS.MACROS_MAX)
    : null;
  const grasasObjetivo = data.grasasObjetivo != null
    ? validateNumber(data.grasasObjetivo, 0, LIMITS.MACROS_MAX)
    : null;

  // La nueva dieta se marca como la actual del paciente:
  // desactivar el resto antes de crear la nueva.
  await prisma.planAlimenticio.updateMany({
    where: { dietistaId: dietista.id, pacienteId: data.pacienteId, activo: true },
    data: { activo: false },
  });

  const plan = await prisma.planAlimenticio.create({
    data: {
      dietista: { connect: { id: dietista.id } },
      paciente: { connect: { id: data.pacienteId } },
      nombre,
      caloriasObjetivo,
      proteinasObjetivo,
      carbohidratosObjetivo,
      grasasObjetivo,
      activo: true,
      dias: {
        create: DIAS.map((dia) => ({
          dia,
          comidas: {
            create: COMIDAS.map((tipo, orden) => ({ tipo, orden })),
          },
        })),
      },
    },
  });

  // #78 (bloque 2) — planificaciones que usa el plan. Validar que son de este paciente/dietista.
  const planiIds = (data.planificacionIds ?? []).filter(Boolean);
  // Fuera del if: lo usa también la copia del reparto (#78-C). SOLO ids ya validados — con los
  // crudos se podría copiar el reparto de una planificación de OTRO paciente del mismo nutri.
  let idsOk: string[] = [];
  if (planiIds.length > 0) {
    const ph = planiIds.map((_, i) => `$${i + 2}`).join(",");
    const validas = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM planificaciones WHERE "pacienteId" = $1 AND "dietistaId" = $${planiIds.length + 2} AND id IN (${ph})`,
      data.pacienteId,
      ...planiIds,
      dietista.id,
    );
    // Conservar el ORDEN elegido por el nutri (el primero es el "por defecto").
    idsOk = planiIds.filter((id) => validas.some((v) => v.id === id));
    if (idsOk.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE planes_alimenticios SET "planificacionIds" = $1 WHERE id = $2`,
        idsOk,
        plan.id,
      );
      // Con varias, los días arrancan con la primera (el nutri cambia los que quiera).
      // Con una, los días usan el objetivo global del plan (no hace falta asignarla por día).
      if (idsOk.length >= 2) {
        await prisma.$executeRawUnsafe(
          `UPDATE dias_del_plan SET "planificacionId" = $1 WHERE "planId" = $2`,
          idsOk[0],
          plan.id,
        );
      }
      // Override de objetivos por planificación (solo de las válidas), si el nutri los editó al crear.
      const ov = data.objetivosPorPlani ?? {};
      const ovFiltrado: Record<string, unknown> = {};
      for (const id of idsOk) if (ov[id]) ovFiltrado[id] = ov[id];
      if (Object.keys(ovFiltrado).length > 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE planes_alimenticios SET "objetivosPorPlani" = $1::jsonb WHERE id = $2`,
          JSON.stringify(ovFiltrado),
          plan.id,
        );
      }
    }
  }

  // #78-C — El reparto por comida se COPIA en la dieta al crearla (igual que kcal y macros): así
  // cambiar el reparto en la planificación no altera las dietas ya creadas. Se copia el de la
  // planificación elegida (la primera) o, si no eligió ninguna, el de la principal del paciente.
  // Con varias planificaciones se copia el reparto de CADA una en su slot (cada día usará el de la
  // suya); `global` lleva el de la primera, que es la que arrancan usando todos los días, y es
  // además el único slot que se usa cuando la dieta tiene una sola planificación: en ese caso
  // `crearPlan` no le asigna `planificacionId` a ningún día.
  const repartoRows = await prisma.$queryRawUnsafe<{ id: string | null; reparto: unknown }[]>(
    idsOk.length > 0
      ? `SELECT id, datos->'repartoPorComida' AS reparto FROM planificaciones
         WHERE id = ANY($1::text[]) AND "dietistaId" = $2`
      : `SELECT id, datos->'repartoPorComida' AS reparto FROM planificaciones
         WHERE "pacienteId" = $1 AND "dietistaId" = $2
         ORDER BY "esDefecto" DESC, "createdAt" ASC LIMIT 1`,
    idsOk.length > 0 ? idsOk : data.pacienteId,
    dietista.id,
  );
  const porPlaniOrigen = new Map(
    repartoRows
      .filter((r) => r.id && r.reparto)
      .map((r) => [r.id as string, r.reparto as RepartoPorComida]),
  );
  // El de referencia (para `global` y para crear las comidas de la dieta) es el de la primera
  // planificación elegida, o el único que haya si no se eligió ninguna.
  const repartoOrigen =
    (idsOk.length > 0
      ? porPlaniOrigen.get(idsOk[0])
      : (repartoRows[0]?.reparto as RepartoPorComida | null)) ?? null;
  if (repartoOrigen || porPlaniOrigen.size > 0) {
    const guardado: RepartoGuardado = {
      v: 2,
      global: repartoOrigen,
      porPlani: Object.fromEntries(porPlaniOrigen),
    };
    await prisma.$executeRawUnsafe(
      `UPDATE planes_alimenticios SET "repartoPorComida" = $1::jsonb WHERE id = $2`,
      JSON.stringify(guardado),
      plan.id,
    );
  }
  if (repartoOrigen) {

    // #78-C — La planificación define la ESTRUCTURA de comidas: si el reparto está activo, la dieta
    // nace con las comidas que dice el reparto (nombres, horas y solo en los días marcados) en vez
    // de las 6 fijas de siempre. Así no hay que retocar cada dieta después de crearla.
    if (repartoOrigen.activo) {
      const dias = await prisma.diaDelPlan.findMany({
        where: { planId: plan.id },
        select: { id: true, dia: true },
      });
      const nuevas: { diaId: string; tipo: TipoComida; orden: number; nombre: string | null; hora: string | null }[] = [];
      for (const d of dias) {
        // `filasParaDia` es la regla única (la comparte la sincronización al asignar planificación).
        filasParaDia(repartoOrigen, d.dia).forEach((f, orden) => {
          nuevas.push({
            diaId: d.id,
            tipo: f.tipo as TipoComida,
            orden,
            nombre: (f.nombre ?? "").trim() || null,
            hora: /^([01]?\d|2[0-3]):[0-5]\d$/.test(f.hora ?? "") ? f.hora! : null,
          });
        });
      }
      if (nuevas.length > 0) {
        // Se rehacen las comidas de cada día según el reparto (el plan acaba de crearse: están vacías).
        await prisma.comidaDelDia.deleteMany({ where: { diaId: { in: dias.map((d) => d.id) } } });
        await prisma.comidaDelDia.createMany({ data: nuevas });
      }
    }
  }

  revalidatePath("/dietas");
  revalidatePath(`/pacientes/${data.pacienteId}`);
  // Tras crear, volver a la ficha del paciente (pestaña Plan de alimentación) en vez de al
  // menú de dietas: el nutri ve el plan nuevo en contexto del paciente y edita desde ahí.
  redirect(`/pacientes/${data.pacienteId}?pestana=plan-alimentacion`);
}

/** #78-C — Guarda (o borra, con null) el reparto por comida PROPIO de una dieta. Lo usa la propia
 *  dieta para editar su reparto (el flujo es: planificación → crear dieta → retocar en la dieta).
 *  Columna fuera del cliente Prisma → $executeRawUnsafe. */
/**
 * Guarda el reparto por comida DE UNA DIETA. Nunca toca la planificación: la dieta tiene su propia
 * copia, y lo que el nutri ajuste aquí es solo de esta dieta.
 *
 * Escribe el slot de UNA planificación (o el `global`, para los días que no tienen ninguna
 * asignada, que es el caso normal cuando la dieta usa una sola). Los demás slots se dejan como
 * estaban, así dos días con planificaciones distintas no se pisan.
 */
export async function guardarRepartoDePlan(
  planId: string,
  planificacionId: string | null,
  reparto: RepartoPorComida | null
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("general.noDisponibleDemo") };

  const filas = await prisma.$queryRawUnsafe<
    { repartoPorComida: unknown; planificacionIds: unknown; pacienteId: string }[]
  >(
    `SELECT "repartoPorComida", "planificacionIds", "pacienteId" FROM planes_alimenticios
     WHERE id = $1 AND "dietistaId" = $2`,
    planId,
    dietista.id,
  );
  if (filas.length === 0) return { ok: false, error: t("plan.planNoEncontrado") };

  const guardado = (filas[0].repartoPorComida ?? null) as RepartoGuardado | null;
  const conocidos = Array.isArray(filas[0].planificacionIds)
    ? (filas[0].planificacionIds as string[])
    : [];
  // Al pasar del formato viejo al nuevo se siembra el reparto que había en todos los slots, o los
  // días de las OTRAS planificaciones se quedarían sin el reparto que estaban usando.
  const nuevo = ponerRepartoParaPlani(guardado, planificacionId, reparto, conocidos);

  await prisma.$executeRawUnsafe(
    `UPDATE planes_alimenticios SET "repartoPorComida" = $1::jsonb, "updatedAt" = CURRENT_TIMESTAMP
     WHERE id = $2 AND "dietistaId" = $3`,
    JSON.stringify(nuevo),
    planId,
    dietista.id,
  );
  revalidatePath(`/dietas/${planId}`);
  // La ficha del paciente es donde `crearPlan` deja al nutri, así que sin esto el editor de allí
  // seguía sirviendo la página cacheada y parecía que no se había guardado nada.
  revalidatePath(`/pacientes/${filas[0].pacienteId}`);
  return { ok: true };
}

export async function actualizarPlan(id: string, data: Partial<PlanFormData>) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const updateData: Record<string, unknown> = {};
  if (data.nombre !== undefined) {
    const nombre = sanitizeString(data.nombre, LIMITS.NOMBRE);
    if (!nombre) throw new Error(t("plan.nombreObligatorio"));
    updateData.nombre = nombre;
  }
  if (data.caloriasObjetivo !== undefined) {
    updateData.caloriasObjetivo = data.caloriasObjetivo != null
      ? validateNumber(data.caloriasObjetivo, 0, LIMITS.CALORIAS_MAX)
      : null;
  }
  if (data.proteinasObjetivo !== undefined) {
    updateData.proteinasObjetivo = data.proteinasObjetivo != null
      ? validateNumber(data.proteinasObjetivo, 0, LIMITS.MACROS_MAX)
      : null;
  }
  if (data.carbohidratosObjetivo !== undefined) {
    updateData.carbohidratosObjetivo = data.carbohidratosObjetivo != null
      ? validateNumber(data.carbohidratosObjetivo, 0, LIMITS.MACROS_MAX)
      : null;
  }
  if (data.grasasObjetivo !== undefined) {
    updateData.grasasObjetivo = data.grasasObjetivo != null
      ? validateNumber(data.grasasObjetivo, 0, LIMITS.MACROS_MAX)
      : null;
  }

  await prisma.planAlimenticio.update({
    where: { id, dietistaId: dietista.id },
    data: updateData,
  });

  revalidatePath(`/dietas/${id}`);
  revalidatePath("/dietas");
}

export async function eliminarPlan(id: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  // Borrar manualmente en orden para evitar problemas de cascada con PrismaPg
  const plan = await prisma.planAlimenticio.findUnique({
    where: { id, dietistaId: dietista.id },
    include: {
      dias: {
        include: {
          comidas: {
            include: { alimentos: { select: { id: true } } },
          },
        },
      },
      enlaces: { select: { id: true } },
    },
  });

  if (!plan) throw new Error(t("plan.planNoEncontrado"));

  // Borrar alimentos en comidas
  for (const dia of plan.dias) {
    for (const comida of dia.comidas) {
      if (comida.alimentos.length > 0) {
        await prisma.alimentoEnComida.deleteMany({ where: { comidaId: comida.id } });
      }
    }
    // Borrar comidas del día
    await prisma.comidaDelDia.deleteMany({ where: { diaId: dia.id } });
  }

  // Borrar días
  await prisma.diaDelPlan.deleteMany({ where: { planId: id } });

  // Borrar enlaces compartidos
  await prisma.enlaceCompartido.deleteMany({ where: { planId: id } });

  // Borrar el plan
  await prisma.planAlimenticio.delete({ where: { id } });

  revalidatePath("/dietas");
  revalidatePath("/dashboard");
}

export async function getPlanes(busqueda?: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const search = busqueda ? sanitizeSearch(busqueda) : undefined;

  return prisma.planAlimenticio.findMany({
    where: {
      dietistaId: dietista.id,
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: "insensitive" as const } },
              { paciente: { nombre: { contains: search, mode: "insensitive" as const } } },
              { paciente: { apellidos: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    },
    select: {
      id: true, nombre: true, activo: true, createdAt: true, pacienteId: true,
      caloriasObjetivo: true, proteinasObjetivo: true, carbohidratosObjetivo: true, grasasObjetivo: true,
      paciente: { select: { nombre: true, apellidos: true, fotoUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlan(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const plan = await prisma.planAlimenticio.findUnique({
    where: { id, dietistaId: dietista.id },
    include: {
      paciente: true,
      dias: {
        orderBy: { dia: "asc" },
        include: {
          comidas: {
            orderBy: { orden: "asc" },
            include: {
              alimentos: {
                orderBy: { orden: "asc" },
                include: {
                  alimento: true,
                  receta: { include: { ingredientes: { include: { alimento: { select: { id: true, nombre: true, categoria: true, porcion: true, enlaceProducto: true, imagenUrl: true } } } } } },
                  alternativas: {
                    orderBy: { orden: "asc" },
                    include: {
                      alimento: true,
                      receta: { include: { ingredientes: { include: { alimento: { select: { id: true, nombre: true, categoria: true, porcion: true, enlaceProducto: true, imagenUrl: true } } } } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!plan) return null;

  // #78 (1B) — objetivos por día (el "tipo de día" asignado a cada día). Los días sin planificación
  // no aparecen en el mapa → el consumidor usa los objetivos globales del plan. Aditivo: no rompe nada.
  const objetivosPorDia = await getObjetivosPorDia(plan.id);

  // #75 — grupos de días (juntar): cada día lleva su grupoId; los miembros reflejan el menú del
  // representante. Inerte mientras ningún día tenga grupo. Aditivo: no rompe los consumidores.
  const dias = await expandirGruposDeDias(plan.id, plan.dias);

  // #78 (bloque 2) — planificaciones que usa este plan (columna nueva, fuera del cliente Prisma).
  // #78-C — `repartoPorComida`: copia propia de la dieta. NULL en las dietas anteriores a la
  // feature: esas siguen leyendo el reparto de la planificación (retrocompatible).
  const planiRows = await prisma.$queryRawUnsafe<{
    planificacionIds: string[] | null;
    objetivosPorPlani: Record<string, { kcal: number | null; proteinas: number | null; carbohidratos: number | null; grasas: number | null }> | null;
    repartoPorComida: RepartoGuardado | null;
  }[]>(
    `SELECT "planificacionIds", "objetivosPorPlani", "repartoPorComida" FROM planes_alimenticios WHERE id = $1`,
    plan.id,
  );
  const planificacionIds = planiRows[0]?.planificacionIds ?? [];
  const objetivosPorPlani = planiRows[0]?.objetivosPorPlani ?? {};
  const repartoPorComida = planiRows[0]?.repartoPorComida ?? null;
  return { ...plan, dias, objetivosPorDia, planificacionIds, objetivosPorPlani, repartoPorComida };
}

export async function addAlimentoAComida(
  comidaId: string,
  alimentoId: string | null,
  recetaId: string | null,
  cantidad: number,
  unidad: UnidadMedida = "GRAMOS"
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioComida(comidaId, dietista.id, t);
  cantidad = validateNumber(cantidad, 0.1, LIMITS.CANTIDAD_MAX);

  // Orden = último + 1 (no el nº de items: si se borró uno del medio, count colisionaría y el nuevo saldría en medio).
  const max = await prisma.alimentoEnComida.aggregate({ where: { comidaId }, _max: { orden: true } });

  await prisma.alimentoEnComida.create({
    data: {
      comidaId,
      alimentoId,
      recetaId,
      cantidad,
      unidad,
      orden: (max._max.orden ?? -1) + 1,
    },
  });
}

export async function removeAlimentoDeComida(alimentoEnComidaId: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioAlimentoEnComida(alimentoEnComidaId, dietista.id, t);

  await prisma.alimentoEnComida.delete({
    where: { id: alimentoEnComidaId },
  });
}

// #27 — Reordenar un alimento dentro de su comida (flechas ↑/↓): intercambia con el vecino
// y renumera consecutivo (0..n), lo que además repara huecos previos en `orden`.
export async function moverAlimentoEnComida(
  alimentoEnComidaId: string,
  dir: "up" | "down"
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioAlimentoEnComida(alimentoEnComidaId, dietista.id, t);

  const item = await prisma.alimentoEnComida.findUnique({
    where: { id: alimentoEnComidaId },
    select: { comidaId: true },
  });
  if (!item) return;

  const hermanos = await prisma.alimentoEnComida.findMany({
    where: { comidaId: item.comidaId },
    orderBy: { orden: "asc" },
    select: { id: true },
  });
  const idx = hermanos.findIndex((h) => h.id === alimentoEnComidaId);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swap < 0 || swap >= hermanos.length) return;

  const ordenados = [...hermanos];
  [ordenados[idx], ordenados[swap]] = [ordenados[swap], ordenados[idx]];

  await prisma.$transaction(
    ordenados.map((h, i) =>
      prisma.alimentoEnComida.update({ where: { id: h.id }, data: { orden: i } })
    )
  );
}

// #27 — Reordenar una comida entera por la lista de ids en el orden deseado (para el
// arrastre dentro de la comida): asigna orden = posición a cada id que pertenezca a la comida.
export async function reordenarAlimentosEnComida(comidaId: string, ids: string[]) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const comida = await prisma.comidaDelDia.findUnique({
    where: { id: comidaId },
    include: { diaDelPlan: { include: { plan: { select: { dietistaId: true } } } } },
  });
  if (!comida || comida.diaDelPlan.plan.dietistaId !== dietista.id) {
    throw new Error(t("auth.noAutorizado"));
  }

  const existentes = await prisma.alimentoEnComida.findMany({
    where: { comidaId },
    select: { id: true },
  });
  const validos = new Set(existentes.map((e) => e.id));
  const orden = ids.filter((id) => validos.has(id));
  // Cualquier id que exista en la comida pero no venga en la lista se deja al final.
  for (const e of existentes) if (!orden.includes(e.id)) orden.push(e.id);

  await prisma.$transaction(
    orden.map((id, i) =>
      prisma.alimentoEnComida.update({ where: { id }, data: { orden: i } })
    )
  );
}

export async function actualizarCantidadAlimento(
  alimentoEnComidaId: string,
  cantidad: number
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return { alternativasRecalculadas: 0 };

  await verificarPropietarioAlimentoEnComida(alimentoEnComidaId, dietista.id, t);
  cantidad = validateNumber(cantidad, 0.1, LIMITS.CANTIDAD_MAX);

  const item = await prisma.alimentoEnComida.findUnique({
    where: { id: alimentoEnComidaId },
    select: { cantidad: true, recetaId: true, unidad: true, alternativas: { select: { id: true, cantidad: true, recetaId: true } } },
  });

  // Recetas y unidades caseras van en pasos de 0,5 (nunca 1,754 porciones), venga
  // del input o de cualquier otro flujo. Los gramos/ml se dejan tal cual.
  if (item && (item.recetaId || esUnidadDiscreta(item.unidad))) {
    cantidad = Math.max(0.5, Math.round(cantidad * 2) / 2);
  }

  await prisma.alimentoEnComida.update({
    where: { id: alimentoEnComidaId },
    data: { cantidad },
  });

  // #5 — Reescalar las alternativas proporcionalmente para que sigan siendo
  // equivalentes (p. ej. principal 60→120 g ⇒ alternativa 70→140 g).
  let alternativasRecalculadas = 0;
  if (item && item.cantidad > 0 && item.alternativas.length > 0 && cantidad !== item.cantidad) {
    const factor = cantidad / item.cantidad;
    for (const alt of item.alternativas) {
      const nueva = alt.recetaId
        ? Math.max(0.5, Math.round(alt.cantidad * factor * 2) / 2) // recetas: pasos de 0,5 raciones
        : Math.max(1, Math.round(alt.cantidad * factor)); // alimentos: gramos enteros
      await prisma.alternativaAlimento.update({ where: { id: alt.id }, data: { cantidad: nueva } });
      alternativasRecalculadas++;
    }
  }

  return { alternativasRecalculadas };
}

/**
 * Guarda de golpe la revisión de equivalencias de un ítem (#5): la cantidad del
 * principal y la de cada alternativa EXACTAMENTE como las dejó el nutri en el
 * panel (sin reescalado automático — eso lo hizo ya el panel en pantalla).
 */
export async function guardarEquivalenciasItem(
  alimentoEnComidaId: string,
  cantidadPrincipal: number,
  alternativas: { id: string; cantidad: number }[],
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioAlimentoEnComida(alimentoEnComidaId, dietista.id, t);
  cantidadPrincipal = validateNumber(cantidadPrincipal, 0.1, LIMITS.CANTIDAD_MAX);

  await prisma.alimentoEnComida.update({
    where: { id: alimentoEnComidaId },
    data: { cantidad: cantidadPrincipal },
  });

  for (const alt of alternativas) {
    const cantidad = validateNumber(alt.cantidad, 0.1, LIMITS.CANTIDAD_MAX);
    // Scoped al propio ítem → no se puede tocar una alternativa ajena.
    await prisma.alternativaAlimento.updateMany({
      where: { id: alt.id, alimentoEnComidaId },
      data: { cantidad },
    });
  }
}

/**
 * Renombra (alias visual) una línea del plan o una alternativa (#5).
 * Solo presentación: NO toca macros ni el Alimento/Receta. Vacío → vuelve al nombre original.
 */
export async function renombrarItemPlan(id: string, nombre: string, esAlternativa = false) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const alias = sanitizeString(nombre, LIMITS.NOMBRE) || null;

  if (esAlternativa) {
    await verificarPropietarioAlternativa(id, dietista.id, t);
    await prisma.alternativaAlimento.update({ where: { id }, data: { nombrePersonalizado: alias } });
  } else {
    await verificarPropietarioAlimentoEnComida(id, dietista.id, t);
    await prisma.alimentoEnComida.update({ where: { id }, data: { nombrePersonalizado: alias } });
  }
}

export async function actualizarDescripcionComida(
  comidaId: string,
  descripcion: string
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const donde = await verificarPropietarioComida(comidaId, dietista.id, t);

  await prisma.comidaDelDia.update({
    where: { id: comidaId },
    data: { descripcion: descripcion.trim().slice(0, 500) || null },
  });
  revalidarComida(donde.planId, donde.pacienteId);
}

// #104 — Alias visible y hora de una comida (Fase 1). Ambos opcionales; si nombre queda
// vacío, se muestra la etiqueta del tipo. Hora se guarda como "HH:MM" (o null si no es válida).
export async function actualizarMetaComida(
  comidaId: string,
  data: { nombre?: string | null; hora?: string | null }
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const donde = await verificarPropietarioComida(comidaId, dietista.id, t);

  const patch: { nombre?: string | null; hora?: string | null } = {};
  if (data.nombre !== undefined) {
    patch.nombre = (data.nombre ?? "").trim().slice(0, 60) || null;
  }
  if (data.hora !== undefined) {
    const h = (data.hora ?? "").trim();
    patch.hora = /^([01]?\d|2[0-3]):[0-5]\d$/.test(h) ? h : null;
  }

  const actual = await prisma.comidaDelDia.findUnique({
    where: { id: comidaId },
    select: { tipo: true, nombre: true, diaId: true, diaDelPlan: { select: { planId: true } } },
  });
  if (!actual) throw new Error(t("plan.planNoEncontrado"));

  // El nombre es la IDENTIDAD de una comida propia para el reparto (`claveComida`): dos comidas con
  // el mismo nombre en un día casarían con la MISMA fila y su % se contaría dos veces, así que el día
  // repartiría más kcal de las que tiene.
  if (patch.nombre && actual.tipo === "OTRA") {
    const hermanas = await prisma.comidaDelDia.findMany({
      where: { diaId: actual.diaId, tipo: "OTRA", id: { not: comidaId } },
      select: { nombre: true },
    });
    if (hermanas.some((c) => nombreNormalizado(c.nombre) === nombreNormalizado(patch.nombre))) {
      return { error: t("plan.comidaNombreDuplicado") };
    }
  }

  await prisma.comidaDelDia.update({ where: { id: comidaId }, data: patch });

  // Renombrar también su fila en el reparto DE ESTA DIETA, o la comida se queda huérfana y el editor
  // le pinta "no está en el reparto". Solo si ninguna otra comida del plan seguía usando el nombre
  // viejo (si la comparten, la fila sigue siendo de ellas).
  if (patch.nombre !== undefined && actual.tipo === "OTRA" && patch.nombre !== actual.nombre) {
    const otras = await prisma.comidaDelDia.count({
      where: {
        diaDelPlan: { planId: actual.diaDelPlan.planId },
        tipo: "OTRA",
        id: { not: comidaId },
        nombre: actual.nombre,
      },
    });
    if (otras === 0) {
      const filas = await prisma.$queryRawUnsafe<{ repartoPorComida: unknown }[]>(
        `SELECT "repartoPorComida" FROM planes_alimenticios WHERE id = $1`,
        actual.diaDelPlan.planId,
      );
      const guardado = filas[0]?.repartoPorComida as RepartoGuardado | null;
      const nuevo = renombrarFilaEnGuardado(guardado, actual.nombre, patch.nombre);
      if (nuevo) {
        await prisma.$executeRawUnsafe(
          `UPDATE planes_alimenticios SET "repartoPorComida" = $1::jsonb WHERE id = $2`,
          JSON.stringify(nuevo),
          actual.diaDelPlan.planId,
        );
      }
    }
  }
  revalidarComida(donde.planId, donde.pacienteId);
  return { ok: true };
}

// #104 Fase 2 — Añadir una comida nueva (personalizada) a un día concreto. No afecta a los
// demás días. Se crea con tipo OTRA; se identifica por su nombre y su hora.
export async function agregarComida(
  diaId: string,
  data?: { nombre?: string; hora?: string }
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return null;

  const dia = await prisma.diaDelPlan.findUnique({
    where: { id: diaId },
    include: { plan: { select: { dietistaId: true } } },
  });
  if (!dia || dia.plan.dietistaId !== dietista.id) {
    throw new Error(t("auth.noAutorizado"));
  }

  const nombreNuevo = (data?.nombre ?? "").trim().slice(0, 60);
  if (nombreNuevo) {
    const hermanas = await prisma.comidaDelDia.findMany({
      where: { diaId, tipo: "OTRA" },
      select: { nombre: true },
    });
    if (hermanas.some((c) => nombreNormalizado(c.nombre) === nombreNormalizado(nombreNuevo))) {
      return { error: t("plan.comidaNombreDuplicado") };
    }
  }

  const max = await prisma.comidaDelDia.aggregate({ where: { diaId }, _max: { orden: true } });
  const h = (data?.hora ?? "").trim();
  const comida = await prisma.comidaDelDia.create({
    data: {
      diaId,
      tipo: "OTRA",
      orden: (max._max.orden ?? -1) + 1,
      nombre: nombreNuevo || null,
      hora: /^([01]?\d|2[0-3]):[0-5]\d$/.test(h) ? h : null,
    },
  });
  return { id: comida.id };
}

// #104 Fase 2 — Eliminar una comida de un día (sus alimentos y alternativas caen por cascade).
export async function eliminarComida(comidaId: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioComida(comidaId, dietista.id, t);
  await prisma.comidaDelDia.delete({ where: { id: comidaId } });
}

// ─────────────────────────────────────────────────────────────────────────
// Alternativas de un ítem ("avena 50 g  o  cereales 70 g") — #5
// ─────────────────────────────────────────────────────────────────────────

/**
 * Añade una alternativa equivalente (alimento o receta) a un AlimentoEnComida.
 * Es excluyente con el principal: no suma a los macros, solo da opción de elegir.
 */
export async function agregarAlternativa(
  alimentoEnComidaId: string,
  alimentoId: string | null,
  recetaId: string | null,
  cantidad: number,
  unidad: UnidadMedida = "GRAMOS",
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioAlimentoEnComida(alimentoEnComidaId, dietista.id, t);
  if (!alimentoId && !recetaId) return;
  cantidad = validateNumber(cantidad, 0.1, LIMITS.CANTIDAD_MAX);

  const count = await prisma.alternativaAlimento.count({ where: { alimentoEnComidaId } });
  await prisma.alternativaAlimento.create({
    data: { alimentoEnComidaId, alimentoId, recetaId, cantidad, unidad, orden: count },
  });
}

/** Helper: verifica que una alternativa pertenezca a un plan del dietista actual. */
async function verificarPropietarioAlternativa(alternativaId: string, dietistaId: string, t: (key: string) => string) {
  const alt = await prisma.alternativaAlimento.findUnique({
    where: { id: alternativaId },
    select: { alimentoEnComida: { select: { comida: { select: { diaDelPlan: { select: { plan: { select: { dietistaId: true } } } } } } } } },
  });
  if (!alt || alt.alimentoEnComida.comida.diaDelPlan.plan.dietistaId !== dietistaId) {
    throw new Error(t("auth.noAutorizado"));
  }
}

export async function eliminarAlternativa(alternativaId: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioAlternativa(alternativaId, dietista.id, t);
  await prisma.alternativaAlimento.delete({ where: { id: alternativaId } });
}

// #29 — Promover una alternativa a alimento principal: la alternativa elegida pasa a ser
// el alimento de la línea y se borra de la lista; las demás alternativas se conservan.
export async function promoverAlternativa(alternativaId: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioAlternativa(alternativaId, dietista.id, t);

  const alt = await prisma.alternativaAlimento.findUnique({
    where: { id: alternativaId },
    select: {
      alimentoEnComidaId: true,
      alimentoId: true,
      recetaId: true,
      cantidad: true,
      unidad: true,
      nombrePersonalizado: true,
    },
  });
  if (!alt) return;

  await prisma.$transaction([
    prisma.alimentoEnComida.update({
      where: { id: alt.alimentoEnComidaId },
      data: {
        alimentoId: alt.alimentoId,
        recetaId: alt.recetaId,
        cantidad: alt.cantidad,
        unidad: alt.unidad,
        nombrePersonalizado: alt.nombrePersonalizado,
      },
    }),
    prisma.alternativaAlimento.delete({ where: { id: alternativaId } }),
  ]);
}

// #29 — Intercambiar una alternativa con el alimento principal: la alternativa pasa a ser
// principal y el principal pasa a ocupar el hueco de esa alternativa (no se pierde ninguno).
export async function intercambiarAlternativaPrincipal(alternativaId: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioAlternativa(alternativaId, dietista.id, t);

  const alt = await prisma.alternativaAlimento.findUnique({
    where: { id: alternativaId },
    select: {
      alimentoEnComidaId: true,
      alimentoId: true,
      recetaId: true,
      cantidad: true,
      unidad: true,
      nombrePersonalizado: true,
    },
  });
  if (!alt) return;

  const principal = await prisma.alimentoEnComida.findUnique({
    where: { id: alt.alimentoEnComidaId },
    select: {
      alimentoId: true,
      recetaId: true,
      cantidad: true,
      unidad: true,
      nombrePersonalizado: true,
    },
  });
  if (!principal) return;

  await prisma.$transaction([
    prisma.alimentoEnComida.update({
      where: { id: alt.alimentoEnComidaId },
      data: {
        alimentoId: alt.alimentoId,
        recetaId: alt.recetaId,
        cantidad: alt.cantidad,
        unidad: alt.unidad,
        nombrePersonalizado: alt.nombrePersonalizado,
      },
    }),
    prisma.alternativaAlimento.update({
      where: { id: alternativaId },
      data: {
        alimentoId: principal.alimentoId,
        recetaId: principal.recetaId,
        cantidad: principal.cantidad,
        unidad: principal.unidad,
        nombrePersonalizado: principal.nombrePersonalizado,
      },
    }),
  ]);
}

export async function actualizarCantidadAlternativa(alternativaId: string, cantidad: number) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioAlternativa(alternativaId, dietista.id, t);
  cantidad = validateNumber(cantidad, 0.1, LIMITS.CANTIDAD_MAX);
  // Recetas y unidades caseras en pasos de 0,5, igual que el principal.
  const alt = await prisma.alternativaAlimento.findUnique({
    where: { id: alternativaId },
    select: { recetaId: true, unidad: true },
  });
  if (alt && (alt.recetaId || esUnidadDiscreta(alt.unidad))) {
    cantidad = Math.max(0.5, Math.round(cantidad * 2) / 2);
  }
  await prisma.alternativaAlimento.update({ where: { id: alternativaId }, data: { cantidad } });
}

/**
 * Sustituye el alimento de un AlimentoEnComida por otro (cambia alimentoId y
 * cantidad) SIN borrar la línea, para que sus alternativas se conserven (#5).
 * Eliminar el alimento (removeAlimentoDeComida) sí borra sus alternativas (cascade).
 */
export async function sustituirAlimentoEnComida(
  alimentoEnComidaId: string,
  nuevoId: string,
  cantidad: number,
  unidad: UnidadMedida = "GRAMOS",
  esReceta = false,
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioAlimentoEnComida(alimentoEnComidaId, dietista.id, t);
  cantidad = validateNumber(cantidad, 0.1, LIMITS.CANTIDAD_MAX);

  // El alias visual se limpia: es OTRO alimento/receta y el nombre antiguo ya no aplica.
  await prisma.alimentoEnComida.update({
    where: { id: alimentoEnComidaId },
    data: esReceta
      ? { recetaId: nuevoId, alimentoId: null, cantidad, unidad, nombrePersonalizado: null }
      : { alimentoId: nuevoId, recetaId: null, cantidad, unidad, nombrePersonalizado: null },
  });
}

export async function moverAlimentoAComida(
  alimentoEnComidaId: string,
  nuevaComidaId: string
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioAlimentoEnComida(alimentoEnComidaId, dietista.id, t);
  await verificarPropietarioComida(nuevaComidaId, dietista.id, t);

  const item = await prisma.alimentoEnComida.findUnique({
    where: { id: alimentoEnComidaId },
  });
  if (!item) return;
  if (item.comidaId === nuevaComidaId) return;

  const count = await prisma.alimentoEnComida.count({
    where: { comidaId: nuevaComidaId },
  });

  await prisma.alimentoEnComida.update({
    where: { id: alimentoEnComidaId },
    data: { comidaId: nuevaComidaId, orden: count },
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Copiar / mover comidas y días dentro de un plan o desde otros planes (#31)
// ─────────────────────────────────────────────────────────────────────────

export type ModoCopia = "reemplazar" | "anadir";

// Orden por defecto de cada tipo de comida (igual que en crearPlan).
const COMIDA_ORDEN: Record<TipoComida, number> = {
  DESAYUNO: 0,
  MEDIA_MANANA: 1,
  ALMUERZO: 2,
  MERIENDA: 3,
  CENA: 4,
  RECENA: 5,
  OTRA: 6,
};

/**
 * Devuelve el id de la comida equivalente en un día. Si no existe (planes antiguos, tipos que
 * faltan, o una comida propia que ese día no tiene), la crea.
 *
 * Empareja por IDENTIDAD, no solo por tipo: las 6 comidas fijas por su tipo, y las propias (OTRA)
 * por su nombre normalizado. Emparejar solo por tipo hacía que un día con dos comidas propias
 * (Pre-entreno y Snack) las fundiera en una al copiar, juntar o separar días: la segunda reutilizaba
 * la comida que había creado la primera y le sobrescribía el contenido.
 */
async function obtenerOCrearComida(
  diaId: string,
  origen: { tipo: TipoComida; nombre?: string | null; hora?: string | null },
  creadas?: { diaId: string; tipo: string; nombre: string | null; hora: string | null }[],
): Promise<string> {
  const candidatas = await prisma.comidaDelDia.findMany({
    where: { diaId, tipo: origen.tipo },
    orderBy: { orden: "asc" },
    select: { id: true, nombre: true },
  });
  const existente =
    origen.tipo === "OTRA"
      ? candidatas.find((c) => nombreNormalizado(c.nombre) === nombreNormalizado(origen.nombre))
      : candidatas[0];
  if (existente) return existente.id;

  // Nombre y hora solo se usan al CREAR: si la comida destino ya existía, su hora es la suya.
  const nueva = await prisma.comidaDelDia.create({
    data: {
      diaId,
      tipo: origen.tipo,
      orden: COMIDA_ORDEN[origen.tipo] ?? 0,
      nombre: (origen.nombre ?? "").trim() || null,
      hora: (origen.hora ?? "").trim() || null,
    },
    select: { id: true },
  });
  // Quien copia apunta las que se han creado para poder meterlas en el reparto (si está activo).
  creadas?.push({
    diaId,
    tipo: origen.tipo,
    nombre: (origen.nombre ?? "").trim() || null,
    hora: (origen.hora ?? "").trim() || null,
  });
  return nueva.id;
}

/**
 * Mete en el reparto de su dieta las comidas que se acaban de crear al copiar, AL 0%, igual que
 * cuando el nutri añade una comida a mano. Si no, la comida aparecía con "Sin objetivo en el reparto"
 * y había que ir una por una a darle cuota.
 *
 * Solo toca los slots (planificaciones) que ya tienen el reparto activo: si esa dieta no reparte por
 * comida, no se le activa nada.
 */
async function meterComidasNuevasEnReparto(
  creadas: { diaId: string; tipo: string; nombre: string | null; hora: string | null }[],
) {
  if (creadas.length === 0) return;
  const diaIds = [...new Set(creadas.map((c) => c.diaId))];
  const filas = await prisma.$queryRawUnsafe<
    { id: string; dia: string; planId: string; planificacionId: string | null }[]
  >(
    `SELECT id, dia, "planId", "planificacionId" FROM dias_del_plan WHERE id IN (${diaIds
      .map((_, i) => `$${i + 1}`)
      .join(",")})`,
    ...diaIds,
  );
  const porDia = new Map(filas.map((f) => [f.id, f]));
  const planIds = [...new Set(filas.map((f) => f.planId))];
  if (planIds.length === 0) return;

  const planes = await prisma.$queryRawUnsafe<
    { id: string; repartoPorComida: unknown; planificacionIds: unknown }[]
  >(
    `SELECT id, "repartoPorComida", "planificacionIds" FROM planes_alimenticios WHERE id IN (${planIds
      .map((_, i) => `$${i + 1}`)
      .join(",")})`,
    ...planIds,
  );

  for (const plan of planes) {
    let guardado = (plan.repartoPorComida ?? null) as RepartoGuardado | null;
    if (!guardado) continue;
    const conocidos = Array.isArray(plan.planificacionIds) ? (plan.planificacionIds as string[]) : [];
    // Agrupar por slot: cada planificación tiene su reparto y solo se toca el de los días afectados.
    const porSlot = new Map<string, { nombre: string | null; tipo: string; hora: string | null; dia: string }[]>();
    for (const c of creadas) {
      const d = porDia.get(c.diaId);
      if (!d || d.planId !== plan.id) continue;
      const slot = d.planificacionId ?? "";
      porSlot.set(slot, [...(porSlot.get(slot) ?? []), { ...c, dia: d.dia }]);
    }
    let cambiado = false;
    for (const [slot, comidas] of porSlot) {
      const reparto = repartoParaPlani(guardado, slot || null);
      if (!reparto?.activo) continue; // esa dieta no reparte por comida: no se le activa nada
      let filasReparto = reparto.comidas;
      // Agrupadas por identidad: si la misma comida se ha creado en varios días, su fila nace con
      // todos esos días (es lo que decide en qué días la creará una dieta nueva).
      const porClave = new Map<string, { tipo: string; nombre: string | null; hora: string | null; dias: Set<string> }>();
      for (const c of comidas) {
        if (c.tipo === "OTRA" && !(c.nombre ?? "").trim()) continue; // sin nombre no hay identidad
        const clave = claveComida(c);
        const prev = porClave.get(clave);
        if (prev) prev.dias.add(c.dia);
        else porClave.set(clave, { tipo: c.tipo, nombre: c.nombre, hora: c.hora, dias: new Set([c.dia]) });
      }
      for (const [clave, c] of porClave) {
        if (filasReparto.some((f) => claveComida(f) === clave)) continue;
        filasReparto = [
          ...filasReparto,
          {
            tipo: c.tipo,
            nombre: c.nombre ?? undefined,
            hora: c.hora ?? undefined,
            dias: [...c.dias],
            incluida: true,
            kcalPct: 0,
          },
        ];
        cambiado = true;
      }
      if (filasReparto !== reparto.comidas) {
        guardado = ponerRepartoParaPlani(
          guardado,
          slot || null,
          { activo: true, comidas: filasReparto },
          conocidos,
        );
      }
    }
    if (cambiado) {
      await prisma.$executeRawUnsafe(
        `UPDATE planes_alimenticios SET "repartoPorComida" = $1::jsonb WHERE id = $2`,
        JSON.stringify(guardado),
        plan.id,
      );
    }
  }
}

/** ¿Es "el mismo" alimento/receta? Mismo alimentoId + misma unidad, o misma receta. */
function mismoItem(
  a: { alimentoId: string | null; recetaId: string | null; unidad: UnidadMedida },
  b: { alimentoId: string | null; recetaId: string | null; unidad: UnidadMedida },
): boolean {
  if (a.alimentoId != null && b.alimentoId === a.alimentoId && a.unidad === b.unidad) return true;
  if (a.recetaId != null && b.recetaId === a.recetaId) return true;
  return false;
}

/**
 * Copia los alimentos de una comida origen a una comida destino.
 * - "reemplazar": vacía el destino antes de copiar (queda idéntico al origen).
 * - "anadir": fusiona con lo existente — si un alimento (mismo alimento+unidad)
 *   o receta ya está en el destino, SUMA la cantidad/porciones en vez de
 *   duplicar la línea; si no, lo añade al final.
 */
async function copiarAlimentosAComida(
  origenComidaId: string,
  destinoComidaId: string,
  modo: ModoCopia,
) {
  if (origenComidaId === destinoComidaId) return;

  const origen = await prisma.alimentoEnComida.findMany({
    where: { comidaId: origenComidaId },
    orderBy: { orden: "asc" },
    select: {
      alimentoId: true,
      recetaId: true,
      cantidad: true,
      unidad: true,
      nombrePersonalizado: true,
      // #5 — arrastrar también las alternativas ("o ...") al copiar.
      alternativas: {
        orderBy: { orden: "asc" },
        select: { alimentoId: true, recetaId: true, cantidad: true, unidad: true, nombrePersonalizado: true },
      },
    },
  });

  type AltLite = { alimentoId: string | null; recetaId: string | null; cantidad: number; unidad: UnidadMedida; nombrePersonalizado: string | null };
  // Nested create de alternativas para un AlimentoEnComida (undefined si no hay).
  const altCreate = (alts: AltLite[]) =>
    alts.length > 0
      ? { create: alts.map((alt, j) => ({ alimentoId: alt.alimentoId, recetaId: alt.recetaId, cantidad: alt.cantidad, unidad: alt.unidad, nombrePersonalizado: alt.nombrePersonalizado, orden: j })) }
      : undefined;

  if (modo === "reemplazar") {
    await prisma.alimentoEnComida.deleteMany({ where: { comidaId: destinoComidaId } });
    let orden = 0;
    for (const a of origen) {
      await prisma.alimentoEnComida.create({
        data: {
          comidaId: destinoComidaId,
          alimentoId: a.alimentoId,
          recetaId: a.recetaId,
          cantidad: a.cantidad,
          unidad: a.unidad,
          nombrePersonalizado: a.nombrePersonalizado,
          orden: orden++,
          alternativas: altCreate(a.alternativas),
        },
      });
    }
    return;
  }

  // modo "anadir": fusionar sumando cantidades cuando el item ya existe en el destino
  if (origen.length === 0) return;

  const destino = await prisma.alimentoEnComida.findMany({
    where: { comidaId: destinoComidaId },
    orderBy: { orden: "asc" },
    select: { id: true, alimentoId: true, recetaId: true, cantidad: true, unidad: true, _count: { select: { alternativas: true } } },
  });

  const incrementos = new Map<string, number>(); // id de línea destino -> cantidad a sumar
  // Item fusionado cuyo destino NO tenía alternativas → heredar las del origen (sin duplicar).
  const altsParaFusionados = new Map<string, AltLite[]>();
  const nuevos: (AltLite & { alternativas: AltLite[] })[] = [];

  for (const o of origen) {
    const enDestino = destino.find((d) => mismoItem(d, o));
    if (enDestino) {
      incrementos.set(enDestino.id, (incrementos.get(enDestino.id) ?? 0) + o.cantidad);
      if (enDestino._count.alternativas === 0 && o.alternativas.length > 0 && !altsParaFusionados.has(enDestino.id)) {
        altsParaFusionados.set(enDestino.id, o.alternativas);
      }
      continue;
    }
    const enNuevos = nuevos.find((n) => mismoItem(n, o));
    if (enNuevos) {
      enNuevos.cantidad += o.cantidad;
    } else {
      nuevos.push({ alimentoId: o.alimentoId, recetaId: o.recetaId, cantidad: o.cantidad, unidad: o.unidad, nombrePersonalizado: o.nombrePersonalizado, alternativas: o.alternativas });
    }
  }

  for (const [id, inc] of incrementos) {
    const actual = destino.find((d) => d.id === id);
    if (!actual) continue;
    await prisma.alimentoEnComida.update({
      where: { id },
      data: { cantidad: actual.cantidad + inc },
    });
  }

  // Heredar alternativas en los items fusionados que no tenían ninguna.
  for (const [destinoId, alts] of altsParaFusionados) {
    if (alts.length === 0) continue;
    await prisma.alternativaAlimento.createMany({
      data: alts.map((alt, j) => ({ alimentoEnComidaId: destinoId, alimentoId: alt.alimentoId, recetaId: alt.recetaId, cantidad: alt.cantidad, unidad: alt.unidad, nombrePersonalizado: alt.nombrePersonalizado, orden: j })),
    });
  }

  // Crear los nuevos con sus alternativas.
  let orden = destino.length;
  for (const n of nuevos) {
    await prisma.alimentoEnComida.create({
      data: {
        comidaId: destinoComidaId,
        alimentoId: n.alimentoId,
        recetaId: n.recetaId,
        cantidad: n.cantidad,
        unidad: n.unidad,
        nombrePersonalizado: n.nombrePersonalizado,
        orden: orden++,
        alternativas: altCreate(n.alternativas),
      },
    });
  }
}

/**
 * Copia una comida (con todos sus alimentos) a uno o varios días destino,
 * emparejándola con la comida del mismo tipo en cada día.
 *
 * La comida origen y los días destino pueden pertenecer al MISMO plan
 * (copiar dentro del plan) o a planes DISTINTOS del mismo dietista
 * (importar desde otro plan). Solo se valida que todo sea del dietista actual.
 */
export async function copiarComidaADias(
  comidaOrigenId: string,
  diaDestinoIds: string[],
  modo: ModoCopia = "reemplazar",
  tipoDestino?: string,
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const origen = await prisma.comidaDelDia.findUnique({
    where: { id: comidaOrigenId },
    include: { diaDelPlan: { include: { plan: { select: { dietistaId: true } } } } },
  });
  if (!origen || origen.diaDelPlan.plan.dietistaId !== dietista.id) {
    throw new Error(t("auth.noAutorizado"));
  }

  // Tipo de comida destino: el elegido (validado contra el enum) o el del origen.
  const tipo: TipoComida =
    tipoDestino && tipoDestino in COMIDA_ORDEN ? (tipoDestino as TipoComida) : origen.tipo;

  const creadas: { diaId: string; tipo: string; nombre: string | null; hora: string | null }[] = [];
  for (const diaDestinoId of diaDestinoIds) {
    // Saltar solo si sería copiar la comida sobre sí misma (mismo día y mismo tipo)
    if (diaDestinoId === origen.diaId && tipo === origen.tipo) continue;

    const dia = await prisma.diaDelPlan.findUnique({
      where: { id: diaDestinoId },
      include: { plan: { select: { dietistaId: true } } },
    });
    if (!dia || dia.plan.dietistaId !== dietista.id) continue;

    const destinoComidaId = await obtenerOCrearComida(
      diaDestinoId,
      {
        tipo,
        nombre: tipo === origen.tipo ? origen.nombre : null,
        hora: tipo === origen.tipo ? origen.hora : null,
      },
      creadas,
    );
    await copiarAlimentosAComida(comidaOrigenId, destinoComidaId, modo);

    if (modo === "reemplazar") {
      await prisma.comidaDelDia.update({
        where: { id: destinoComidaId },
        data: { descripcion: origen.descripcion },
      });
    }
  }
  // Las comidas que la copia acaba de crear entran en el reparto al 0%, como las que se añaden a mano.
  await meterComidasNuevasEnReparto(creadas);
}

/**
 * Copia un día completo (todas sus comidas con sus alimentos) a uno o varios
 * días destino, emparejando cada comida con la del mismo tipo en el destino.
 * Intra-plan o desde otro plan del mismo dietista (igual que copiarComidaADias).
 */
export async function copiarDiaADias(
  diaOrigenId: string,
  diaDestinoIds: string[],
  modo: ModoCopia = "reemplazar",
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const origen = await prisma.diaDelPlan.findUnique({
    where: { id: diaOrigenId },
    include: {
      plan: { select: { dietistaId: true } },
      comidas: {
        orderBy: { orden: "asc" },
        select: { id: true, tipo: true, descripcion: true, nombre: true, hora: true },
      },
    },
  });
  if (!origen || origen.plan.dietistaId !== dietista.id) {
    throw new Error(t("auth.noAutorizado"));
  }

  const creadas: { diaId: string; tipo: string; nombre: string | null; hora: string | null }[] = [];
  for (const diaDestinoId of diaDestinoIds) {
    if (diaDestinoId === diaOrigenId) continue;

    const dia = await prisma.diaDelPlan.findUnique({
      where: { id: diaDestinoId },
      include: { plan: { select: { dietistaId: true } } },
    });
    if (!dia || dia.plan.dietistaId !== dietista.id) continue;

    for (const comida of origen.comidas) {
      const destinoComidaId = await obtenerOCrearComida(diaDestinoId, comida, creadas);
      await copiarAlimentosAComida(comida.id, destinoComidaId, modo);
      if (modo === "reemplazar") {
        await prisma.comidaDelDia.update({
          where: { id: destinoComidaId },
          data: { descripcion: comida.descripcion },
        });
      }
    }
  }
  await meterComidasNuevasEnReparto(creadas);
}

/**
 * Pega un alimento o receta (copiado al "portapapeles" del cliente) en una
 * comida concreta. Recibe una COPIA de los datos (alimento/receta + cantidad +
 * unidad) capturada al copiar, no una referencia al origen — así la cantidad
 * pegada es siempre la original (no se corrompe si se pega sobre el propio
 * origen) y se evita una query extra para releer el origen.
 *
 * Si ese mismo alimento (mismo alimento+unidad) o receta ya está en el destino,
 * SUMA la cantidad/porciones en vez de duplicar la línea; si no, lo añade al final.
 */
export async function pegarAlimentoEnComida(
  destinoComidaId: string,
  item: { alimentoId: string | null; recetaId: string | null; cantidad: number; unidad: string },
  origenAlimentoEnComidaId?: string,
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await verificarPropietarioComida(destinoComidaId, dietista.id, t);

  if (!item.alimentoId && !item.recetaId) return;
  const cantidad = validateNumber(item.cantidad, 0.1, LIMITS.CANTIDAD_MAX);
  const snap = {
    alimentoId: item.alimentoId,
    recetaId: item.recetaId,
    unidad: item.unidad as UnidadMedida,
  };

  // #5 — alternativas y alias del alimento copiado (leídos del origen, si sigue existiendo).
  const origenItem = origenAlimentoEnComidaId
    ? await prisma.alimentoEnComida.findUnique({
        where: { id: origenAlimentoEnComidaId },
        select: {
          nombrePersonalizado: true,
          alternativas: {
            orderBy: { orden: "asc" },
            select: { alimentoId: true, recetaId: true, cantidad: true, unidad: true, nombrePersonalizado: true },
          },
        },
      })
    : null;
  const altsOrigen = origenItem?.alternativas ?? [];

  const existentes = await prisma.alimentoEnComida.findMany({
    where: { comidaId: destinoComidaId },
    select: { id: true, alimentoId: true, recetaId: true, cantidad: true, unidad: true, _count: { select: { alternativas: true } } },
  });
  const yaExiste = existentes.find((d) => mismoItem(d, snap));
  if (yaExiste) {
    await prisma.alimentoEnComida.update({
      where: { id: yaExiste.id },
      data: { cantidad: yaExiste.cantidad + cantidad },
    });
    // Heredar alternativas solo si el destino no tenía ninguna (no duplicar).
    if (yaExiste._count.alternativas === 0 && altsOrigen.length > 0) {
      await prisma.alternativaAlimento.createMany({
        data: altsOrigen.map((alt, j) => ({ alimentoEnComidaId: yaExiste.id, alimentoId: alt.alimentoId, recetaId: alt.recetaId, cantidad: alt.cantidad, unidad: alt.unidad, nombrePersonalizado: alt.nombrePersonalizado, orden: j })),
      });
    }
    return;
  }

  await prisma.alimentoEnComida.create({
    data: {
      comidaId: destinoComidaId,
      alimentoId: snap.alimentoId,
      recetaId: snap.recetaId,
      cantidad,
      unidad: snap.unidad,
      nombrePersonalizado: origenItem?.nombrePersonalizado ?? null,
      orden: existentes.length,
      alternativas: altsOrigen.length > 0
        ? { create: altsOrigen.map((alt, j) => ({ alimentoId: alt.alimentoId, recetaId: alt.recetaId, cantidad: alt.cantidad, unidad: alt.unidad, nombrePersonalizado: alt.nombrePersonalizado, orden: j })) }
        : undefined,
    },
  });
}

/**
 * Resumen ligero de un plan (días + comidas con conteo de alimentos y una
 * muestra de nombres) para el asistente de "importar desde otro plan".
 * Solo devuelve planes del dietista actual.
 */
export async function getPlanParaImportar(planId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const plan = await prisma.planAlimenticio.findUnique({
    where: { id: planId, dietistaId: dietista.id },
    select: {
      id: true,
      nombre: true,
      dias: {
        orderBy: { dia: "asc" },
        select: {
          id: true,
          dia: true,
          comidas: {
            orderBy: { orden: "asc" },
            select: {
              id: true,
              tipo: true,
              _count: { select: { alimentos: true } },
              alimentos: {
                orderBy: { orden: "asc" },
                take: 4,
                select: {
                  nombrePersonalizado: true,
                  alimento: { select: { nombre: true } },
                  receta: { select: { nombre: true } },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!plan) return null;

  return {
    id: plan.id,
    nombre: plan.nombre,
    dias: plan.dias.map((d) => ({
      id: d.id,
      dia: d.dia,
      comidas: d.comidas.map((c) => ({
        id: c.id,
        tipo: c.tipo,
        numAlimentos: c._count.alimentos,
        muestra: c.alimentos
          .map((a) => a.nombrePersonalizado || a.alimento?.nombre || a.receta?.nombre)
          .filter((n): n is string => !!n),
      })),
    })),
  };
}

export async function getPacientesParaPlan() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.paciente.findMany({
    where: { dietistaId: dietista.id, activo: true },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      fotoUrl: true,
      email: true,
      telefono: true,
      fechaNacimiento: true,
      objetivo: true,
      objetivoDetalle: true,
      peso: true,
      altura: true,
    },
    orderBy: { nombre: "asc" },
  });
}

/**
 * Devuelve contexto enriquecido de un paciente para mostrar al crear un plan:
 * - Datos del paciente
 * - Plan activo (si existe)
 * - Conteo total de planes
 * - Última medida antropométrica
 * - Próxima cita
 */
export async function getPacienteContextoPlan(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId: dietista.id },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      fotoUrl: true,
      email: true,
      telefono: true,
      fechaNacimiento: true,
      objetivo: true,
      objetivoDetalle: true,
      peso: true,
      altura: true,
    },
  });
  if (!paciente) return null;

  const ahora = new Date();
  const [planActivo, totalPlanes, ultimaMedida, proximaCita, planiRows] = await Promise.all([
    prisma.planAlimenticio.findFirst({
      where: { pacienteId, dietistaId: dietista.id, activo: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombre: true,
        caloriasObjetivo: true,
        proteinasObjetivo: true,
        carbohidratosObjetivo: true,
        grasasObjetivo: true,
        createdAt: true,
      },
    }),
    prisma.planAlimenticio.count({
      where: { pacienteId, dietistaId: dietista.id },
    }),
    prisma.medidaAntropometrica.findFirst({
      where: { pacienteId },
      orderBy: { fecha: "desc" },
      select: { fecha: true, peso: true, imc: true },
    }),
    prisma.cita.findFirst({
      where: { pacienteId, dietistaId: dietista.id, fechaHora: { gte: ahora } },
      orderBy: { fechaHora: "asc" },
      select: { id: true, fechaHora: true, motivo: true, estado: true },
    }),
    // Planificaciones del paciente con sus objetivos ya calculados (JSON): para heredarlos al crear
    // la dieta (#78-A) y para el selector "¿qué planificación uso?", en la MISMA tanda paralela.
    // $queryRawUnsafe porque el cliente Prisma local no incluye el modelo Planificacion.
    prisma.$queryRawUnsafe<
      {
        id: string;
        nombre: string;
        esDefecto: boolean;
        datos: { kcalObjetivo?: number; protGObjetivo?: number; carbGObjetivo?: number; grasaGObjetivo?: number } | null;
      }[]
    >(
      `SELECT id, nombre, "esDefecto", datos FROM planificaciones
       WHERE "pacienteId" = $1 AND "dietistaId" = $2
       ORDER BY "esDefecto" DESC, "createdAt" ASC`,
      pacienteId,
      dietista.id,
    ),
  ]);

  const numObj = (v: unknown) =>
    typeof v === "number" && isFinite(v) && v > 0 ? Math.round(v) : null;
  const planificaciones = planiRows.map((p) => ({
    planificacionId: p.id,
    nombre: p.nombre,
    esDefecto: p.esDefecto,
    kcal: numObj(p.datos?.kcalObjetivo),
    proteinas: numObj(p.datos?.protGObjetivo),
    carbohidratos: numObj(p.datos?.carbGObjetivo),
    grasas: numObj(p.datos?.grasaGObjetivo),
  }));
  // Principal (preseleccionada): la marcada por defecto o la primera (ya vienen ordenadas).
  const objetivosPlanificacion = planificaciones[0] ?? null;

  return { paciente, planActivo, totalPlanes, ultimaMedida, proximaCita, planificaciones, objetivosPlanificacion };
}

export async function getPlanesPaciente(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const planes = await prisma.planAlimenticio.findMany({
    where: { dietistaId: dietista.id, pacienteId },
    orderBy: { createdAt: "desc" },
  });
  if (planes.length === 0) return [];

  // #78 — `planificacionIds` está fuera del cliente Prisma. Se añade aquí para poder saber en qué
  // planificación se basa cada dieta (p. ej. no ofrecer aplicarle el reparto de OTRA pauta).
  const ph = planes.map((_, i) => `$${i + 1}`).join(",");
  const rows = await prisma.$queryRawUnsafe<{ id: string; planificacionIds: string[] | null }[]>(
    `SELECT id, "planificacionIds" FROM planes_alimenticios WHERE id IN (${ph})`,
    ...planes.map((p) => p.id),
  );
  const idsPorPlan = new Map(rows.map((r) => [r.id, r.planificacionIds ?? []]));
  return planes.map((p) => ({ ...p, planificacionIds: idsPorPlan.get(p.id) ?? [] }));
}

const MICRO_COLS = [
  "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
  "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
  "folato","acidoPantotenico","colina","calcio","hierro",
  "magnesio","fosforo","potasio","sodio","cinc",
  "cobre","manganeso","selenio","fluor",
] as const;

/**
 * Carga todos los planes de un paciente con datos completos (días, comidas,
 * alimentos + micronutrientes, recetas) en un mínimo de queries.
 * Reemplaza el patrón N+1 anterior (getPlan por cada plan + getMicronutrientes por cada plan).
 */
export async function getPlanesDetallePaciente(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const planesRaw = await prisma.planAlimenticio.findMany({
    where: { dietistaId: dietista.id, pacienteId },
    orderBy: { createdAt: "desc" },
    include: {
      dias: {
        orderBy: { dia: "asc" },
        include: {
          comidas: {
            orderBy: { orden: "asc" },
            include: {
              alimentos: {
                orderBy: { orden: "asc" },
                include: {
                  alimento: true,
                  receta: {
                    select: {
                      id: true, nombre: true, calorias: true, proteinas: true,
                      carbohidratos: true, grasas: true, fibra: true, porciones: true,
                      descripcion: true, dietistaId: true,
                      ingredientes: { include: { alimento: { select: { id: true, nombre: true, categoria: true, porcion: true, enlaceProducto: true, imagenUrl: true } } } },
                    },
                  },
                  alternativas: {
                    orderBy: { orden: "asc" },
                    include: {
                      alimento: { select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true, fibra: true, porcion: true } },
                      receta: {
                        select: {
                          id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true, fibra: true, porciones: true, descripcion: true,
                          ingredientes: { include: { alimento: { select: { id: true, nombre: true, categoria: true, porcion: true, enlaceProducto: true, imagenUrl: true } } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // #78-C — Reparto por comida propio de cada dieta y planificaciones que usa (columnas fuera del
  // cliente Prisma). NULL en las dietas anteriores a la feature: esas caen al de la planificación.
  const repartoRows = planesRaw.length
    ? await prisma.$queryRawUnsafe<{
        id: string;
        repartoPorComida: RepartoGuardado | null;
        planificacionIds: string[] | null;
        objetivosPorPlani: Record<string, { kcal?: number; proteinas?: number; carbohidratos?: number; grasas?: number }> | null;
      }[]>(
        `SELECT id, "repartoPorComida", "planificacionIds", "objetivosPorPlani" FROM planes_alimenticios WHERE id IN (${planesRaw
          .map((_, i) => `$${i + 1}`)
          .join(",")})`,
        ...planesRaw.map((p) => p.id),
      )
    : [];
  const extraPorPlan = new Map(repartoRows.map((r) => [r.id, r]));
  // Objetivos por día de TODAS las dietas en 2 consultas (no una por dieta).
  const objetivosPorDiaPorPlan = await getObjetivosPorDiaBatch(planesRaw.map((p) => p.id));

  // #75 — Expandir grupos: cada día miembro refleja el menú de su día representante (no sale vacío).
  const planes = await Promise.all(
    planesRaw.map(async (p) => ({
      ...p,
      repartoPorComida: extraPorPlan.get(p.id)?.repartoPorComida ?? null,
      planificacionIds: extraPorPlan.get(p.id)?.planificacionIds ?? [],
      // Override de objetivos por planificación: sin esto la ficha usaba los de la planificación en
      // crudo y /dietas/[id] el override, así que la MISMA dieta daba objetivos por comida distintos
      // según por dónde entrases.
      objetivosPorPlani: extraPorPlan.get(p.id)?.objetivosPorPlani ?? null,
      objetivosPorDia: objetivosPorDiaPorPlan[p.id] ?? {},
      dias: await expandirGruposDeDias(p.id, p.dias),
    })),
  );

  // Recoger IDs únicos de alimentos de todos los planes
  const alimentoIdSet = new Set<string>();
  const recetaIdSet = new Set<string>();
  for (const plan of planes) {
    for (const dia of plan.dias) {
      for (const comida of dia.comidas) {
        for (const a of comida.alimentos) {
          if (a.alimento?.id) alimentoIdSet.add(a.alimento.id);
          if (a.receta?.id) recetaIdSet.add(a.receta.id);
        }
      }
    }
  }

  // 1 sola query de micronutrientes para todos los planes combinados
  const microMap: Record<string, Record<string, number>> = {};
  if (alimentoIdSet.size > 0) {
    const ids = [...alimentoIdSet];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const selectCols = MICRO_COLS.map((c) => `"${c}"`).join(",");
    const rows = await prisma.$queryRawUnsafe<(Record<string, unknown> & { id: string })[]>(
      `SELECT id, ${selectCols} FROM alimentos WHERE id IN (${placeholders})`,
      ...ids,
    );
    for (const row of rows) {
      const micros: Record<string, number> = {};
      for (const col of MICRO_COLS) micros[col] = typeof row[col] === "number" ? (row[col] as number) : 0;
      microMap[row.id] = micros;
    }
  }

  // Micros de las recetas (guardados por porción, igual que sus macros) para que sumen al total del día (#90).
  const microMapReceta: Record<string, Record<string, number>> = {};
  if (recetaIdSet.size > 0) {
    const ids = [...recetaIdSet];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const selectCols = MICRO_COLS.map((c) => `"${c}"`).join(",");
    const rows = await prisma.$queryRawUnsafe<(Record<string, unknown> & { id: string })[]>(
      `SELECT id, ${selectCols} FROM recetas WHERE id IN (${placeholders})`,
      ...ids,
    );
    for (const row of rows) {
      const micros: Record<string, number> = {};
      for (const col of MICRO_COLS) micros[col] = typeof row[col] === "number" ? (row[col] as number) : 0;
      microMapReceta[row.id] = micros;
    }
  }

  // Formatear resultado
  const result = planes.map((plan) => ({
    id: plan.id,
    nombre: plan.nombre,
    caloriasObjetivo: plan.caloriasObjetivo,
    activo: plan.activo,
    proteinasObjetivo: plan.proteinasObjetivo,
    carbohidratosObjetivo: plan.carbohidratosObjetivo,
    grasasObjetivo: plan.grasasObjetivo,
    createdAt: plan.createdAt?.toISOString?.() ?? new Date(plan.createdAt).toISOString(),
    // #78-C — copia propia del reparto + planificaciones de la dieta y objetivos por día, para que
    // la ficha calcule el cumplimiento por comida IGUAL que /dietas/[id] (misma dieta, mismos números).
    repartoPorComida: plan.repartoPorComida,
    planificacionIds: plan.planificacionIds,
    objetivosPorPlani: plan.objetivosPorPlani,
    objetivosPorDia: plan.objetivosPorDia,
    dias: plan.dias.map((dia) => ({
      id: dia.id,
      dia: dia.dia,
      grupoId: dia.grupoId,
      comidas: dia.comidas.map((comida) => ({
        id: comida.id,
        tipo: comida.tipo,
        descripcion: comida.descripcion,
        nombre: comida.nombre,
        hora: comida.hora,
        alimentos: comida.alimentos.map((a) => {
          const micros = a.alimento?.id ? (microMap[a.alimento.id] || {}) : {};
          return {
            id: a.id,
            cantidad: a.cantidad,
            unidad: a.unidad,
            nombrePersonalizado: a.nombrePersonalizado ?? null,
            alimento: a.alimento
              ? {
                  id: a.alimento.id,
                  nombre: a.alimento.nombre,
                  calorias: a.alimento.calorias ?? 0,
                  proteinas: a.alimento.proteinas ?? 0,
                  carbohidratos: a.alimento.carbohidratos ?? 0,
                  grasas: a.alimento.grasas ?? 0,
                  fibra: a.alimento.fibra ?? 0,
                  porcion: a.alimento.porcion ?? 100,
                  categoria: a.alimento.categoria ?? "OTROS",
                  enlaceProducto: a.alimento.enlaceProducto ?? null,
                  imagenUrl: a.alimento.imagenUrl ?? null,
                  esPropio: !!a.alimento.dietistaId && a.alimento.dietistaId === dietista.id,
                  ...micros,
                }
              : null,
            receta: a.receta
              ? {
                  id: a.receta.id,
                  nombre: a.receta.nombre,
                  calorias: a.receta.calorias ?? 0,
                  proteinas: a.receta.proteinas ?? 0,
                  carbohidratos: a.receta.carbohidratos ?? 0,
                  grasas: a.receta.grasas ?? 0,
                  fibra: a.receta.fibra ?? 0,
                  porciones: a.receta.porciones ?? 1,
                  descripcion: a.receta.descripcion ?? null,
                  ingredientes: a.receta.ingredientes?.map((i) => ({ nombre: i.alimento.nombre, cantidad: i.cantidad, unidad: i.unidad })) ?? [],
                  ...(microMapReceta[a.receta.id] || {}),
                  esPropio: !!a.receta.dietistaId && a.receta.dietistaId === dietista.id,
                }
              : null,
            alternativas: (a.alternativas ?? []).map((alt) => ({
              id: alt.id,
              nombre: alt.nombrePersonalizado || alt.alimento?.nombre || alt.receta?.nombre || "",
              cantidad: alt.cantidad,
              unidad: alt.unidad,
              esReceta: !!alt.receta,
              realId: alt.alimento?.id || alt.receta?.id || null,
              calorias: alt.alimento?.calorias ?? alt.receta?.calorias ?? 0,
              proteinas: alt.alimento?.proteinas ?? alt.receta?.proteinas ?? 0,
              carbohidratos: alt.alimento?.carbohidratos ?? alt.receta?.carbohidratos ?? 0,
              grasas: alt.alimento?.grasas ?? alt.receta?.grasas ?? 0,
              fibra: alt.alimento?.fibra ?? alt.receta?.fibra ?? 0,
              porcion: alt.alimento?.porcion ?? 100,
              recetaPorciones: alt.receta?.porciones ?? undefined,
              recetaDescripcion: alt.receta?.descripcion ?? null,
              recetaIngredientes: alt.receta?.ingredientes?.map((i) => ({ nombre: i.alimento.nombre, cantidad: i.cantidad, unidad: i.unidad })) ?? undefined,
            })),
          };
        }),
      })),
    })),
  }));

  return JSON.parse(JSON.stringify(result));
}

/**
 * Marca un plan como "actual" (activo) para el paciente actual,
 * desactivando el resto de planes del mismo paciente.
 */
export async function asignarPlanComoActual(planId: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const plan = await prisma.planAlimenticio.findUnique({
    where: { id: planId },
    select: { id: true, pacienteId: true, dietistaId: true },
  });

  if (!plan || plan.dietistaId !== dietista.id) throw new Error(t("auth.noAutorizado"));

  await prisma.$transaction([
    prisma.planAlimenticio.updateMany({
      where: { dietistaId: dietista.id, pacienteId: plan.pacienteId, activo: true },
      data: { activo: false },
    }),
    prisma.planAlimenticio.update({
      where: { id: planId, dietistaId: dietista.id },
      data: { activo: true },
    }),
  ]);

  revalidatePath(`/pacientes/${plan.pacienteId}`);
  revalidatePath(`/pacientes/${plan.pacienteId}?pestana=plan-alimentacion`);
}

// ─────────────────────────────────────────────────────────────────────────
// Planificación por tipo de día — #78 (1B)
// Cada día del plan puede asignarse a una Planificacion ("tipo de día": descanso, competición,
// entreno…), de la que hereda sus objetivos kcal/macros. Sin asignar = objetivos globales del plan.
// La columna dias_del_plan."planificacionId" no está en el cliente Prisma local → SQL crudo.
// ─────────────────────────────────────────────────────────────────────────

export type ObjetivosDia = {
  planificacionId: string;
  nombre: string;
  kcal: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
};

/** Asigna (o quita, con `null`) el "tipo de día" (planificación) de UN día del plan.
 *  Verifica que el día es de este dietista y que la planificación es del mismo paciente. */
export async function asignarPlanificacionADia(
  diaId: string,
  planificacionId: string | null,
) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  // El día debe pertenecer a un plan de este dietista.
  const dia = await prisma.diaDelPlan.findUnique({
    where: { id: diaId },
    select: { id: true, planId: true, plan: { select: { dietistaId: true, pacienteId: true } } },
  });
  if (!dia || dia.plan.dietistaId !== dietista.id) throw new Error(t("auth.noAutorizado"));

  // Si se asigna una planificación, debe ser del MISMO paciente del plan (y de este dietista).
  if (planificacionId) {
    const ok = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM planificaciones WHERE id = $1 AND "pacienteId" = $2 AND "dietistaId" = $3 LIMIT 1`,
      planificacionId,
      dia.plan.pacienteId,
      dietista.id,
    );
    if (ok.length === 0) throw new Error(t("auth.noAutorizado"));
  }

  // UPDATE acotado a ESE día (nunca masivo).
  await prisma.$executeRawUnsafe(
    `UPDATE dias_del_plan SET "planificacionId" = $1 WHERE id = $2`,
    planificacionId,
    diaId,
  );

  // Si esta dieta no tenía todavía reparto para esa planificación, se le siembra una COPIA del de la
  // planificación: a partir de ahí es de la dieta y editarlo aquí no vuelve a la pauta. Sin esto, el
  // día se quedaba sin objetivos por comida hasta que alguien abriera el panel.
  let repartoSlot: RepartoPorComida | null = null;
  if (planificacionId) {
    const filas = await prisma.$queryRawUnsafe<{ repartoPorComida: unknown; planificacionIds: unknown }[]>(
      `SELECT "repartoPorComida", "planificacionIds" FROM planes_alimenticios WHERE id = $1`,
      dia.planId,
    );
    const guardado = (filas[0]?.repartoPorComida ?? null) as RepartoGuardado | null;
    repartoSlot = repartoParaPlani(guardado, planificacionId);
    const tieneSlot = !!guardado && esRepartoV2(guardado) && !!guardado.porPlani?.[planificacionId];
    if (!tieneSlot) {
      const dePlani = await prisma.$queryRawUnsafe<{ reparto: unknown }[]>(
        `SELECT datos->'repartoPorComida' AS reparto FROM planificaciones WHERE id = $1`,
        planificacionId,
      );
      const semilla = (dePlani[0]?.reparto ?? null) as RepartoPorComida | null;
      if (semilla) {
        const conocidos = Array.isArray(filas[0]?.planificacionIds)
          ? (filas[0].planificacionIds as string[])
          : [];
        await prisma.$executeRawUnsafe(
          `UPDATE planes_alimenticios SET "repartoPorComida" = $1::jsonb WHERE id = $2`,
          JSON.stringify(ponerRepartoParaPlani(guardado, planificacionId, semilla, conocidos)),
          dia.planId,
        );
        repartoSlot = semilla;
      }
    }
  }

  revalidatePath(`/dietas/${dia.planId}`);
  revalidatePath(`/pacientes/${dia.plan.pacienteId}`);
  revalidatePath(`/pacientes/${dia.plan.pacienteId}?pestana=plan-alimentacion`);
  return { ok: true, reparto: repartoSlot };
}

/**
 * #78-C/#104 — Crea en un día las comidas que su reparto prevé y todavía no existen.
 *
 * SOLO CREA: nunca borra nada. Quitar comidas automáticamente al cambiar de planificación se
 * llevaría por delante un pre-entreno con alimentos dentro (y `eliminarComida` borra en cascada),
 * así que lo que sobra se pregunta en la pantalla, no aquí.
 *
 * Idempotente: empareja por identidad (`claveComida`), así que llamarla dos veces no duplica nada.
 * Trabaja sobre el día REPRESENTANTE del grupo (#75): las comidas de un grupo viven solo ahí, y una
 * comida creada en un día miembro no se vería y se perdería al reagrupar.
 */
export async function sincronizarComidasDeDia(
  diaId: string,
): Promise<{ ok: boolean; creadas?: string[]; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: true, creadas: [] };

  const dia = await prisma.diaDelPlan.findUnique({
    where: { id: diaId },
    select: { id: true, dia: true, planId: true, plan: { select: { dietistaId: true, pacienteId: true } } },
  });
  if (!dia || dia.plan.dietistaId !== dietista.id) return { ok: false, error: t("auth.noAutorizado") };

  // Día representante y planificación asignada (columnas fuera del cliente Prisma).
  const filas = await prisma.$queryRawUnsafe<{ id: string; dia: string; grupoId: string | null; planificacionId: string | null }[]>(
    `SELECT id, dia, "grupoId", "planificacionId" FROM dias_del_plan WHERE "planId" = $1`,
    dia.planId,
  );
  const esta = filas.find((f) => f.id === diaId);
  let objetivo = esta;
  if (esta?.grupoId) {
    const delGrupo = filas.filter((f) => f.grupoId === esta.grupoId);
    objetivo = [...delGrupo].sort(
      (a, b) => DIA_ORDEN_SEMANA.indexOf(a.dia) - DIA_ORDEN_SEMANA.indexOf(b.dia),
    )[0];
  }
  if (!objetivo) return { ok: false, error: t("plan.planNoEncontrado") };

  const planRows = await prisma.$queryRawUnsafe<{ repartoPorComida: unknown }[]>(
    `SELECT "repartoPorComida" FROM planes_alimenticios WHERE id = $1`,
    dia.planId,
  );
  const reparto = repartoParaPlani(
    (planRows[0]?.repartoPorComida ?? null) as RepartoGuardado | null,
    objetivo.planificacionId,
  );
  const previstas = filasParaDia(reparto, objetivo.dia);
  if (previstas.length === 0) return { ok: true, creadas: [] };

  const existentes = await prisma.comidaDelDia.findMany({
    where: { diaId: objetivo.id },
    select: { id: true, tipo: true, nombre: true, hora: true },
  });
  const yaEstan = new Set(existentes.map((c) => claveComida(c)));
  const aCrear = previstas.filter((f) => !yaEstan.has(claveComida(f)));
  if (aCrear.length === 0) return { ok: true, creadas: [] };

  await prisma.comidaDelDia.createMany({
    data: aCrear.map((f) => ({
      diaId: objetivo!.id,
      tipo: f.tipo as TipoComida,
      orden: 0, // se renumera justo después, por hora
      nombre: (f.nombre ?? "").trim() || null,
      hora: /^([01]?\d|2[0-3]):[0-5]\d$/.test(f.hora ?? "") ? f.hora! : null,
    })),
  });

  // Renumerar `orden` por hora efectiva: el portal del paciente y el PDF ordenan por `orden`, así
  // que sin esto las comidas nuevas salían al final, fuera de su sitio en el día.
  const todas = await prisma.comidaDelDia.findMany({
    where: { diaId: objetivo.id },
    select: { id: true, tipo: true, hora: true },
  });
  const ordenadas = ordenarComidasPorHora(todas);
  for (let i = 0; i < ordenadas.length; i++) {
    await prisma.comidaDelDia.update({ where: { id: ordenadas[i].id }, data: { orden: i } });
  }

  revalidatePath(`/dietas/${dia.planId}`);
  revalidatePath(`/pacientes/${dia.plan.pacienteId}`);
  return { ok: true, creadas: aCrear.map((f) => (f.nombre ?? "").trim() || f.tipo) };
}

/** Objetivos por día de un plan: para cada día CON "tipo de día" asignado, los objetivos
 *  kcal/macros de esa planificación (leídos de su JSON `datos`). Los días sin asignar no salen
 *  en el mapa → el consumidor cae a los objetivos globales del plan. */
export async function getObjetivosPorDia(planId: string): Promise<Record<string, ObjetivosDia>> {
  return (await getObjetivosPorDiaBatch([planId]))[planId] ?? {};
}

/** Igual que getObjetivosPorDia pero para VARIOS planes con 2 consultas en total (la ficha del
 *  paciente carga todas las dietas: una llamada por dieta sería un N+1). Devuelve planId → días. */
export async function getObjetivosPorDiaBatch(
  planIds: string[]
): Promise<Record<string, Record<string, ObjetivosDia>>> {
  if (planIds.length === 0) return {};
  const ph = planIds.map((_, i) => `$${i + 1}`).join(",");

  // Override por planificación propio de cada plan (editado al crear; vale solo para esa dieta).
  const planRows = await prisma.$queryRawUnsafe<
    { id: string; objetivosPorPlani: Record<string, { kcal?: number | null; proteinas?: number | null; carbohidratos?: number | null; grasas?: number | null }> | null }[]
  >(`SELECT id, "objetivosPorPlani" FROM planes_alimenticios WHERE id IN (${ph})`, ...planIds);
  const overridePorPlan = new Map(planRows.map((r) => [r.id, r.objetivosPorPlani ?? {}]));

  const rows = await prisma.$queryRawUnsafe<
    { planId: string; diaId: string; planificacionId: string; nombre: string; datos: PlanificacionDatos | null }[]
  >(
    `SELECT d."planId", d.id AS "diaId", d."planificacionId", p.nombre, p.datos
     FROM dias_del_plan d
     JOIN planificaciones p ON p.id = d."planificacionId"
     WHERE d."planId" IN (${ph})`,
    ...planIds,
  );

  const num = (v: unknown) =>
    typeof v === "number" && isFinite(v) && v > 0 ? Math.round(v) : null;

  const out: Record<string, Record<string, ObjetivosDia>> = {};
  for (const id of planIds) out[id] = {};
  for (const r of rows) {
    const ov = (overridePorPlan.get(r.planId) ?? {})[r.planificacionId];
    const d = r.datos ?? {};
    (out[r.planId] ??= {})[r.diaId] = ov
      ? {
          planificacionId: r.planificacionId,
          nombre: r.nombre,
          kcal: num(ov.kcal),
          proteinas: num(ov.proteinas),
          carbohidratos: num(ov.carbohidratos),
          grasas: num(ov.grasas),
        }
      : {
          planificacionId: r.planificacionId,
          nombre: r.nombre,
          kcal: num(d.kcalObjetivo),
          proteinas: num(d.protGObjetivo),
          carbohidratos: num(d.carbGObjetivo),
          grasas: num(d.grasaGObjetivo),
        };
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────────
// Juntar días — #75
// Días que "comen igual" comparten menú: se etiquetan con un grupoId común y el día representante
// (menor orden de semana) guarda las comidas reales; los demás reflejan ese menú (ver
// expandirGruposDeDias). La columna grupoId está fuera del cliente Prisma → SQL crudo.
// ─────────────────────────────────────────────────────────────────────────

/** Junta varios días del plan en un grupo que comparte menú. El representante (menor orden de
 *  semana) conserva su menú; los demás lo PIERDEN y pasan a reflejar el del representante.
 *  El editor avisa antes de llamar (los días miembro pierden su menú actual). */
export async function juntarDias(planId: string, diaIds: string[]) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;
  if (diaIds.length < 2) return;

  // Los días deben ser de ESTE plan y de este dietista.
  const dias = await prisma.diaDelPlan.findMany({
    where: { id: { in: diaIds }, planId, plan: { dietistaId: dietista.id } },
    select: { id: true, dia: true },
  });
  if (dias.length < 2) throw new Error(t("auth.noAutorizado"));

  // Representante = el día de menor orden de semana (donde viven las comidas físicas del grupo).
  const rep = [...dias].sort(
    (a, b) => DIA_ORDEN_SEMANA.indexOf(a.dia) - DIA_ORDEN_SEMANA.indexOf(b.dia),
  )[0];
  const grupoId = randomUUID();
  const ids = dias.map((d) => d.id);
  const miembros = ids.filter((id) => id !== rep.id);

  // El menú que GANA es el del día de ORIGEN (desde el que se pulsó "Juntar con…" = diaIds[0]).
  // Si ese día no es el representante, copiamos su menú al representante para que sea el que
  // se refleje en todo el grupo (así "manda" el día desde el que juntas, no el más temprano).
  const origenId = ids.includes(diaIds[0]) ? diaIds[0] : rep.id;
  if (origenId !== rep.id) {
    await copiarDiaADias(origenId, [rep.id], "reemplazar");
  }

  // 1) Etiquetar todos los días con el mismo grupoId (IN con placeholders, patrón del proyecto).
  const ph = ids.map((_, i) => `$${i + 2}`).join(",");
  await prisma.$executeRawUnsafe(
    `UPDATE dias_del_plan SET "grupoId" = $1 WHERE id IN (${ph})`,
    grupoId,
    ...ids,
  );
  // 1b) La planificación del día de ORIGEN manda en TODO el grupo (comen igual → mismo objetivo).
  //     Al separar, cada día conserva esta planificación (separarDia no toca planificacionId).
  const origenPlaniRows = await prisma.$queryRawUnsafe<{ planificacionId: string | null }[]>(
    `SELECT "planificacionId" FROM dias_del_plan WHERE id = $1`,
    origenId,
  );
  await prisma.$executeRawUnsafe(
    `UPDATE dias_del_plan SET "planificacionId" = $1 WHERE id IN (${ph})`,
    origenPlaniRows[0]?.planificacionId ?? null,
    ...ids,
  );
  // 2) Vaciar el menú de los miembros (reflejarán el del representante en lectura).
  if (miembros.length > 0) {
    await prisma.comidaDelDia.deleteMany({ where: { diaId: { in: miembros } } });
  }

  revalidatePath(`/dietas/${planId}`);
}

/** Saca un día de su grupo dándole una COPIA propia del menú (no pierde nada). Si el día era el
 *  representante, el grupo restante recibe una copia del menú en su nuevo representante. Si el
 *  grupo queda con un solo día, se deshace (un día suelto no es grupo). */
export async function separarDia(diaId: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  // grupoId + plan del día, validando que es de este dietista.
  const filaRows = await prisma.$queryRawUnsafe<{ grupoId: string | null; planId: string }[]>(
    `SELECT d."grupoId", d."planId"
       FROM dias_del_plan d
       JOIN planes_alimenticios p ON p.id = d."planId"
      WHERE d.id = $1 AND p."dietistaId" = $2`,
    diaId,
    dietista.id,
  );
  const fila = filaRows[0];
  if (!fila) throw new Error(t("auth.noAutorizado"));
  if (!fila.grupoId) return; // no estaba en ningún grupo

  const grupoRows = await prisma.$queryRawUnsafe<{ id: string; dia: string }[]>(
    `SELECT id, dia FROM dias_del_plan WHERE "grupoId" = $1`,
    fila.grupoId,
  );
  const ordenados = [...grupoRows].sort(
    (a, b) => DIA_ORDEN_SEMANA.indexOf(a.dia) - DIA_ORDEN_SEMANA.indexOf(b.dia),
  );
  const repActual = ordenados[0];
  const restantes = ordenados.filter((d) => d.id !== diaId);

  if (diaId !== repActual.id) {
    // MIEMBRO: copiar el menú del representante a este día (estaba vacío) y sacarlo del grupo.
    await copiarDiaADias(repActual.id, [diaId], "reemplazar");
    await prisma.$executeRawUnsafe(`UPDATE dias_del_plan SET "grupoId" = NULL WHERE id = $1`, diaId);
  } else {
    // REPRESENTANTE: se lleva las comidas físicas; el grupo restante recibe una copia en su nuevo rep.
    const nuevoRep = restantes[0];
    if (nuevoRep) await copiarDiaADias(repActual.id, [nuevoRep.id], "reemplazar");
    await prisma.$executeRawUnsafe(`UPDATE dias_del_plan SET "grupoId" = NULL WHERE id = $1`, diaId);
  }

  // Un grupo de un solo día no es grupo: deshacerlo.
  if (restantes.length <= 1) {
    await prisma.$executeRawUnsafe(`UPDATE dias_del_plan SET "grupoId" = NULL WHERE "grupoId" = $1`, fila.grupoId);
  }

  revalidatePath(`/dietas/${fila.planId}`);
}

/** Deshace un grupo ENTERO: cada día miembro recibe una COPIA propia del menú (el del representante)
 *  y todos quedan sueltos. No se pierde nada (el representante ya tenía el menú; los demás lo copian). */
export async function deshacerGrupo(diaId: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const filaRows = await prisma.$queryRawUnsafe<{ grupoId: string | null; planId: string }[]>(
    `SELECT d."grupoId", d."planId"
       FROM dias_del_plan d
       JOIN planes_alimenticios p ON p.id = d."planId"
      WHERE d.id = $1 AND p."dietistaId" = $2`,
    diaId,
    dietista.id,
  );
  const fila = filaRows[0];
  if (!fila) throw new Error(t("auth.noAutorizado"));
  if (!fila.grupoId) return;

  const grupoRows = await prisma.$queryRawUnsafe<{ id: string; dia: string }[]>(
    `SELECT id, dia FROM dias_del_plan WHERE "grupoId" = $1`,
    fila.grupoId,
  );
  const ordenados = [...grupoRows].sort(
    (a, b) => DIA_ORDEN_SEMANA.indexOf(a.dia) - DIA_ORDEN_SEMANA.indexOf(b.dia),
  );
  const rep = ordenados[0];
  const miembros = ordenados.filter((d) => d.id !== rep.id).map((d) => d.id);

  // Cada miembro recibe su propia copia del menú del representante.
  if (miembros.length > 0) await copiarDiaADias(rep.id, miembros, "reemplazar");
  // Todos quedan sueltos.
  await prisma.$executeRawUnsafe(`UPDATE dias_del_plan SET "grupoId" = NULL WHERE "grupoId" = $1`, fila.grupoId);

  revalidatePath(`/dietas/${fila.planId}`);
}

export async function guardarComoPlantilla(planId: string, nombre: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  nombre = sanitizeString(nombre, LIMITS.NOMBRE);
  if (!nombre) throw new Error(t("plan.nombreObligatorio"));

  const plan = await getPlan(planId);
  if (!plan) throw new Error(t("plan.planNoEncontrado"));

  const datos = plan.dias.map((dia) => ({
    dia: dia.dia,
    comidas: dia.comidas.map((comida) => ({
      tipo: comida.tipo,
      alimentos: comida.alimentos.map((a) => ({
        alimentoId: a.alimentoId,
        recetaId: a.recetaId,
        cantidad: a.cantidad,
        unidad: a.unidad,
        // #5 — conservar alias y alternativas al guardar como plantilla.
        nombrePersonalizado: a.nombrePersonalizado ?? null,
        alternativas: (a.alternativas ?? []).map((alt) => ({
          alimentoId: alt.alimentoId,
          recetaId: alt.recetaId,
          cantidad: alt.cantidad,
          unidad: alt.unidad,
          nombrePersonalizado: alt.nombrePersonalizado ?? null,
        })),
      })),
    })),
  }));

  const plantilla = await prisma.plantilla.create({
    data: {
      dietista: { connect: { id: dietista.id } },
      nombre,
      datos: JSON.parse(JSON.stringify(datos)),
    },
  });

  revalidatePath("/dietas");
  return plantilla;
}

/**
 * Returns everything needed to render the PDF on the client.
 */
export async function getPlanPDFData(planId: string): Promise<PlanPDFData | null> {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const plan = await getPlan(planId);
  if (!plan) return null;

  const recomendaciones = await getRecomendaciones(plan.pacienteId);

  const { getTheme } = await import("@/lib/pdf/pdf-themes");
  const tema = getTheme(dietista.temaPdf, dietista.colorPrimarioPdf);

  return {
    planNombre: plan.nombre,
    pacienteNombre: `${capitalizarNombre(plan.paciente.nombre)} ${capitalizarNombre(plan.paciente.apellidos)}`,
    dietistaNombre: `${dietista.nombre} ${dietista.apellidos}`,
    tema,
    brandName: dietista.marcaPdf || undefined,
    logoDataUrl: dietista.pdfLogoUrl || undefined,
    clinica: dietista.clinica || undefined,
    dias: plan.dias.map((dia) => ({
      dia: dia.dia,
      comidas: dia.comidas.map((comida) => ({
        id: comida.id,
        tipo: comida.tipo,
        descripcion: comida.descripcion,
        nombre: comida.nombre,
        hora: comida.hora,
        alimentos: comida.alimentos.map((a) => ({
          cantidad: a.cantidad,
          unidad: a.unidad,
          alimento: a.alimento
            ? {
                id: a.alimento.id,
                // El PDF muestra el alias visual si el nutri renombró la línea (#5).
                nombre: a.nombrePersonalizado || a.alimento.nombre,
                categoria: a.alimento.categoria ?? "OTROS",
                calorias: a.alimento.calorias ?? 0,
                proteinas: a.alimento.proteinas ?? 0,
                carbohidratos: a.alimento.carbohidratos ?? 0,
                grasas: a.alimento.grasas ?? 0,
                fibra: a.alimento.fibra ?? 0,
                porcion: a.alimento.porcion ?? 100,
                enlaceProducto: a.alimento.enlaceProducto ?? null,
                imagenUrl: a.alimento.imagenUrl ?? null,
              }
            : null,
          receta: a.receta
            ? {
                id: a.receta.id,
                nombre: a.nombrePersonalizado || a.receta.nombre,
                descripcion: a.receta.descripcion,
                instrucciones: a.receta.instrucciones,
                porciones: a.receta.porciones ?? 1,
                calorias: a.receta.calorias ?? 0,
                proteinas: a.receta.proteinas ?? 0,
                carbohidratos: a.receta.carbohidratos ?? 0,
                grasas: a.receta.grasas ?? 0,
                ingredientes: (a.receta.ingredientes ?? []).map((i) => ({
                  // id + categoría: la lista de la compra desglosa la receta y la ordena por sección.
                  alimento: { id: i.alimento.id, nombre: i.alimento.nombre, categoria: i.alimento.categoria, porcion: i.alimento.porcion, enlaceProducto: i.alimento.enlaceProducto, imagenUrl: i.alimento.imagenUrl },
                  cantidad: i.cantidad,
                  unidad: i.unidad,
                })),
              }
            : null,
          alternativas: (a.alternativas ?? []).map((alt) => ({
            nombre: alt.nombrePersonalizado || alt.alimento?.nombre || alt.receta?.nombre || "",
            cantidad: alt.cantidad,
            unidad: alt.unidad,
            esReceta: !!alt.receta,
          })),
        })),
      })),
    })),
    recomendaciones,
    caloriasObjetivo: plan.caloriasObjetivo,
  };
}
