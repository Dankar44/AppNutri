import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { PlanReadOnly } from "@/components/compartido/plan-read-only";

export default async function PatientDietPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const plan = await prisma.planAlimenticio.findFirst({
    where: { pacienteId: session.pacienteId, activo: true },
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
                  receta: { include: { ingredientes: { include: { alimento: { select: { nombre: true } } } } } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!plan) {
    return (
      <div className="text-center py-12">
        <h2 className="text-lg font-semibold mb-2">Sin plan activo</h2>
        <p className="text-muted-foreground">
          Tu dietista aún no te ha asignado un plan alimenticio
        </p>
      </div>
    );
  }

  const dias = plan.dias.map((dia) => ({
    dia: dia.dia,
    comidas: dia.comidas.map((comida) => ({
      tipo: comida.tipo,
      alimentos: comida.alimentos.map((a) => ({
        cantidad: a.cantidad,
        alimento: a.alimento ? { nombre: a.alimento.nombre, calorias: a.alimento.calorias, proteinas: a.alimento.proteinas, carbohidratos: a.alimento.carbohidratos, grasas: a.alimento.grasas } : null,
        receta: a.receta ? {
          nombre: a.receta.nombre, descripcion: a.receta.descripcion, instrucciones: a.receta.instrucciones, porciones: a.receta.porciones,
          calorias: a.receta.calorias, proteinas: a.receta.proteinas, carbohidratos: a.receta.carbohidratos, grasas: a.receta.grasas,
          ingredientes: (a.receta as unknown as { ingredientes: { alimento: { nombre: string }; cantidad: number; unidad: string }[] }).ingredientes || [],
        } : null,
      })),
    })),
  }));

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link
          href="/paciente/portal/dieta/lista-compra"
          className="text-sm text-primary hover:underline font-medium"
        >
          Ver lista de la compra
        </Link>
      </div>
      <PlanReadOnly nombre={plan.nombre} dias={dias} />
    </div>
  );
}
