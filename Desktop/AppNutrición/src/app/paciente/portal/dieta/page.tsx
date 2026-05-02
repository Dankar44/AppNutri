import { redirect } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed, ShoppingCart } from "lucide-react";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { capitalizarNombre } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { PlanVisual } from "@/components/paciente/plan-visual";

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
                  receta: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const paciente = await prisma.paciente.findUnique({
    where: { id: session.pacienteId },
    select: { nombre: true, apellidos: true, peso: true, objetivo: true },
  });

  if (!plan) {
    return (
      <div>
        <PageHeader icon={UtensilsCrossed} title="Mi dieta" subtitle="Plan alimenticio activo" />
        <div className="rounded-xl border border-border bg-muted/30 p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold mb-1">Sin plan activo</h2>
          <p className="text-muted-foreground">
            Tu nutricionista aún no te ha asignado un plan alimenticio
          </p>
        </div>
      </div>
    );
  }

  const MICRO_COLS = [
    "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
    "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
    "folato","acidoPantotenico","colina","calcio","hierro",
    "magnesio","fosforo","potasio","sodio","cinc",
    "cobre","manganeso","selenio","fluor",
  ] as const;
  const alimentoIdSet = new Set<string>();
  for (const dia of plan.dias) {
    for (const comida of dia.comidas) {
      for (const a of comida.alimentos) {
        if (a.alimento?.id) alimentoIdSet.add(a.alimento.id);
      }
    }
  }
  const microMap: Record<string, Record<string, number>> = {};
  if (alimentoIdSet.size > 0) {
    const ids = [...alimentoIdSet];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    const selectCols = MICRO_COLS.map((c) => `"${c}"`).join(",");
    const microRows = await prisma.$queryRawUnsafe<(Record<string, unknown> & { id: string })[]>(
      `SELECT id, ${selectCols} FROM alimentos WHERE id IN (${placeholders})`,
      ...ids,
    );
    for (const row of microRows) {
      const micros: Record<string, number> = {};
      for (const col of MICRO_COLS) micros[col] = typeof row[col] === "number" ? (row[col] as number) : 0;
      microMap[row.id] = micros;
    }
  }

  const pacienteNombre = paciente
    ? `${capitalizarNombre(paciente.nombre)} ${capitalizarNombre(paciente.apellidos)}`
    : "";

  return (
    <div>
      <PageHeader
        icon={UtensilsCrossed}
        title="Mi dieta"
        subtitle={plan.nombre}
        action={
          <Link
            href="/paciente/portal/dieta/lista-compra"
            data-tour="shopping-list-link"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            Lista de la compra
          </Link>
        }
      />

      <div data-tour="diet-plan">
        <PlanVisual
        plan={{
          id: plan.id,
          nombre: plan.nombre,
          caloriasObjetivo: plan.caloriasObjetivo,
          activo: plan.activo,
          proteinasObjetivo: plan.proteinasObjetivo,
          carbohidratosObjetivo: plan.carbohidratosObjetivo,
          grasasObjetivo: plan.grasasObjetivo,
          createdAt: plan.createdAt as unknown as string,
          dias: plan.dias.map((dia) => ({
            id: dia.id,
            dia: dia.dia,
            comidas: dia.comidas.map((comida) => ({
              id: comida.id,
              tipo: comida.tipo,
              descripcion: comida.descripcion,
              alimentos: comida.alimentos.map((a) => ({
                id: a.id,
                cantidad: a.cantidad,
                unidad: a.unidad,
                alimento: a.alimento
                  ? { ...a.alimento, ...(microMap[a.alimento.id] || {}) }
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
                      porciones: (a.receta as unknown as { porciones: number }).porciones ?? 1,
                    }
                  : null,
              })),
            })),
          })),
        }}
        pacienteId={session.pacienteId}
        pacienteNombre={pacienteNombre}
        pacientePeso={paciente?.peso}
        pacienteObjetivo={paciente?.objetivo}
        showPlanSelector={false}
        showPdfButton={false}
        showAsignarButton={false}
        showNuevaDietaButton={false}
        showAguaEjercicio={false}
        showFoodTable={false}
        readOnly
      />
      </div>
    </div>
  );
}
