import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPaciente } from "@/app/actions/pacientes";
import { getMedidas } from "@/app/actions/medidas";
import { parsePestanaFicha } from "@/lib/paciente-ficha-pestanas";
import { PacienteFichaClient } from "@/components/paciente/paciente-ficha-client";
import { getPlanesPaciente } from "@/app/actions/planes";
import { getPlan } from "@/app/actions/planes";
import { getHorarioPaciente, getRecomendaciones } from "@/app/actions/pacientes";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pestana?: string }>;
}

export default async function PacienteDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { pestana: rawPestana } = await searchParams;

  const paciente = await getPaciente(id);
  if (!paciente) notFound();

  const pestana = parsePestanaFicha(rawPestana);
  const serializado = JSON.parse(JSON.stringify(paciente));

  const medidas = ["mediciones", "planificacion", "plan-alimentacion"].includes(pestana)
    ? JSON.parse(JSON.stringify(await getMedidas(id)))
    : [];

  const [horario, recomendaciones, planesResumen] = await Promise.all([
    getHorarioPaciente(id),
    getRecomendaciones(id),
    getPlanesPaciente(id),
  ]);

  const planes =
    pestana === "plan-alimentacion"
      ? await (async () => {
          const planesPaciente = await getPlanesPaciente(id);

          const planesDetalle = await Promise.all(
            planesPaciente.map(async (p) => {
              const plan = await getPlan(p.id);
              if (!plan) return null;

              return {
                id: plan.id,
                nombre: plan.nombre,
                caloriasObjetivo: plan.caloriasObjetivo,
                activo: plan.activo,
                proteinasObjetivo: plan.proteinasObjetivo,
                carbohidratosObjetivo: plan.carbohidratosObjetivo,
                grasasObjetivo: plan.grasasObjetivo,
                createdAt: plan.createdAt?.toISOString?.() ?? new Date(plan.createdAt).toISOString(),
                dias: plan.dias.map((dia) => ({
                  id: dia.id,
                  dia: dia.dia,
                  comidas: dia.comidas.map((comida) => ({
                    id: comida.id,
                    tipo: comida.tipo,
                    descripcion: comida.descripcion,
                    alimentos: comida.alimentos.map((a) => {
                      const itemAlimento = a.alimento
                        ? {
                            id: a.alimento.id,
                            nombre: a.alimento.nombre,
                            calorias: a.alimento.calorias ?? 0,
                            proteinas: a.alimento.proteinas ?? 0,
                            carbohidratos: a.alimento.carbohidratos ?? 0,
                            grasas: a.alimento.grasas ?? 0,
                            fibra: a.alimento.fibra ?? 0,
                          }
                        : null;

                      const itemReceta = a.receta
                        ? {
                            id: a.receta.id,
                            nombre: a.receta.nombre,
                            calorias: a.receta.calorias ?? 0,
                            proteinas: a.receta.proteinas ?? 0,
                            carbohidratos: a.receta.carbohidratos ?? 0,
                            grasas: a.receta.grasas ?? 0,
                            fibra: a.receta.fibra ?? 0,
                            porciones: a.receta.porciones ?? 1,
                          }
                        : null;

                      return {
                        id: a.id,
                        cantidad: a.cantidad,
                        unidad: a.unidad,
                        alimento: itemAlimento,
                        receta: itemReceta,
                      };
                    }),
                  })),
                })),
              };
            })
          );

          return JSON.parse(JSON.stringify(planesDetalle.filter(Boolean)));
        })()
      : [];

  return (
    <div>
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a pacientes
      </Link>

      <PacienteFichaClient
        paciente={serializado}
        pestana={pestana}
        medidas={medidas}
        planes={planes}
        horario={JSON.parse(JSON.stringify(horario))}
        recomendaciones={recomendaciones}
        planesResumen={JSON.parse(JSON.stringify(planesResumen))}
      />
    </div>
  );
}
