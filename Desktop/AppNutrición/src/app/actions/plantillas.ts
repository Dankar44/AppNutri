"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DiaSemana, TipoComida, UnidadMedida } from "@/generated/prisma/client";
import { sanitizeString, sanitizeSearch, LIMITS } from "@/lib/validation";
import { getTranslations } from "next-intl/server";

interface PlantillaAlternativa {
  alimentoId: string | null;
  recetaId: string | null;
  cantidad: number;
  unidad: UnidadMedida;
  nombrePersonalizado?: string | null;
}

interface PlantillaDia {
  dia: DiaSemana;
  comidas: {
    tipo: TipoComida;
    alimentos: {
      alimentoId: string | null;
      recetaId: string | null;
      cantidad: number;
      unidad: UnidadMedida;
      /// Alias visual (#5). Plantillas antiguas no lo tienen.
      nombrePersonalizado?: string | null;
      /// Alternativas "o ..." (#5). Plantillas antiguas no lo tienen.
      alternativas?: PlantillaAlternativa[];
    }[];
  }[];
}

export async function getPlantillas(busqueda?: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const search = busqueda ? sanitizeSearch(busqueda) : undefined;

  return prisma.plantilla.findMany({
    where: {
      dietistaId: dietista.id,
      ...(search ? { nombre: { contains: search, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlantillaDetalle(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const plantilla = await prisma.plantilla.findUnique({
    where: { id, dietistaId: dietista.id },
  });
  if (!plantilla) return null;

  const datos = (plantilla.datos as unknown as PlantillaDia[]) || [];

  const alimentoIds = new Set<string>();
  const recetaIds = new Set<string>();
  for (const dia of datos) {
    for (const comida of dia.comidas) {
      for (const a of comida.alimentos) {
        if (a.alimentoId) alimentoIds.add(a.alimentoId);
        if (a.recetaId) recetaIds.add(a.recetaId);
      }
    }
  }

  const [alimentosDB, recetasDB] = await Promise.all([
    alimentoIds.size > 0
      ? prisma.alimento.findMany({
          where: { id: { in: [...alimentoIds] } },
          select: {
            id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true,
            grasas: true, fibra: true, porcion: true, unidad: true, categoria: true, enlaceProducto: true, imagenUrl: true,
            vitaminaA: true, vitaminaB6: true, vitaminaB12: true, vitaminaC: true, vitaminaD: true,
            vitaminaE: true, vitaminaK: true, tiamina: true, riboflavina: true, niacina: true,
            folato: true, acidoPantotenico: true, colina: true, calcio: true, hierro: true,
            magnesio: true, fosforo: true, potasio: true, sodio: true, cinc: true,
            cobre: true, manganeso: true, selenio: true, fluor: true,
          },
        })
      : [],
    recetaIds.size > 0
      ? prisma.receta.findMany({
          where: { id: { in: [...recetaIds] } },
          select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true, fibra: true, porciones: true },
        })
      : [],
  ]);

  const alimentosMap = Object.fromEntries(alimentosDB.map((a) => [a.id, a]));
  const recetasMap = Object.fromEntries(recetasDB.map((r) => [r.id, r]));

  return {
    id: plantilla.id,
    nombre: plantilla.nombre,
    createdAt: plantilla.createdAt,
    datos,
    alimentosMap,
    recetasMap,
  };
}

export async function actualizarDatosPlantilla(id: string, datos: PlantillaDia[]) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: true };

  await prisma.plantilla.update({
    where: { id, dietistaId: dietista.id },
    data: { datos: JSON.parse(JSON.stringify(datos)) },
  });

  revalidatePath("/dietas/plantillas");
  revalidatePath(`/dietas/plantillas/${id}`);
  return { ok: true };
}

export async function renombrarPlantilla(id: string, nombre: string) {
  const t = await getTranslations("validation");
  nombre = sanitizeString(nombre, LIMITS.NOMBRE);
  if (!nombre) return { ok: false, error: t("plan.nombreObligatorio") };

  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: true };

  await prisma.plantilla.update({
    where: { id, dietistaId: dietista.id },
    data: { nombre },
  });

  revalidatePath("/dietas/plantillas");
  revalidatePath(`/dietas/plantillas/${id}`);
  return { ok: true };
}

export async function eliminarPlantilla(id: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await prisma.plantilla.delete({
    where: { id, dietistaId: dietista.id },
  });

  revalidatePath("/dietas");
  revalidatePath("/dietas/plantillas");
}

export async function crearPlanDesdePlantilla(
  plantillaId: string,
  pacienteId: string,
  nombre: string
) {
  // Validar y sanitizar inputs
  const t = await getTranslations("validation");
  nombre = sanitizeString(nombre, LIMITS.NOMBRE);
  if (!nombre) throw new Error(t("plan.nombreObligatorio"));

  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const plantilla = await prisma.plantilla.findUnique({
    where: { id: plantillaId, dietistaId: dietista.id },
  });
  if (!plantilla) throw new Error(t("plantilla.plantillaNoEncontrada"));

  const datos = (plantilla.datos as unknown as PlantillaDia[]) || [];

  // Recoger todos los IDs referenciados (incl. alternativas) y verificar cuáles existen
  const alimentoIds = new Set<string>();
  const recetaIds = new Set<string>();
  for (const dia of datos) {
    for (const comida of dia.comidas) {
      for (const a of comida.alimentos) {
        if (a.alimentoId) alimentoIds.add(a.alimentoId);
        if (a.recetaId) recetaIds.add(a.recetaId);
        for (const alt of a.alternativas ?? []) {
          if (alt.alimentoId) alimentoIds.add(alt.alimentoId);
          if (alt.recetaId) recetaIds.add(alt.recetaId);
        }
      }
    }
  }

  const [alimentosExistentes, recetasExistentes] = await Promise.all([
    alimentoIds.size > 0
      ? prisma.alimento.findMany({
          where: { id: { in: [...alimentoIds] } },
          select: { id: true },
        })
      : [],
    recetaIds.size > 0
      ? prisma.receta.findMany({
          where: { id: { in: [...recetaIds] } },
          select: { id: true },
        })
      : [],
  ]);

  const alimentosValidos = new Set(alimentosExistentes.map((a) => a.id));
  const recetasValidas = new Set(recetasExistentes.map((r) => r.id));

  // 1. Crear el plan vacío
  const plan = await prisma.planAlimenticio.create({
    data: {
      dietista: { connect: { id: dietista.id } },
      paciente: { connect: { id: pacienteId } },
      nombre,
    },
  });

  // 2. Crear días y comidas paso a paso
  for (const dia of datos) {
    const diaCreado = await prisma.diaDelPlan.create({
      data: { planId: plan.id, dia: dia.dia },
    });

    for (let orden = 0; orden < dia.comidas.length; orden++) {
      const comida = dia.comidas[orden];
      const comidaCreada = await prisma.comidaDelDia.create({
        data: { diaId: diaCreado.id, tipo: comida.tipo, orden },
      });

      // Filtrar alimentos con referencias válidas
      const alimentosValidos2 = comida.alimentos.filter(
        (a) =>
          (!a.alimentoId || alimentosValidos.has(a.alimentoId)) &&
          (!a.recetaId || recetasValidas.has(a.recetaId))
      );

      // Crear cada alimento con su alias y sus alternativas (#5); las alternativas
      // con referencias rotas se descartan igual que los alimentos.
      for (let aOrden = 0; aOrden < alimentosValidos2.length; aOrden++) {
        const a = alimentosValidos2[aOrden];
        const altsValidas = (a.alternativas ?? []).filter(
          (alt) =>
            (alt.alimentoId && alimentosValidos.has(alt.alimentoId)) ||
            (alt.recetaId && recetasValidas.has(alt.recetaId)),
        );
        await prisma.alimentoEnComida.create({
          data: {
            comidaId: comidaCreada.id,
            alimentoId: a.alimentoId && alimentosValidos.has(a.alimentoId) ? a.alimentoId : null,
            recetaId: a.recetaId && recetasValidas.has(a.recetaId) ? a.recetaId : null,
            cantidad: a.cantidad,
            unidad: a.unidad,
            nombrePersonalizado: a.nombrePersonalizado ?? null,
            orden: aOrden,
            alternativas: altsValidas.length > 0
              ? {
                  create: altsValidas.map((alt, j) => ({
                    alimentoId: alt.alimentoId && alimentosValidos.has(alt.alimentoId) ? alt.alimentoId : null,
                    recetaId: alt.recetaId && recetasValidas.has(alt.recetaId) ? alt.recetaId : null,
                    cantidad: alt.cantidad,
                    unidad: alt.unidad,
                    nombrePersonalizado: alt.nombrePersonalizado ?? null,
                    orden: j,
                  })),
                }
              : undefined,
          },
        });
      }
    }
  }

  revalidatePath("/dietas");
  revalidatePath(`/pacientes/${pacienteId}`);
  // Igual que crearPlan: tras crear volvemos a la ficha del paciente (pestaña Plan de alimentación).
  redirect(`/pacientes/${pacienteId}?pestana=plan-alimentacion`);
}
