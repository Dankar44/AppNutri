"use server";

import { prisma } from "@/lib/prisma";
import { expandirGruposDeDias } from "@/lib/grupos-dias";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

export async function crearEnlace(planId: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const enlace = await prisma.enlaceCompartido.create({
    data: { plan: { connect: { id: planId } }, dietista: { connect: { id: dietista.id } } },
  });

  revalidatePath(`/dietas/${planId}/compartir`);
  return enlace;
}

export async function eliminarEnlace(id: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await prisma.enlaceCompartido.delete({
    where: { id, dietistaId: dietista.id },
  });

  revalidatePath("/dietas");
}

export async function getEnlacesDelPlan(planId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.enlaceCompartido.findMany({
    where: { planId, dietistaId: dietista.id, activo: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPlanPorToken(token: string) {
  const enlace = await prisma.enlaceCompartido.findUnique({
    where: { token, activo: true },
    include: {
      dietista: { select: { marcaPdf: true, pdfLogoUrl: true, temaPdf: true, colorPrimarioPdf: true, clinica: true, nombre: true, apellidos: true } },
      plan: {
        include: {
          paciente: { select: { nombre: true, apellidos: true } },
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
      },
    },
  });

  if (!enlace) return null;
  if (enlace.expiraEn && enlace.expiraEn < new Date()) return null;
  // #75 — expandir grupos: los días miembro reflejan el menú del día representante (no salen vacíos).
  const dias = await expandirGruposDeDias(enlace.plan.id, enlace.plan.dias);
  return {
    ...enlace.plan,
    dias,
    branding: {
      marcaPdf: enlace.dietista.marcaPdf,
      pdfLogoUrl: enlace.dietista.pdfLogoUrl,
      temaPdf: enlace.dietista.temaPdf,
      colorPrimarioPdf: enlace.dietista.colorPrimarioPdf,
      clinica: enlace.dietista.clinica,
      dietistaNombre: `${enlace.dietista.nombre} ${enlace.dietista.apellidos}`,
    },
  };
}
