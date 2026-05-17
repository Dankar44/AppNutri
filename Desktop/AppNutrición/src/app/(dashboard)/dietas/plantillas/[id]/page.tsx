import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPlantillaDetalle } from "@/app/actions/plantillas";
import { PlantillaDetalleClient } from "./plantilla-detalle-client";

const DIAS_ORDEN = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlantillaDetallePage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("common");
  const plantilla = await getPlantillaDetalle(id);
  if (!plantilla) notFound();

  const { datos, alimentosMap, recetasMap } = plantilla;

  let totalAlimentos = 0;
  for (const dia of datos) {
    for (const comida of dia.comidas) {
      totalAlimentos += comida.alimentos.length;
    }
  }

  const planData = {
    id: plantilla.id,
    nombre: plantilla.nombre,
    caloriasObjetivo: null,
    activo: false,
    proteinasObjetivo: null,
    carbohidratosObjetivo: null,
    grasasObjetivo: null,
    createdAt: plantilla.createdAt as unknown as string,
    dias: DIAS_ORDEN
      .map((diaKey) => {
        const dia = datos.find((d) => d.dia === diaKey);
        if (!dia) return null;
        return {
          id: `plantilla-${diaKey}`,
          dia: diaKey,
          comidas: dia.comidas.map((comida, ci) => ({
            id: `plantilla-${diaKey}-${comida.tipo}-${ci}`,
            tipo: comida.tipo,
            descripcion: null,
            alimentos: comida.alimentos.map((a, ai) => {
              const alimento = a.alimentoId ? alimentosMap[a.alimentoId] : null;
              const receta = a.recetaId ? recetasMap[a.recetaId] : null;
              return {
                id: `plantilla-${diaKey}-${comida.tipo}-${ai}`,
                cantidad: a.cantidad,
                unidad: a.unidad,
                alimento: alimento
                  ? {
                      id: alimento.id,
                      nombre: alimento.nombre,
                      calorias: alimento.calorias,
                      proteinas: alimento.proteinas,
                      carbohidratos: alimento.carbohidratos,
                      grasas: alimento.grasas,
                      fibra: alimento.fibra ?? 0,
                      porcion: alimento.porcion ?? 100,
                      categoria: alimento.categoria ?? undefined,
                      enlaceProducto: alimento.enlaceProducto ?? null,
                      imagenUrl: alimento.imagenUrl ?? null,
                      ...(Object.fromEntries(
                        (["vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD","vitaminaE","vitaminaK","tiamina","riboflavina","niacina","folato","acidoPantotenico","colina","calcio","hierro","magnesio","fosforo","potasio","sodio","cinc","cobre","manganeso","selenio","fluor"] as const).map(
                          (k) => [k, (alimento as Record<string, unknown>)[k] ?? 0]
                        )
                      )),
                    }
                  : null,
                receta: receta
                  ? {
                      id: receta.id,
                      nombre: receta.nombre,
                      calorias: receta.calorias,
                      proteinas: receta.proteinas,
                      carbohidratos: receta.carbohidratos,
                      grasas: receta.grasas,
                      fibra: receta.fibra ?? 0,
                      porciones: receta.porciones ?? 1,
                    }
                  : null,
              };
            }),
          })),
        };
      })
      .filter(Boolean) as any[],
  };

  const editorDias = DIAS_ORDEN
    .map((diaKey) => {
      const dia = datos.find((d) => d.dia === diaKey);
      if (!dia) return null;
      return {
        dia: diaKey,
        comidas: dia.comidas.map((comida) => ({
          tipo: comida.tipo,
          alimentos: comida.alimentos.map((a) => {
            const alimento = a.alimentoId ? alimentosMap[a.alimentoId] : null;
            const receta = a.recetaId ? recetasMap[a.recetaId] : null;
            return {
              alimentoId: a.alimentoId,
              recetaId: a.recetaId,
              cantidad: a.cantidad,
              unidad: a.unidad,
              nombre: alimento?.nombre || receta?.nombre || t("generic.deleted"),
              calorias: alimento?.calorias || receta?.calorias || 0,
              proteinas: alimento?.proteinas || receta?.proteinas || 0,
              carbohidratos: alimento?.carbohidratos || receta?.carbohidratos || 0,
              grasas: alimento?.grasas || receta?.grasas || 0,
              porcion: alimento?.porcion ?? 100,
            };
          }),
        })),
      };
    })
    .filter(Boolean) as any[];

  return (
    <PlantillaDetalleClient
      plantillaId={plantilla.id}
      plantillaNombre={plantilla.nombre}
      plantillaCreatedAt={plantilla.createdAt as unknown as string}
      diasCount={planData.dias.length}
      totalAlimentos={totalAlimentos}
      initialPlanData={planData}
      editorDias={editorDias}
    />
  );
}
