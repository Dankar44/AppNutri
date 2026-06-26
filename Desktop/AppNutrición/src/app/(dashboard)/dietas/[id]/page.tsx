import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Share2, Sparkles, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AvatarPaciente } from "@/components/avatar-paciente";
import { getPlan, getPlanesPaciente } from "@/app/actions/planes";
import { getPlanificaciones } from "@/app/actions/planificaciones";
import { capitalizarNombre } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { PlanVisual } from "@/components/paciente/plan-visual";
import { PlanActions } from "./plan-actions";
import { PlantillaButton } from "./plantilla-button";
import { PlanSelector } from "./plan-selector";
import { ActionBarMobile } from "./action-bar-mobile";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: Props) {
  const t = await getTranslations("diets");
  const { id } = await params;
  const plan = await getPlan(id);
  if (!plan) notFound();

  const planesPaciente = await getPlanesPaciente(plan.pacienteId);
  const planificaciones = await getPlanificaciones(plan.pacienteId);

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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dietas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 sm:mb-4 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("detail.backToPlans")}
        </Link>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <AvatarPaciente
              nombre={plan.paciente.nombre}
              apellidos={plan.paciente.apellidos}
              fotoUrl={plan.paciente.fotoUrl ?? null}
              size="lg"
            />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-bold leading-tight line-clamp-2 sm:truncate">
                {capitalizarNombre(plan.paciente.nombre)} {capitalizarNombre(plan.paciente.apellidos)}
              </h1>
            </div>
          </div>

          {/* Mobile: tap-to-expand action bar */}
          <div className="sm:hidden w-full">
            <ActionBarMobile planId={plan.id} />
          </div>

          {/* Desktop: full action bar */}
          <div className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-border bg-card p-1 w-auto ml-auto">
            <Link
              href={`/dietas/${plan.id}/generar-ia`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/15 transition-colors text-sm font-medium"
              aria-label={t("detail.generateWithAi")}
            >
              <Sparkles className="w-3.5 h-3.5" />
              IA
            </Link>
            <PlantillaButton planId={plan.id} />
            <Link
              href={`/dietas/${plan.id}/compartir`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
              aria-label={t("detail.share")}
            >
              <Share2 className="w-3.5 h-3.5" />
              {t("detail.share")}
            </Link>
            <Link
              href={`/dietas/${plan.id}/editar`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
              aria-label={t("detail.edit")}
            >
              <Pencil className="w-3.5 h-3.5" />
              {t("detail.edit")}
            </Link>
            <PlanActions planId={plan.id} />
          </div>
        </div>

        <div className="mt-4">
          <PlanSelector
            planActualId={plan.id}
            pacienteId={plan.pacienteId}
            planes={planesPaciente.map((p) => ({
              id: p.id,
              nombre: p.nombre,
              activo: p.activo,
              caloriasObjetivo: p.caloriasObjetivo,
              createdAt: p.createdAt as unknown as string,
            }))}
          />
        </div>
      </div>

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
                  recetaPorciones: alt.receta ? ((alt.receta as unknown as { porciones: number }).porciones ?? 1) : undefined,
                  recetaDescripcion: alt.receta?.descripcion ?? null,
                  recetaIngredientes: alt.receta?.ingredientes?.map((i) => ({ nombre: i.alimento.nombre, cantidad: i.cantidad, unidad: i.unidad })) ?? undefined,
                })) ?? [],
              })),
            })),
          })),
        }}
        pacienteId={plan.pacienteId}
        pacienteNombre={`${capitalizarNombre(plan.paciente.nombre)} ${capitalizarNombre(plan.paciente.apellidos)}`}
        showPlanSelector={false}
        showPdfButton={false}
        showAsignarButton={false}
        showNuevaDietaButton={false}
        showAguaEjercicio={false}
        showFoodTable={false}
        planificaciones={(plan.planificacionIds ?? [])
          .map((pid) => planificaciones.find((p) => p.id === pid))
          .filter((p): p is (typeof planificaciones)[number] => !!p)
          .map((p) => {
            const num = (v: unknown) => (typeof v === "number" && isFinite(v) && v > 0 ? Math.round(v) : null);
            // Override propio de esta dieta (si el nutri lo editó); si no, los objetivos de la planificación.
            const ov = plan.objetivosPorPlani?.[p.id];
            const d = p.datos ?? {};
            return ov
              ? { id: p.id, nombre: p.nombre, kcal: num(ov.kcal), proteinas: num(ov.proteinas), carbohidratos: num(ov.carbohidratos), grasas: num(ov.grasas) }
              : { id: p.id, nombre: p.nombre, kcal: num(d.kcalObjetivo), proteinas: num(d.protGObjetivo), carbohidratos: num(d.carbGObjetivo), grasas: num(d.grasaGObjetivo) };
          })}
        objetivosPorDia={plan.objetivosPorDia}
      />
    </div>
  );
}
