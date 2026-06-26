import { redirect } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed, ShoppingCart } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { capitalizarNombre } from "@/lib/utils";
import { PageHeader } from "@/components/page-header";
import { PlanVisual } from "@/components/paciente/plan-visual";
import { expandirGruposDeDias } from "@/lib/grupos-dias";

export default async function PatientDietPage() {
  const t = await getTranslations("patient-portal");
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
                  receta: {
                    include: {
                      ingredientes: { include: { alimento: { select: { nombre: true } } } },
                    },
                  },
                  alternativas: {
                    orderBy: { orden: "asc" },
                    include: {
                      alimento: { select: { id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true, fibra: true, porcion: true } },
                      receta: {
                        select: {
                          id: true, nombre: true, calorias: true, proteinas: true, carbohidratos: true, grasas: true, fibra: true, porciones: true, descripcion: true,
                          ingredientes: { include: { alimento: { select: { nombre: true } } } },
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

  const paciente = await prisma.paciente.findUnique({
    where: { id: session.pacienteId },
    select: { nombre: true, apellidos: true, peso: true, objetivo: true, ocultarCalorias: true },
  });

  if (!plan) {
    return (
      <div>
        <PageHeader icon={UtensilsCrossed} title={t("dieta.title")} subtitle={t("dieta.subtitle")} />
        <div className="lg:rounded-xl lg:border lg:border-border sm:bg-muted/30 p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold mb-1">{t("dieta.sinPlan.title")}</h2>
          <p className="text-muted-foreground">
            {t("dieta.sinPlan.description")}
          </p>
        </div>
      </div>
    );
  }

  // #75 — expandir grupos: los días miembro reflejan el menú del día representante (no salen vacíos).
  const dias = await expandirGruposDeDias(plan.id, plan.dias);

  const MICRO_COLS = [
    "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
    "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
    "folato","acidoPantotenico","colina","calcio","hierro",
    "magnesio","fosforo","potasio","sodio","cinc",
    "cobre","manganeso","selenio","fluor",
  ] as const;
  const alimentoIdSet = new Set<string>();
  for (const dia of dias) {
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
        title={t("dieta.title")}
        subtitle={plan.nombre}
        action={
          <Link
            href="/paciente/portal/dieta/lista-compra"
            data-tour="shopping-list-link"
            className="hidden lg:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            <ShoppingCart className="w-4 h-4" />
            {t("dieta.listaCompra")}
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
          dias: dias.map((dia) => ({
            id: dia.id,
            dia: dia.dia,
            grupoId: dia.grupoId,
            comidas: dia.comidas.map((comida) => ({
              id: comida.id,
              tipo: comida.tipo,
              descripcion: comida.descripcion,
              alimentos: comida.alimentos.map((a) => ({
                id: a.id,
                cantidad: a.cantidad,
                unidad: a.unidad,
                nombrePersonalizado: a.nombrePersonalizado ?? null,
                alternativas: a.alternativas?.map((alt) => ({
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
                })) ?? [],
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
                      descripcion: a.receta.descripcion ?? null,
                      ingredientes: (a.receta as unknown as { ingredientes?: { alimento: { nombre: string }; cantidad: number; unidad: string }[] }).ingredientes?.map((i) => ({ nombre: i.alimento.nombre, cantidad: i.cantidad, unidad: i.unidad })) ?? [],
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
        interactionMode="patient"
        ocultarCalorias={paciente?.ocultarCalorias ?? false}
      />
      </div>
    </div>
  );
}
