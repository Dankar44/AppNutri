import "server-only";
import type { PlanVisualDetalle } from "@/components/paciente/plan-visual";

/**
 * #40 — Cómo se lee un plan para verlo, sin poder tocarlo.
 *
 * Lo usan dos sitios: el enlace público que el nutricionista manda a su paciente y la pantalla en
 * la que el profesor corrige lo que ha entregado su alumno. La consulta y el mapeo estaban
 * escritos a mano en la página del enlace público; están aquí para que las dos vistas enseñen
 * exactamente lo mismo y no se separen con el tiempo.
 */

/** El `include` de Prisma que trae un plan entero: días, comidas, alimentos y alternativas. */
export const PLAN_COMPLETO = {
  paciente: { select: { nombre: true, apellidos: true } },
  dias: {
    orderBy: { dia: "asc" as const },
    include: {
      comidas: {
        orderBy: { orden: "asc" as const },
        include: {
          alimentos: {
            orderBy: { orden: "asc" as const },
            include: {
              alimento: true,
              receta: {
                include: {
                  ingredientes: {
                    include: {
                      alimento: {
                        select: { id: true, nombre: true, categoria: true, porcion: true, enlaceProducto: true, imagenUrl: true },
                      },
                    },
                  },
                },
              },
              alternativas: {
                orderBy: { orden: "asc" as const },
                include: {
                  alimento: {
                    select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true, fibra: true, porcion: true },
                  },
                  receta: {
                    select: {
                      id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true,
                      grasas: true, fibra: true, porciones: true, descripcion: true,
                      ingredientes: {
                        include: {
                          alimento: {
                            select: { id: true, nombre: true, categoria: true, porcion: true, enlaceProducto: true, imagenUrl: true },
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
};

type Ingrediente = { alimento: { nombre: string }; cantidad: number; unidad: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Pasa lo que devuelve Prisma a lo que pinta `PlanVisual`. */
export function aDetalleVisual(plan: any, dias: any[]): PlanVisualDetalle {
  return {
    id: plan.id,
    nombre: plan.nombre,
    caloriasObjetivo: null,
    activo: true,
    proteinasObjetivo: null,
    carbohidratosObjetivo: null,
    grasasObjetivo: null,
    dias: dias.map((dia: any) => ({
      id: dia.id,
      dia: dia.dia,
      grupoId: dia.grupoId,
      comidas: dia.comidas.map((comida: any) => ({
        id: comida.id,
        tipo: comida.tipo,
        descripcion: comida.descripcion,
        nombre: comida.nombre,
        hora: comida.hora,
        alimentos: comida.alimentos.map((a: any) => ({
          id: a.id,
          cantidad: a.cantidad,
          unidad: a.unidad ?? "GRAMOS",
          nombrePersonalizado: a.nombrePersonalizado ?? null,
          alternativas: a.alternativas?.map((alt: any) => ({
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
            recetaIngredientes: alt.receta?.ingredientes?.map((i: Ingrediente) => ({
              nombre: i.alimento.nombre, cantidad: i.cantidad, unidad: i.unidad,
            })) ?? undefined,
          })) ?? [],
          alimento: a.alimento
            ? {
                id: a.alimento.id,
                nombre: a.alimento.nombre,
                calorias: a.alimento.calorias,
                proteinas: a.alimento.proteinas,
                carbohidratos: a.alimento.carbohidratos,
                grasas: a.alimento.grasas,
                fibra: a.alimento.fibra,
                porcion: a.alimento.porcion ?? 100,
                enlaceProducto: a.alimento.enlaceProducto,
                imagenUrl: a.alimento.imagenUrl,
              }
            : null,
          receta: a.receta
            ? {
                id: a.receta.id,
                nombre: a.receta.nombre,
                calorias: a.receta.calorias,
                proteinas: a.receta.proteinas,
                carbohidratos: a.receta.carbohidratos,
                grasas: a.receta.grasas,
                fibra: a.receta.fibra,
                porciones: a.receta.porciones,
                descripcion: a.receta.descripcion ?? null,
                ingredientes: a.receta.ingredientes?.map((i: Ingrediente) => ({
                  nombre: i.alimento.nombre, cantidad: i.cantidad, unidad: i.unidad,
                })) ?? [],
              }
            : null,
        })),
      })),
    })),
  };
}
