"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";

export async function crearEnlace(planId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const enlace = await prisma.enlaceCompartido.create({
    data: { planId, dietistaId: dietista.id },
  });

  revalidatePath(`/dietas/${planId}/compartir`);
  return enlace;
}

export async function eliminarEnlace(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

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
                      receta: { include: { ingredientes: { include: { alimento: { select: { nombre: true } } } } } },
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
  return {
    ...enlace.plan,
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
