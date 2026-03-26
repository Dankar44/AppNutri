"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { asignarPlanComoActual } from "@/app/actions/planes";
import {
  Plus,
  CalendarDays,
  UtensilsCrossed,
  Flame,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  FileDown,
} from "lucide-react";
import { formatDate, capitalizarNombre, cn } from "@/lib/utils";
import { calcularMacrosPorcion, sumarMacros } from "@/lib/macros";
import { PlanEditor } from "@/components/dieta/plan-editor";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

type PlanDetalleItem = {
  id: string;
  cantidad: number;
  unidad: string;
  alimento: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    fibra: number;
  } | null;
  receta: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    fibra: number;
    porciones: number;
  } | null;
};

type PlanDetalleComida = {
  id: string;
  tipo: string;
  descripcion?: string | null;
  alimentos: PlanDetalleItem[];
};

type PlanDetalleDia = {
  id: string;
  dia: string;
  comidas: PlanDetalleComida[];
};

type PlanDetalle = {
  id: string;
  nombre: string;
  caloriasObjetivo: number | null;
  activo: boolean;
  proteinasObjetivo: number | null;
  carbohidratosObjetivo: number | null;
  grasasObjetivo: number | null;
  createdAt: string;
  dias: PlanDetalleDia[];
};

const DIA_LABELS: Record<string, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const MACRO_COLORS = {
  grasas: "#ef4444", // red-500
  carbohidratos: "#10b981", // emerald-500
  proteinas: "#3b82f6", // blue-500
  fibra: "#22c55e", // green-500
};

export function PlanDeAlimentacionTab({
  pacienteId,
  pacienteNombre,
  planes,
}: {
  pacienteId: string;
  pacienteNombre: string;
  planes: PlanDetalle[];
}) {
  const router = useRouter();
  const [isPendingAssign, startAssign] = useTransition();

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const activo = planes.find((p) => p.activo);
    return activo?.id ?? planes[0]?.id ?? "";
  });
  const [dayIndex, setDayIndex] = useState<number>(0);
  const [planSelectOpen, setPlanSelectOpen] = useState(false);
  const planSelectWrapRef = useRef<HTMLDivElement | null>(null);
  const [vista, setVista] = useState<"plan" | "analisis">("plan");

  const selectedPlan = useMemo(
    () => planes.find((p) => p.id === selectedPlanId) ?? planes[0] ?? null,
    [planes, selectedPlanId]
  );

  useEffect(() => {
    // Cuando cambias de plan, volvemos al primer día
    setDayIndex(0);
  }, [selectedPlanId]);

  async function handleAsignarComoActual() {
    if (!selectedPlan || isPendingAssign) return;
    startAssign(async () => {
      try {
        await asignarPlanComoActual(selectedPlan.id);
        toast.success("Dieta asignada como actual");
        router.refresh();
      } catch {
        toast.error("No se pudo asignar como actual");
      }
    });
  }

  useEffect(() => {
    if (!planSelectOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = planSelectWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setPlanSelectOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [planSelectOpen]);

  const diaVista = useMemo(() => {
    if (!selectedPlan) return null;
    return selectedPlan.dias[dayIndex] ?? selectedPlan.dias[0] ?? null;
  }, [selectedPlan, dayIndex]);

  const totals = useMemo(() => {
    if (!selectedPlan || !diaVista) return null;

    const macroList = [];
    for (const comida of diaVista.comidas) {
      for (const item of comida.alimentos) {
        if (item.alimento) {
          macroList.push(
            calcularMacrosPorcion(
              {
                calorias: item.alimento.calorias,
                proteinas: item.alimento.proteinas,
                carbohidratos: item.alimento.carbohidratos,
                grasas: item.alimento.grasas,
                fibra: item.alimento.fibra,
              },
              item.cantidad
            )
          );
          continue;
        }

        if (item.receta) {
          // Receta: macros por porción, cantidad = nº porciones
          macroList.push({
            calorias: Math.round(item.receta.calorias * item.cantidad * 10) / 10,
            proteinas: Math.round(item.receta.proteinas * item.cantidad * 10) / 10,
            carbohidratos: Math.round(item.receta.carbohidratos * item.cantidad * 10) / 10,
            grasas: Math.round(item.receta.grasas * item.cantidad * 10) / 10,
            fibra: Math.round(item.receta.fibra * item.cantidad * 10) / 10,
          });
        }
      }
    }

    const t = sumarMacros(macroList);

    // Descomposición energética para el gráfico
    const grasaKcal = t.grasas * 9;
    const carbKcal = t.carbohidratos * 4;
    const protKcal = t.proteinas * 4;
    const fibraKcal = t.fibra * 2; // aproximación
    const energyTotal = grasaKcal + carbKcal + protKcal + fibraKcal;

    return {
      macros: t,
      energy: {
        grasasKcal: grasaKcal,
        carbKcal: carbKcal,
        protKcal: protKcal,
        fibraKcal: fibraKcal,
        energyTotal: energyTotal || 1,
      },
    };
  }, [diaVista]);

  if (!planes || planes.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Plan de alimentación</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Dietas asignadas a {capitalizarNombre(pacienteNombre)}
            </p>
          </div>
          <Link
            href={`/dietas/nuevo?pacienteId=${pacienteId}`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Crear plan
          </Link>
        </div>

        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">Aún no hay planes</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crea un plan alimenticio para este paciente y aparecerá aquí.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-base font-semibold whitespace-nowrap">Dietas actuales:</h3>

            <div className="w-[360px]">
              <div ref={planSelectWrapRef} className="relative">
                <button
                  type="button"
                  onClick={() => setPlanSelectOpen((v) => !v)}
                  className={cn(
                    "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg border bg-background text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-primary/30"
                  )}
                  aria-expanded={planSelectOpen}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-medium">
                      {selectedPlan?.nombre || "—"}
                    </span>
                    {selectedPlan?.caloriasObjetivo != null && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium shrink-0">
                        <Flame className="w-3 h-3" />
                        {selectedPlan.caloriasObjetivo}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>

                {planSelectOpen && (
                  <div className="absolute left-0 right-0 mt-2 z-50 bg-card border border-border rounded-lg shadow-sm overflow-y-auto max-h-64">
                    <div className="px-2 py-2 text-[11px] text-muted-foreground border-b border-border/60">
                      Desplázate para ver todas las dietas
                    </div>
                    <div className="py-1">
                      {planes.map((p) => {
                        const active = p.id === selectedPlanId;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPlanId(p.id);
                              setPlanSelectOpen(false);
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-left flex items-center justify-between gap-3 hover:bg-muted/60 transition-colors",
                              active ? "bg-primary/5" : "bg-transparent"
                            )}
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="truncate">{p.nombre}</span>
                              {p.caloriasObjetivo != null && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium shrink-0">
                                  <Flame className="w-2.5 h-2.5" />
                                  {p.caloriasObjetivo}
                                </span>
                              )}
                            </div>
                            {active ? <Check className="w-4 h-4 text-primary shrink-0" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-primary/5 border border-primary/10 rounded-xl px-3 py-2.5 flex items-center justify-center min-w-0">
          <div className="text-base font-semibold text-muted-foreground truncate text-center">
            {diaVista ? DIA_LABELS[diaVista.dia] || diaVista.dia : "—"}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dietas/nuevo?pacienteId=${pacienteId}`}
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors"
            title="Crear nueva dieta"
          >
            <Plus className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={handleAsignarComoActual}
            disabled={!selectedPlan || selectedPlan.activo || isPendingAssign}
            className={cn(
              "inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors",
              !selectedPlan || selectedPlan.activo || isPendingAssign
                ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                : "border-border bg-card hover:bg-muted transition-colors"
            )}
            title={selectedPlan?.activo ? "Asignada como actual" : "Asignar como actual"}
          >
            <Check className="w-4 h-4" />
          </button>

          <Link
            href={selectedPlan ? `/dietas/${selectedPlan.id}` : "#"}
            onClick={(e) => {
              if (!selectedPlan) e.preventDefault();
            }}
            className={cn(
              "inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors",
              !selectedPlan && "pointer-events-none opacity-50"
            )}
            title="Crear PDF"
          >
            <FileDown className="w-4 h-4" />
          </Link>
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card p-1 shrink-0">
          <button
            type="button"
            onClick={() => setVista("plan")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              vista === "plan"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60"
            )}
          >
            Plan
          </button>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground opacity-50 cursor-not-allowed"
            title="Análisis próximamente"
          >
            Análisis
          </button>
        </div>
      </div>

      {selectedPlan && totals ? (
        vista === "plan" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4">
            {/* (El contenido existente permanece igual) */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <h4 className="text-lg font-semibold truncate">{selectedPlan.nombre}</h4>
                </div>
                <Link
                  href={`/dietas/${selectedPlan.id}`}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium shrink-0"
                >
                  Abrir
                </Link>
              </div>

              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground gap-3">
                <div className="inline-flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {formatDate(selectedPlan.createdAt)}
                </div>

                <div className="flex items-center gap-2">
                  <span className="tabular-nums font-medium">
                    {diaVista ? DIA_LABELS[diaVista.dia] || diaVista.dia : "—"}
                  </span>

                  <button
                    type="button"
                    onClick={() => setDayIndex((i) => Math.max(0, i - 1))}
                    disabled={dayIndex <= 0}
                    className={cn(
                      "inline-flex items-center justify-center h-7 w-7 rounded-lg border transition-colors",
                      dayIndex <= 0
                        ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                        : "border-border bg-card hover:bg-muted/50 text-foreground"
                    )}
                    aria-label="Día anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDayIndex((i) => Math.min(selectedPlan.dias.length - 1, i + 1))
                    }
                    disabled={dayIndex >= selectedPlan.dias.length - 1}
                    className={cn(
                      "inline-flex items-center justify-center h-7 w-7 rounded-lg border transition-colors",
                      dayIndex >= selectedPlan.dias.length - 1
                        ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                        : "border-border bg-card hover:bg-muted/50 text-foreground"
                    )}
                    aria-label="Día siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {diaVista ? (
                  <PlanEditor
                    showHeader={false}
                    compactHeader
                    planId={selectedPlan.id}
                    planNombre={selectedPlan.nombre}
                    dias={[diaVista as any]}
                    objetivos={{
                      calorias: selectedPlan.caloriasObjetivo ?? undefined,
                      proteinas: selectedPlan.proteinasObjetivo ?? undefined,
                      carbohidratos: selectedPlan.carbohidratosObjetivo ?? undefined,
                      grasas: selectedPlan.grasasObjetivo ?? undefined,
                    }}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">No hay días para mostrar.</div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h4 className="text-base font-semibold">Análisis global</h4>
                  <p className="text-xs text-muted-foreground">Distribución de macros y fibra</p>
                </div>
              </div>

              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Grasa", value: totals.energy.grasasKcal },
                        { name: "Carbohidratos", value: totals.energy.carbKcal },
                        { name: "Proteína", value: totals.energy.protKcal },
                        { name: "Fibra", value: totals.energy.fibraKcal },
                      ]}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <Cell fill={MACRO_COLORS.grasas} />
                      <Cell fill={MACRO_COLORS.carbohidratos} />
                      <Cell fill={MACRO_COLORS.proteinas} />
                      <Cell fill={MACRO_COLORS.fibra} />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-2 space-y-2">
                <div className="text-xs text-muted-foreground">Energía</div>
                <div className="text-lg font-bold">{Math.round(totals.macros.calorias)} kcal</div>

                {[
                  { key: "grasas", label: "Grasa", value: totals.macros.grasas, kcal: totals.energy.grasasKcal, color: MACRO_COLORS.grasas },
                  { key: "carbohidratos", label: "Hidratos de Carbono", value: totals.macros.carbohidratos, kcal: totals.energy.carbKcal, color: MACRO_COLORS.carbohidratos },
                  { key: "proteinas", label: "Proteína", value: totals.macros.proteinas, kcal: totals.energy.protKcal, color: MACRO_COLORS.proteinas },
                  { key: "fibra", label: "Fibra alimentaria", value: totals.macros.fibra, kcal: totals.energy.fibraKcal, color: MACRO_COLORS.fibra },
                ].map((row) => {
                  const pct = (row.kcal / totals.energy.energyTotal) * 100;
                  return (
                    <div key={row.key} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium tabular-nums">{row.value.toFixed(1)} g</span>
                      </div>
                      <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%`, background: row.color }} className="h-full" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground">
            Análisis próximamente.
          </div>
        )
      ) : null}
    </section>
  );
}

