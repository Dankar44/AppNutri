"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { asignarPlanComoActual } from "@/app/actions/planes";
import {
  Plus,
  UtensilsCrossed,
  Flame,
  Droplets,
  Circle,
  Diamond,
  Triangle,
  ClipboardList,
  LayoutGrid,
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { calcularMacrosPorcion, sumarMacros, convertirAGramos } from "@/lib/macros";
import { PlanEditor } from "@/components/dieta/plan-editor";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
  ResponsiveContainer,
} from "recharts";

type MicronutrientesOpcionales = {
  vitaminaA?: number | null;
  vitaminaB6?: number | null;
  vitaminaB12?: number | null;
  vitaminaC?: number | null;
  vitaminaD?: number | null;
  vitaminaE?: number | null;
  vitaminaK?: number | null;
  tiamina?: number | null;
  riboflavina?: number | null;
  niacina?: number | null;
  folato?: number | null;
  acidoPantotenico?: number | null;
  colina?: number | null;
  calcio?: number | null;
  hierro?: number | null;
  magnesio?: number | null;
  fosforo?: number | null;
  potasio?: number | null;
  sodio?: number | null;
  cinc?: number | null;
  cobre?: number | null;
  manganeso?: number | null;
  selenio?: number | null;
  fluor?: number | null;
};

export type PlanVisualItem = {
  id: string;
  cantidad: number;
  unidad: string;
  alimento: ({
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    fibra: number;
    porcion?: number;
    categoria?: string;
    enlaceProducto?: string | null;
  } & MicronutrientesOpcionales) | null;
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

export type PlanVisualComida = {
  id: string;
  tipo: string;
  descripcion?: string | null;
  alimentos: PlanVisualItem[];
};

export type PlanVisualDia = {
  id: string;
  dia: string;
  comidas: PlanVisualComida[];
};

export type PlanVisualDetalle = {
  id: string;
  nombre: string;
  caloriasObjetivo: number | null;
  activo: boolean;
  proteinasObjetivo: number | null;
  carbohidratosObjetivo: number | null;
  grasasObjetivo: number | null;
  createdAt?: string | Date;
  dias: PlanVisualDia[];
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

const DIA_KEYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;

const MACRO_COLORS = {
  grasas: "#f0b845",
  carbohidratos: "#d9956a",
  proteinas: "#7eaadf",
  fibra: "#4ec4a0",
};

export function PlanVisual({
  plan,
  pacienteId,
  pacienteNombre,
  pacientePeso,
  pacienteObjetivo,
  showPlanSelector = true,
  showPdfButton = true,
  showAsignarButton = true,
  showNuevaDietaButton = true,
  showAguaEjercicio = true,
  showFoodTable = true,
  readOnly = false,
  vistaInicial = "resumen",
  localCallbacks,
}: {
  plan: PlanVisualDetalle;
  pacienteId: string;
  pacienteNombre: string;
  pacientePeso?: number | null;
  pacienteObjetivo?: string | null;
  showPlanSelector?: boolean;
  showPdfButton?: boolean;
  showAsignarButton?: boolean;
  showNuevaDietaButton?: boolean;
  showAguaEjercicio?: boolean;
  showFoodTable?: boolean;
  readOnly?: boolean;
  vistaInicial?: "resumen" | "plan" | "analisis";
  localCallbacks?: {
    onAdd: (comidaId: string, item: { alimentoId: string | null; recetaId: string | null; nombre: string; cantidad: number; unidad: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number; fibra?: number; porcion?: number }) => void;
    onRemove: (alimentoEnComidaId: string) => void;
    onCantidadChange: (alimentoEnComidaId: string, cantidad: number) => void;
    onMove: (alimentoEnComidaId: string, comidaId: string) => void;
  };
}) {
  const router = useRouter();
  const [isPendingAssign, startAssign] = useTransition();

  const [selectedDayKey, setSelectedDayKey] = useState<"TODOS" | string>(
    vistaInicial === "plan" ? "LUNES" : "TODOS",
  );
  const [planSelectOpen, setPlanSelectOpen] = useState(false);
  const planSelectWrapRef = useRef<HTMLDivElement | null>(null);
  const [vista, setVista] = useState<"resumen" | "plan" | "analisis">(vistaInicial);
  const [hoveredMacro, setHoveredMacro] = useState<number | null>(null);
  const [comidaChartOffset, setComidaChartOffset] = useState(0);
  const [foodTablePage, setFoodTablePage] = useState(0);

  const selectedPlan = plan;

  useEffect(() => {
    setSelectedDayKey("TODOS");
  }, [plan.id]);

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

  const isTodos = selectedDayKey === "TODOS";

  const diasDisponibles = useMemo(() => {
    if (!selectedPlan) return [] as PlanVisualDia[];
    return selectedPlan.dias;
  }, [selectedPlan]);

  const diasVisible = useMemo(() => {
    if (!selectedPlan) return [] as PlanVisualDia[];
    if (isTodos) return selectedPlan.dias;
    const found = selectedPlan.dias.find((d) => d.dia === selectedDayKey);
    return found ? [found] : [];
  }, [selectedPlan, selectedDayKey, isTodos]);

  const diaVista = useMemo<PlanVisualDia | null>(() => {
    if (!selectedPlan) return null;
    if (isTodos) {
      const aggregated: PlanVisualComida[] = [];
      for (const d of selectedPlan.dias) {
        for (const c of d.comidas) aggregated.push(c);
      }
      return { id: "__TODOS__", dia: "TODOS", comidas: aggregated };
    }
    return selectedPlan.dias.find((d) => d.dia === selectedDayKey) ?? selectedPlan.dias[0] ?? null;
  }, [selectedPlan, selectedDayKey, isTodos]);

  const diasCount = Math.max(1, selectedPlan?.dias.length ?? 1);
  const avgDivisor = isTodos ? diasCount : 1;

  const totals = useMemo(() => {
    if (!selectedPlan || !diaVista) return null;

    const macroList = [];
    for (const comida of diaVista.comidas) {
      for (const item of comida.alimentos) {
        if (item.alimento) {
          const gramos = convertirAGramos(item.cantidad, item.unidad, item.alimento.porcion || 100);
          macroList.push(
            calcularMacrosPorcion(
              {
                calorias: item.alimento.calorias,
                proteinas: item.alimento.proteinas,
                carbohidratos: item.alimento.carbohidratos,
                grasas: item.alimento.grasas,
                fibra: item.alimento.fibra,
              },
              gramos
            )
          );
          continue;
        }

        if (item.receta) {
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

    const tRaw = sumarMacros(macroList);
    const t = {
      calorias: Math.round((tRaw.calorias / avgDivisor) * 10) / 10,
      proteinas: Math.round((tRaw.proteinas / avgDivisor) * 10) / 10,
      carbohidratos: Math.round((tRaw.carbohidratos / avgDivisor) * 10) / 10,
      grasas: Math.round((tRaw.grasas / avgDivisor) * 10) / 10,
      fibra: Math.round((tRaw.fibra / avgDivisor) * 10) / 10,
    };

    const MICRO_KEYS = [
      "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
      "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
      "folato","acidoPantotenico","colina","calcio","hierro",
      "magnesio","fosforo","potasio","sodio","cinc",
      "cobre","manganeso","selenio","fluor",
    ] as const;
    const microTotals: Record<string, number> = {};
    for (const key of MICRO_KEYS) microTotals[key] = 0;
    for (const comida of diaVista.comidas) {
      for (const item of comida.alimentos) {
        if (item.alimento) {
          const factor = convertirAGramos(item.cantidad, item.unidad, item.alimento.porcion || 100) / 100;
          for (const key of MICRO_KEYS) {
            const val = (item.alimento as Record<string, unknown>)[key];
            if (typeof val === "number") microTotals[key] += val * factor;
          }
        }
      }
    }
    for (const key of MICRO_KEYS) microTotals[key] = Math.round((microTotals[key] / avgDivisor) * 10) / 10;

    const grasaKcal = t.grasas * 9;
    const carbKcal = t.carbohidratos * 4;
    const protKcal = t.proteinas * 4;
    const fibraKcal = t.fibra * 2;
    const energyTotal = grasaKcal + carbKcal + protKcal + fibraKcal;

    const TIPO_LABELS: Record<string, string> = {
      DESAYUNO: "Desayuno", MEDIA_MANANA: "Media mañana", ALMUERZO: "Comida",
      MERIENDA: "Merienda", CENA: "Cena", RECENA: "Recena",
    };
    const comidasAgg = new Map<string, { gF: number; cF: number; pF: number }>();
    for (const comida of diaVista.comidas) {
      let gF = 0, cF = 0, pF = 0;
      for (const item of comida.alimentos) {
        if (item.alimento) {
          const f = convertirAGramos(item.cantidad, item.unidad, item.alimento.porcion || 100) / 100;
          gF += item.alimento.grasas * f;
          cF += item.alimento.carbohidratos * f;
          pF += item.alimento.proteinas * f;
        } else if (item.receta) {
          gF += item.receta.grasas * item.cantidad;
          cF += item.receta.carbohidratos * item.cantidad;
          pF += item.receta.proteinas * item.cantidad;
        }
      }
      const prev = comidasAgg.get(comida.tipo) ?? { gF: 0, cF: 0, pF: 0 };
      comidasAgg.set(comida.tipo, { gF: prev.gF + gF, cF: prev.cF + cF, pF: prev.pF + pF });
    }
    const comidasMacros = Array.from(comidasAgg.entries()).map(([tipo, v]) => {
      const gF = v.gF / avgDivisor;
      const cF = v.cF / avgDivisor;
      const pF = v.pF / avgDivisor;
      const calTotal = gF * 9 + cF * 4 + pF * 4;
      return {
        tipo,
        label: TIPO_LABELS[tipo] || tipo,
        grasasG: Math.round(gF * 10) / 10,
        carbG: Math.round(cF * 10) / 10,
        protG: Math.round(pF * 10) / 10,
        grasasKcal: Math.round(gF * 9),
        carbKcal: Math.round(cF * 4),
        protKcal: Math.round(pF * 4),
        calTotal: Math.round(calTotal),
        grasasPct: calTotal > 0 ? Math.round((gF * 9 / calTotal) * 100) : 0,
        carbPct: calTotal > 0 ? Math.round((cF * 4 / calTotal) * 100) : 0,
        protPct: calTotal > 0 ? Math.round((pF * 4 / calTotal) * 100) : 0,
      };
    });

    return {
      macros: t,
      micro: microTotals,
      comidasMacros,
      energy: {
        grasasKcal: grasaKcal,
        carbKcal: carbKcal,
        protKcal: protKcal,
        fibraKcal: fibraKcal,
        energyTotal: energyTotal || 1,
      },
    };
  }, [diaVista, selectedPlan, avgDivisor]);

  if (!selectedPlan) {
    return (
      <section className="space-y-4">
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">Sin plan</p>
          <p className="text-sm text-muted-foreground mt-1">
            No hay datos para mostrar.
          </p>
        </div>
      </section>
    );
  }

  const anyTopButton = showNuevaDietaButton || showAsignarButton || showPdfButton;

  void pacienteNombre;

  return (
    <section className="space-y-4">

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1 min-w-0 flex items-stretch rounded-xl border border-border bg-card p-1 overflow-x-auto scrollbar-thin touch-scroll-x">
          <button
            type="button"
            onClick={() => {
              if (vista === "resumen") {
                setSelectedDayKey("TODOS");
                setVista("plan");
              } else {
                setSelectedDayKey("TODOS");
              }
            }}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              isTodos && vista !== "resumen"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            Todas
          </button>
          {DIA_KEYS.map((key) => {
            const exists = diasDisponibles.some((d) => d.dia === key);
            const isActive = !isTodos && selectedDayKey === key && vista !== "resumen";
            return (
              <button
                key={key}
                type="button"
                disabled={!exists}
                onClick={() => {
                  if (!exists) return;
                  setSelectedDayKey(key);
                  if (vista === "resumen") setVista("plan");
                }}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  !exists && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
                )}
              >
                {DIA_LABELS[key]}
              </button>
            );
          })}
        </div>

        {anyTopButton && (
          <div className="flex items-center gap-2 shrink-0">
            {showNuevaDietaButton && (
              <Link
                href={`/dietas/nuevo?pacienteId=${pacienteId}`}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors"
                title="Crear nueva dieta"
              >
                <Plus className="w-4 h-4" />
              </Link>
            )}

            {showAsignarButton && (
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
            )}

            {showPdfButton && (
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
            )}
          </div>
        )}

        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card p-1 shrink-0">
          <button
            type="button"
            onClick={() => setVista("resumen")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              vista === "resumen"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Resumen
          </button>
          <button
            type="button"
            onClick={() => setVista("plan")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              vista === "plan"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            Plan
          </button>
          <button
            type="button"
            onClick={() => setVista("analisis")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              vista === "analisis"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60"
            )}
          >
            <PieChartIcon className="w-4 h-4" />
            Análisis
          </button>
        </div>
      </div>

      {/* Objetivos de macros */}
      {selectedPlan && (() => {
        const { caloriasObjetivo: co, proteinasObjetivo: po, carbohidratosObjetivo: cho, grasasObjetivo: go } = selectedPlan;
        const hayObjetivos = co != null || po != null || cho != null || go != null;
        if (!hayObjetivos) return null;
        return (
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <span className="font-semibold text-muted-foreground uppercase tracking-wide">Objetivos</span>
            {co != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                <Flame className="w-3 h-3" />{co} kcal
              </span>
            )}
            {po != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                {po}g proteínas
              </span>
            )}
            {cho != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-medium">
                {cho}g carbos
              </span>
            )}
            {go != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 font-medium">
                {go}g grasas
              </span>
            )}
          </div>
        );
      })()}

      {selectedPlan && totals ? (
        vista === "resumen" ? (
          <ResumenSemanal
            plan={selectedPlan}
            onSelectDay={(dayKey) => {
              setSelectedDayKey(dayKey);
              setVista("plan");
            }}
          />
        ) : vista === "plan" ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
            <div className="bg-card rounded-xl border border-border p-4">
              {showPlanSelector && (
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-1.5">Dieta del paciente</p>
                    <div ref={planSelectWrapRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setPlanSelectOpen((v) => !v)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate font-semibold">{selectedPlan?.nombre || "—"}</span>
                          {selectedPlan?.caloriasObjetivo != null && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium shrink-0">
                              <Flame className="w-3 h-3" />{selectedPlan.caloriasObjetivo}
                            </span>
                          )}
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                      {planSelectOpen && (
                        <div className="absolute left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg overflow-y-auto max-h-64">
                          <button
                            type="button"
                            onClick={() => setPlanSelectOpen(false)}
                            className="w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-muted/60 text-sm bg-primary/5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{selectedPlan.nombre}</span>
                              {selectedPlan.caloriasObjetivo != null && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"><Flame className="w-2.5 h-2.5 inline" /> {selectedPlan.caloriasObjetivo}</span>
                              )}
                            </div>
                            <Check className="w-4 h-4 text-primary shrink-0" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/dietas/${selectedPlan.id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium shrink-0 self-end"
                  >
                    Abrir
                  </Link>
                </div>
              )}


              <div className="space-y-4">
                {diasVisible.length > 0 ? (
                  isTodos ? (
                    diasVisible.map((dia) => (
                      <div key={dia.id}>
                        <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {DIA_LABELS[dia.dia] || dia.dia}
                        </h2>
                        <PlanEditor
                          showHeader={false}
                          compactHeader
                          showDayHeader={false}
                          showAnalisis={false}
                          readOnly={readOnly}
                          localCallbacks={localCallbacks}
                          planId={selectedPlan.id}
                          planNombre={selectedPlan.nombre}
                          dias={[dia as any]}
                          objetivos={{
                            calorias: selectedPlan.caloriasObjetivo ?? undefined,
                            proteinas: selectedPlan.proteinasObjetivo ?? undefined,
                            carbohidratos: selectedPlan.carbohidratosObjetivo ?? undefined,
                            grasas: selectedPlan.grasasObjetivo ?? undefined,
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <PlanEditor
                      showHeader={false}
                      compactHeader
                      showDayHeader={false}
                      showAnalisis={false}
                      readOnly={readOnly}
                      localCallbacks={localCallbacks}
                      planId={selectedPlan.id}
                      planNombre={selectedPlan.nombre}
                      dias={[diasVisible[0] as any]}
                      objetivos={{
                        calorias: selectedPlan.caloriasObjetivo ?? undefined,
                        proteinas: selectedPlan.proteinasObjetivo ?? undefined,
                        carbohidratos: selectedPlan.carbohidratosObjetivo ?? undefined,
                        grasas: selectedPlan.grasasObjetivo ?? undefined,
                      }}
                    />
                  )
                ) : (
                  <div className="text-sm text-muted-foreground">No hay días para mostrar.</div>
                )}
              </div>
            </div>

            <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-base font-semibold mb-4">Análisis global</h4>

              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground font-medium flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> Energía</span>
                  <span className="font-bold tabular-nums text-sm">{Math.round(totals.macros.calorias)} <span className="text-muted-foreground font-normal text-xs">/ {Math.round((totals.energy.energyTotal || 1) / 1)} kcal</span></span>
                </div>
                <div className="h-3 bg-purple-100/60 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-300 rounded-full" style={{ width: `${Math.min(100, (totals.macros.calorias / Math.max(totals.macros.calorias * 1.15, 1)) * 100)}%` }} />
                </div>
              </div>

              {(() => {
                const energySinFibra = totals.energy.grasasKcal + totals.energy.carbKcal + totals.energy.protKcal || 1;
                const pieData = [
                  { name: "Grasa", value: totals.energy.grasasKcal, color: MACRO_COLORS.grasas, actualG: totals.macros.grasas, actualKcal: Math.round(totals.energy.grasasKcal), pctActual: Math.round((totals.energy.grasasKcal / energySinFibra) * 100), planG: selectedPlan.grasasObjetivo, planKcal: selectedPlan.grasasObjetivo ? Math.round(selectedPlan.grasasObjetivo * 9) : null, pctPlan: selectedPlan.grasasObjetivo && selectedPlan.caloriasObjetivo ? Math.round((selectedPlan.grasasObjetivo * 9 / selectedPlan.caloriasObjetivo) * 100) : null },
                  { name: "Hidratos", value: totals.energy.carbKcal, color: MACRO_COLORS.carbohidratos, actualG: totals.macros.carbohidratos, actualKcal: Math.round(totals.energy.carbKcal), pctActual: Math.round((totals.energy.carbKcal / energySinFibra) * 100), planG: selectedPlan.carbohidratosObjetivo, planKcal: selectedPlan.carbohidratosObjetivo ? Math.round(selectedPlan.carbohidratosObjetivo * 4) : null, pctPlan: selectedPlan.carbohidratosObjetivo && selectedPlan.caloriasObjetivo ? Math.round((selectedPlan.carbohidratosObjetivo * 4 / selectedPlan.caloriasObjetivo) * 100) : null },
                  { name: "Proteína", value: totals.energy.protKcal, color: MACRO_COLORS.proteinas, actualG: totals.macros.proteinas, actualKcal: Math.round(totals.energy.protKcal), pctActual: Math.round((totals.energy.protKcal / energySinFibra) * 100), planG: selectedPlan.proteinasObjetivo, planKcal: selectedPlan.proteinasObjetivo ? Math.round(selectedPlan.proteinasObjetivo * 4) : null, pctPlan: selectedPlan.proteinasObjetivo && selectedPlan.caloriasObjetivo ? Math.round((selectedPlan.proteinasObjetivo * 4 / selectedPlan.caloriasObjetivo) * 100) : null },
                ];
                return (
              <div className="flex items-start gap-4">
                <div className="w-[150px] h-[150px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart onMouseLeave={() => setHoveredMacro(null)}>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        innerRadius={65}
                        outerRadius={72}
                        paddingAngle={1}
                        startAngle={90}
                        endAngle={-270}
                        isAnimationActive={false}
                        style={{ pointerEvents: "none" }}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={`outer-${i}`} fill={entry.color} opacity={0.2} style={{ pointerEvents: "none" }} />
                        ))}
                      </Pie>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        innerRadius={18}
                        outerRadius={58}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                        activeShape={(props: any) => {
                          const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                          return <Sector cx={cx} cy={cy} innerRadius={innerRadius - 2} outerRadius={outerRadius + 3} startAngle={startAngle} endAngle={endAngle} fill={fill} />;
                        }}
                        onMouseEnter={(_: any, index: number) => setHoveredMacro(index)}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} opacity={hoveredMacro === null ? 1 : hoveredMacro === i ? 1 : 0.25} />
                        ))}
                      </Pie>
                      <Tooltip
                        position={{ x: -30, y: 140 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-card border border-border/30 rounded-2xl shadow-xl py-2.5 px-4 text-xs whitespace-nowrap space-y-1.5">
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full border-2 shrink-0" style={{ borderColor: d.color }} />
                                <span className="font-semibold px-2 py-0.5 rounded-full text-[11px]" style={{ color: d.color, background: d.color + "22" }}>Actual</span>
                                <span className="tabular-nums font-semibold">{d.pctActual}%</span>
                                <span className="tabular-nums">{d.actualKcal} kcal</span>
                                <span className="tabular-nums">{Math.round(d.actualG)} g</span>
                              </div>
                              {d.planG != null && (
                                <div className="flex items-center gap-2.5">
                                  <span className="w-5 h-5 rounded-full border-2 opacity-30 shrink-0" style={{ borderColor: d.color }} />
                                  <span className="font-semibold text-muted-foreground text-[11px]">Planeado</span>
                                  <span className="tabular-nums font-semibold text-muted-foreground">{d.pctPlan ?? "—"}%</span>
                                  <span className="tabular-nums text-muted-foreground">{d.planKcal ?? "—"} kcal</span>
                                  <span className="tabular-nums text-muted-foreground">{d.planG} g</span>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-3 pt-1">
                  {[
                    { key: "grasas", label: "Grasa", value: totals.macros.grasas, kcal: totals.energy.grasasKcal, color: MACRO_COLORS.grasas, bgColor: "bg-yellow-50 dark:bg-yellow-500/10" },
                    { key: "carbohidratos", label: "Hidratos de Carbono", value: totals.macros.carbohidratos, kcal: totals.energy.carbKcal, color: MACRO_COLORS.carbohidratos, bgColor: "bg-orange-50 dark:bg-orange-500/10" },
                    { key: "proteinas", label: "Proteína", value: totals.macros.proteinas, kcal: totals.energy.protKcal, color: MACRO_COLORS.proteinas, bgColor: "bg-blue-50 dark:bg-blue-500/10" },
                    { key: "fibra", label: "Fibra alimentaria", value: totals.macros.fibra, kcal: totals.energy.fibraKcal, color: MACRO_COLORS.fibra, bgColor: "bg-emerald-50 dark:bg-emerald-500/10" },
                  ].map((row, rowIdx) => {
                    const pct = (row.kcal / totals.energy.energyTotal) * 100;
                    return (
                      <div key={row.key} style={{ transition: "opacity 0.2s", opacity: hoveredMacro === null ? 1 : hoveredMacro === rowIdx ? 1 : 0.25 }}>
                        <div className="flex items-center justify-between gap-2 text-xs mb-0.5">
                          <span className="text-foreground font-medium flex items-center gap-1.5">
                            {row.key === "grasas" && <Droplets className="w-3 h-3" />}
                            {row.key === "carbohidratos" && <Circle className="w-3 h-3" />}
                            {row.key === "proteinas" && <Diamond className="w-3 h-3" />}
                            {row.key === "fibra" && <Triangle className="w-3 h-3" />}
                            {row.label}
                          </span>
                          <span className="font-bold tabular-nums">{row.value.toFixed(1)} g</span>
                        </div>
                        <div className={`h-3 ${row.bgColor} rounded-full overflow-hidden`}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: row.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
                );
              })()}
            </div>

            {(() => {
              const meals = totals.comidasMacros.filter(
                (c) => c.grasasKcal + c.carbKcal + c.protKcal > 0
              );
              const VISIBLE = 4;
              const offset = comidaChartOffset;
              const setOffset = setComidaChartOffset;
              const canPrev = offset > 0;
              const canNext = offset + VISIBLE < meals.length;
              const visible = meals.slice(offset, offset + VISIBLE);

              return meals.length > 0 ? (
                <div className="bg-card rounded-xl border border-border p-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Comidas</h4>
                    {meals.length > VISIBLE && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setOffset(Math.max(0, offset - 1))}
                          disabled={!canPrev}
                          className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOffset(Math.min(meals.length - VISIBLE, offset + 1))}
                          disabled={!canNext}
                          className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(visible.length, VISIBLE)}, 1fr)` }}>
                    {visible.map((meal) => (
                      <div key={meal.tipo} className="relative group flex flex-col items-center gap-1 cursor-pointer">
                        <div className="w-[60px] h-[60px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { value: meal.grasasKcal || 0.01 },
                                  { value: meal.carbKcal || 0.01 },
                                  { value: meal.protKcal || 0.01 },
                                ]}
                                dataKey="value"
                                innerRadius={14}
                                outerRadius={26}
                                paddingAngle={2}
                                startAngle={90}
                                endAngle={-270}
                                isAnimationActive={false}
                              >
                                <Cell fill={MACRO_COLORS.grasas} />
                                <Cell fill={MACRO_COLORS.carbohidratos} />
                                <Cell fill={MACRO_COLORS.proteinas} />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <span className="text-xs text-muted-foreground text-center leading-tight">{meal.label}</span>

                        <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                          <div className="bg-card border border-border/30 rounded-2xl shadow-xl p-3 whitespace-nowrap text-[11px]">
                            <div className="grid grid-cols-[auto_auto_auto_auto] gap-x-3 gap-y-1.5 items-center">
                              <span className="font-semibold px-2 py-0.5 rounded-full" style={{ color: MACRO_COLORS.grasas, background: MACRO_COLORS.grasas + "22" }}>Grasa</span>
                              <span className="tabular-nums text-right">{meal.grasasKcal} kcal</span>
                              <span className="tabular-nums text-right">{meal.grasasPct}%</span>
                              <span className="tabular-nums text-right">{meal.grasasG} g</span>

                              <span className="font-semibold px-2 py-0.5 rounded-full" style={{ color: MACRO_COLORS.carbohidratos, background: MACRO_COLORS.carbohidratos + "22" }}>H. Carbono</span>
                              <span className="tabular-nums text-right">{meal.carbKcal} kcal</span>
                              <span className="tabular-nums text-right">{meal.carbPct}%</span>
                              <span className="tabular-nums text-right">{meal.carbG} g</span>

                              <span className="font-semibold px-2 py-0.5 rounded-full" style={{ color: MACRO_COLORS.proteinas, background: MACRO_COLORS.proteinas + "22" }}>Proteína</span>
                              <span className="tabular-nums text-right">{meal.protKcal} kcal</span>
                              <span className="tabular-nums text-right">{meal.protPct}%</span>
                              <span className="tabular-nums text-right">{meal.protG} g</span>
                            </div>
                            <div className="flex items-center gap-3 pt-2 mt-2 border-t border-border/30">
                              <span className="font-semibold text-muted-foreground">Energía</span>
                              <span className="tabular-nums font-semibold">{meal.calTotal} kcal</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            <div className="bg-card rounded-xl border border-border p-4 mt-4">
              <div className="flex items-center justify-center mb-3">
                <span className="text-xs font-semibold text-muted-foreground border border-border rounded-full px-3 py-1">
                  ↑ DDR
                </span>
              </div>
              <div className="space-y-0">
                {[
                  { key: "acidoPantotenico", label: "Ác. Pantoténico", ddr: 5, unit: "mg" },
                  { key: "calcio", label: "Calcio", ddr: 1000, unit: "mg" },
                  { key: "cinc", label: "Cinc", ddr: 8, unit: "mg" },
                  { key: "cobre", label: "Cobre", ddr: 0.9, unit: "mg" },
                  { key: "colina", label: "Colina", ddr: 425, unit: "mg" },
                  { key: "fluor", label: "Flúor", ddr: 3000, unit: "ug" },
                  { key: "folato", label: "Folato", ddr: 400, unit: "ug" },
                  { key: "fosforo", label: "Fósforo", ddr: 700, unit: "mg" },
                  { key: "hierro", label: "Hierro", ddr: 18, unit: "mg" },
                  { key: "magnesio", label: "Magnesio", ddr: 320, unit: "mg" },
                  { key: "manganeso", label: "Manganeso", ddr: 1.8, unit: "mg" },
                  { key: "niacina", label: "Niacina", ddr: 14, unit: "mg" },
                  { key: "potasio", label: "Potasio", ddr: 4700, unit: "mg" },
                  { key: "riboflavina", label: "Riboflavina", ddr: 1.1, unit: "mg" },
                  { key: "selenio", label: "Selenio", ddr: 55, unit: "ug" },
                  { key: "sodio", label: "Sodio", ddr: 1500, unit: "mg" },
                  { key: "tiamina", label: "Tiamina", ddr: 1.1, unit: "mg" },
                  { key: "vitaminaA", label: "Vitamina A", ddr: 700, unit: "ug" },
                  { key: "vitaminaB12", label: "Vitamina B12", ddr: 2.4, unit: "ug" },
                  { key: "vitaminaB6", label: "Vitamina B6", ddr: 1.3, unit: "mg" },
                  { key: "vitaminaC", label: "Vitamina C", ddr: 75, unit: "mg" },
                  { key: "vitaminaD", label: "Vitamina D", ddr: 15, unit: "ug" },
                  { key: "vitaminaE", label: "Vitamina E", ddr: 15, unit: "mg" },
                  { key: "vitaminaK", label: "Vitamina K", ddr: 90, unit: "ug" },
                ].map((row) => {
                  const actual = totals.micro[row.key] || 0;
                  const pct = row.ddr > 0 ? Math.min((actual / row.ddr) * 100, 200) : 0;
                  return (
                    <div
                      key={row.key}
                      className="flex items-center gap-1.5 px-2 py-2.5 border-b border-border/40 last:border-0"
                    >
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{row.label}</span>
                      <span className="text-xs font-bold tabular-nums w-10 text-right shrink-0">
                        {actual.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 w-16">
                        / {row.ddr} {row.unit}
                      </span>
                      <div className="flex-1 relative h-2.5 bg-muted/40 rounded-full overflow-hidden">
                        <div className="absolute left-1/2 top-0 h-full w-px border-l border-dashed border-muted-foreground/30 z-10" />
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${Math.min(pct / 2, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {isTodos && (
              <p className="text-xs italic text-muted-foreground text-center">
                Mostrando media diaria
              </p>
            )}
            </div>
          </div>
        ) : (
          (() => {
            const calObj = selectedPlan.caloriasObjetivo ?? totals.macros.calorias;
            const protObj = selectedPlan.proteinasObjetivo ?? totals.macros.proteinas;
            const carbObj = selectedPlan.carbohidratosObjetivo ?? totals.macros.carbohidratos;
            const grasObj = selectedPlan.grasasObjetivo ?? totals.macros.grasas;
            const fibraObj = totals.macros.fibra;

            const MEAL_COLORS = ["#60a5fa","#93c5fd","#fdba74","#fbbf24","#fde68a","#d9f99d"];
            const mealsWithEnergy = totals.comidasMacros.filter(c => c.calTotal > 0);
            const mealsWithProtein = totals.comidasMacros.filter(c => c.protG > 0);

            const energySinFibra = totals.energy.grasasKcal + totals.energy.carbKcal + totals.energy.protKcal || 1;
            const macroPieData = [
              { name: "Grasa", value: totals.energy.grasasKcal, color: MACRO_COLORS.grasas },
              { name: "Hidratos", value: totals.energy.carbKcal, color: MACRO_COLORS.carbohidratos },
              { name: "Proteína", value: totals.energy.protKcal, color: MACRO_COLORS.proteinas },
            ];

            const CATEGORIA_LABELS: Record<string, string> = {
              FRUTAS: "Frutas", VERDURAS: "Verduras", CEREALES: "Cereales",
              LEGUMBRES: "Legumbres", CARNES: "Carnes", PESCADOS: "Pescados",
              LACTEOS: "Lácteos y derivados", HUEVOS: "Huevos y derivados", FRUTOS_SECOS: "Nueces y semillas",
              ACEITES: "Aceites y grasas", BEBIDAS: "Bebidas", CONDIMENTOS: "Condimentos y salsas",
              DULCES: "Dulces y repostería", OTROS: "Otros alimentos",
            };
            const CAT_COLORS = ["#93c5fd","#bfdbfe","#fbbf24","#fde68a","#10b981","#6ee7b7","#c4b5fd","#fdba74","#f9a8d4","#86efac","#67e8f9","#a78bfa","#fb923c","#fca5a5"];
            const catMap = new Map<string, number>();
            if (diaVista) {
              for (const comida of diaVista.comidas) {
                for (const item of comida.alimentos) {
                  const cat = (item.alimento as Record<string, unknown> | null)?.categoria as string | undefined;
                  if (cat) {
                    catMap.set(cat, (catMap.get(cat) || 0) + 1);
                  }
                }
              }
            }
            const catPieData = Array.from(catMap.entries())
              .map(([cat, count], i) => ({ name: CATEGORIA_LABELS[cat] || cat, value: count, color: CAT_COLORS[i % CAT_COLORS.length] }))
              .sort((a, b) => b.value - a.value);

            const TIPO_LABELS_TABLE: Record<string, string> = {
              DESAYUNO: "Desayuno", MEDIA_MANANA: "Media mañana", ALMUERZO: "Comida",
              MERIENDA: "Merienda", CENA: "Cena", RECENA: "Recena",
            };
            const allFoods: { nombre: string; calorias: number; comida: string }[] = [];
            if (diaVista) {
              for (const comida of diaVista.comidas) {
                for (const item of comida.alimentos) {
                  if (item.alimento) {
                    const kcal = Math.round((item.alimento.calorias * convertirAGramos(item.cantidad, item.unidad, item.alimento.porcion || 100)) / 100);
                    allFoods.push({ nombre: item.alimento.nombre, calorias: kcal, comida: TIPO_LABELS_TABLE[comida.tipo] || comida.tipo });
                  } else if (item.receta) {
                    const kcal = Math.round(item.receta.calorias * item.cantidad);
                    allFoods.push({ nombre: item.receta.nombre, calorias: kcal, comida: TIPO_LABELS_TABLE[comida.tipo] || comida.tipo });
                  }
                }
              }
            }
            allFoods.sort((a, b) => b.calorias - a.calorias);
            const FOODS_PER_PAGE = 6;
            const foodPages = Math.max(1, Math.ceil(allFoods.length / FOODS_PER_PAGE));
            const foodsVisible = allFoods.slice(foodTablePage * FOODS_PER_PAGE, (foodTablePage + 1) * FOODS_PER_PAGE);

            const DDR_TABLE = [
              { key: "acidoPantotenico", label: "Ác. Pantoténico", ddr: 5, unit: "mg" },
              { key: "calcio", label: "Calcio", ddr: 1000, unit: "mg" },
              { key: "cinc", label: "Cinc", ddr: 8, unit: "mg" },
              { key: "cobre", label: "Cobre", ddr: 0.9, unit: "mg" },
              { key: "colina", label: "Colina", ddr: 425, unit: "mg" },
              { key: "fluor", label: "Flúor", ddr: 3000, unit: "ug" },
              { key: "folato", label: "Folato", ddr: 400, unit: "ug" },
              { key: "fosforo", label: "Fósforo", ddr: 700, unit: "mg" },
              { key: "hierro", label: "Hierro", ddr: 18, unit: "mg" },
              { key: "magnesio", label: "Magnesio", ddr: 320, unit: "mg" },
              { key: "manganeso", label: "Manganeso", ddr: 1.8, unit: "mg" },
              { key: "niacina", label: "Niacina", ddr: 14, unit: "mg" },
              { key: "potasio", label: "Potasio", ddr: 4700, unit: "mg" },
              { key: "riboflavina", label: "Riboflavina", ddr: 1.1, unit: "mg" },
              { key: "selenio", label: "Selenio", ddr: 55, unit: "ug" },
              { key: "sodio", label: "Sodio", ddr: 1500, unit: "mg" },
              { key: "tiamina", label: "Tiamina", ddr: 1.1, unit: "mg" },
              { key: "vitaminaA", label: "Vitamina A", ddr: 700, unit: "ug" },
              { key: "vitaminaB12", label: "Vitamina B12", ddr: 2.4, unit: "ug" },
              { key: "vitaminaB6", label: "Vitamina B6", ddr: 1.3, unit: "mg" },
              { key: "vitaminaC", label: "Vitamina C", ddr: 75, unit: "mg" },
              { key: "vitaminaD", label: "Vitamina D", ddr: 15, unit: "ug" },
              { key: "vitaminaE", label: "Vitamina E", ddr: 15, unit: "mg" },
              { key: "vitaminaK", label: "Vitamina K", ddr: 90, unit: "ug" },
            ];
            const microLeft = DDR_TABLE.slice(0, 12);
            const microRight = DDR_TABLE.slice(12);

            return (
          <div className="space-y-4">
            {isTodos && (
              <p className="text-xs italic text-muted-foreground text-right">
                Mostrando media diaria
              </p>
            )}
            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-base font-semibold mb-4">Análisis global</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {[
                  { icon: <Flame className="w-4 h-4" />, label: "Energía", value: Math.round(totals.macros.calorias), obj: Math.round(calObj), unit: "kcal", color: "#b197fc", bg: "bg-purple-50 dark:bg-purple-500/10" },
                  { icon: <Droplets className="w-4 h-4" />, label: "Grasa", value: Math.round(totals.macros.grasas * 10) / 10, obj: Math.round(grasObj * 10) / 10, unit: "g", color: MACRO_COLORS.grasas, bg: "bg-yellow-50 dark:bg-yellow-500/10" },
                  { icon: <Circle className="w-4 h-4" />, label: "H. Carbono", value: Math.round(totals.macros.carbohidratos * 10) / 10, obj: Math.round(carbObj * 10) / 10, unit: "g", color: MACRO_COLORS.carbohidratos, bg: "bg-orange-50 dark:bg-orange-500/10" },
                  { icon: <Diamond className="w-4 h-4" />, label: "Proteína", value: Math.round(totals.macros.proteinas * 10) / 10, obj: Math.round(protObj * 10) / 10, unit: "g", color: MACRO_COLORS.proteinas, bg: "bg-blue-50 dark:bg-blue-500/10" },
                  { icon: <Triangle className="w-4 h-4" />, label: "Fibra", value: Math.round(totals.macros.fibra * 10) / 10, obj: Math.round(fibraObj * 10) / 10, unit: "g", color: MACRO_COLORS.fibra, bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                ].map((m) => {
                  const pct = m.obj > 0 ? Math.min((m.value / m.obj) * 100, 100) : 0;
                  return (
                    <div key={m.label} className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        {m.icon} {m.label}
                      </div>
                      <div className={`h-2.5 ${m.bg} rounded-full overflow-hidden`}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: m.color }} />
                      </div>
                      <div className="text-xs tabular-nums">
                        <span className="font-bold">{m.value}</span>
                        <span className="text-muted-foreground"> / {m.obj} {m.unit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">Distribución de macronutrientes</h4>
                <div className="flex items-center gap-4">
                  <div className="w-[120px] h-[120px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={macroPieData} dataKey="value" innerRadius={30} outerRadius={55} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                          {macroPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {macroPieData.map((entry) => {
                      const pct = energySinFibra > 0 ? Math.round((entry.value / energySinFibra) * 100) : 0;
                      return (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                          <span className="text-muted-foreground flex-1">{entry.name}</span>
                          <span className="font-bold tabular-nums">{pct}%</span>
                          <span className="text-muted-foreground tabular-nums">{Math.round(entry.value)} kcal</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">Distribución energética</h4>
                <div className="flex items-center gap-4">
                  <div className="w-[120px] h-[120px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={mealsWithEnergy.map((m, i) => ({ name: m.label, value: m.calTotal, color: MEAL_COLORS[i % MEAL_COLORS.length] }))} dataKey="value" innerRadius={30} outerRadius={55} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                          {mealsWithEnergy.map((_, i) => (
                            <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 max-h-[120px] overflow-y-auto">
                    {mealsWithEnergy.map((meal, i) => {
                      const totalEnergy = mealsWithEnergy.reduce((s, m) => s + m.calTotal, 0) || 1;
                      const pct = Math.round((meal.calTotal / totalEnergy) * 100);
                      return (
                        <div key={meal.tipo} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                          <span className="text-muted-foreground flex-1 truncate">{meal.label}</span>
                          <span className="font-bold tabular-nums">{pct}%</span>
                          <span className="text-muted-foreground tabular-nums">{meal.calTotal} kcal</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">Distribución proteica</h4>
                <div className="flex items-center gap-4">
                  <div className="w-[120px] h-[120px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={mealsWithProtein.map((m, i) => ({ name: m.label, value: Math.round(m.protG * 10) / 10, color: MEAL_COLORS[i % MEAL_COLORS.length] }))} dataKey="value" innerRadius={30} outerRadius={55} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                          {mealsWithProtein.map((_, i) => (
                            <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 max-h-[120px] overflow-y-auto">
                    {mealsWithProtein.map((meal, i) => {
                      const totalProt = mealsWithProtein.reduce((s, m) => s + m.protG, 0) || 1;
                      const pct = Math.round((meal.protG / totalProt) * 100);
                      return (
                        <div key={meal.tipo} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                          <span className="text-muted-foreground flex-1 truncate">{meal.label}</span>
                          <span className="font-bold tabular-nums">{pct}%</span>
                          <span className="text-muted-foreground tabular-nums">{meal.protG} g</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">Distribución de las grasas</h4>
                <div className="flex items-center gap-4">
                  <div className="w-[100px] h-[100px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mealsWithEnergy.filter(m => m.grasasG > 0).map((m, i) => ({ name: m.label, value: m.grasasG, color: MEAL_COLORS[i % MEAL_COLORS.length] }))}
                          dataKey="value" innerRadius={25} outerRadius={45} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}
                        >
                          {mealsWithEnergy.filter(m => m.grasasG > 0).map((_, i) => (
                            <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="text-2xl font-bold tabular-nums">{totals.macros.grasas.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">g</span></div>
                    <div className="text-xs text-muted-foreground">{Math.round(totals.energy.grasasKcal)} kcal ({energySinFibra > 0 ? Math.round((totals.energy.grasasKcal / energySinFibra) * 100) : 0}%)</div>
                    <div className="space-y-1 mt-2">
                      {mealsWithEnergy.filter(m => m.grasasG > 0).map((meal, i) => (
                        <div key={meal.tipo} className="flex items-center gap-2 text-[11px]">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                          <span className="text-muted-foreground flex-1 truncate">{meal.label}</span>
                          <span className="tabular-nums font-medium">{meal.grasasG} g</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">Distribución de los hidratos</h4>
                <div className="flex items-center gap-4">
                  <div className="w-[100px] h-[100px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mealsWithEnergy.filter(m => m.carbG > 0).map((m, i) => ({ name: m.label, value: m.carbG, color: MEAL_COLORS[i % MEAL_COLORS.length] }))}
                          dataKey="value" innerRadius={25} outerRadius={45} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}
                        >
                          {mealsWithEnergy.filter(m => m.carbG > 0).map((_, i) => (
                            <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="text-2xl font-bold tabular-nums">{totals.macros.carbohidratos.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">g</span></div>
                    <div className="text-xs text-muted-foreground">{Math.round(totals.energy.carbKcal)} kcal ({energySinFibra > 0 ? Math.round((totals.energy.carbKcal / energySinFibra) * 100) : 0}%)</div>
                    <div className="space-y-1 mt-2">
                      {mealsWithEnergy.filter(m => m.carbG > 0).map((meal, i) => (
                        <div key={meal.tipo} className="flex items-center gap-2 text-[11px]">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                          <span className="text-muted-foreground flex-1 truncate">{meal.label}</span>
                          <span className="tabular-nums font-medium">{meal.carbG} g</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">Grupos de alimentos</h4>
                {catPieData.length > 0 ? (
                  <div className="flex items-start gap-5">
                    <div className="w-[130px] h-[130px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={catPieData} dataKey="value" innerRadius={30} outerRadius={60} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                            {catPieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2 pt-1">
                      {catPieData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <span className="w-3 h-3 rounded shrink-0" style={{ background: entry.color }} />
                          <span className="text-muted-foreground">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sin datos de categorías.</p>
                )}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-base font-semibold mb-4">Micronutrientes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
                {[microLeft, microRight].map((col, colIdx) => (
                  <div key={colIdx} className="space-y-0">
                    {col.map((row) => {
                      const actual = totals.micro[row.key] || 0;
                      const pct = row.ddr > 0 ? (actual / row.ddr) * 100 : 0;
                      const maxScale = 220;
                      const barW = Math.min((pct / maxScale) * 100, 100);
                      const ddrLinePos = (100 / maxScale) * 100;
                      return (
                        <div key={row.key} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                          <span className="text-[11px] text-muted-foreground w-28 shrink-0 truncate">{row.label}</span>
                          <div className="flex-1 relative h-3 bg-muted/30 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${barW}%`, background: pct >= 100 ? "#818cf8" : "#a5b4fc" }}
                            />
                            <div
                              className="absolute top-0 h-full w-px border-l border-dashed border-muted-foreground/50 z-10"
                              style={{ left: `${Math.min(ddrLinePos, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] tabular-nums font-medium w-14 text-right shrink-0">{Math.round(pct)}%</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className={showAguaEjercicio ? "grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-4" : "grid grid-cols-1 gap-4"}>
              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-4">Distribución de macronutrientes por comida</h4>
                <div className={showAguaEjercicio ? "grid grid-cols-2 sm:grid-cols-3 gap-4" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6"}>
                  {totals.comidasMacros.filter(m => m.calTotal > 0).map((meal) => {
                    const big = !showAguaEjercicio;
                    const size = big ? 140 : 70;
                    const innerR = big ? 38 : 16;
                    const outerR = big ? 66 : 30;
                    return (
                    <div key={meal.tipo} className="flex flex-col items-center gap-2">
                      <div style={{ width: size, height: size }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { value: meal.grasasKcal || 0.01 },
                                { value: meal.carbKcal || 0.01 },
                                { value: meal.protKcal || 0.01 },
                              ]}
                              dataKey="value" innerRadius={innerR} outerRadius={outerR} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}
                            >
                              <Cell fill={MACRO_COLORS.grasas} />
                              <Cell fill={MACRO_COLORS.carbohidratos} />
                              <Cell fill={MACRO_COLORS.proteinas} />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <span className={`font-medium text-center leading-tight ${big ? "text-sm" : "text-xs"}`}>{meal.label}</span>
                      <span className={`text-muted-foreground tabular-nums ${big ? "text-xs" : "text-[10px]"}`}>{meal.calTotal} kcal</span>
                      <div className={`flex items-center gap-2 text-muted-foreground tabular-nums ${big ? "text-xs" : "text-[10px]"}`}>
                        <span style={{ color: MACRO_COLORS.grasas }}>G {meal.grasasPct}%</span>
                        <span style={{ color: MACRO_COLORS.carbohidratos }}>C {meal.carbPct}%</span>
                        <span style={{ color: MACRO_COLORS.proteinas }}>P {meal.protPct}%</span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {showAguaEjercicio && (
              <div className="space-y-4">
                <div className="bg-card rounded-xl border border-border p-5">
                  <h4 className="text-sm font-semibold mb-4">Agua</h4>
                  {(() => {
                    const pesoKg = pacientePeso || 70;
                    const aguaTotal = Math.round((pesoKg * 35) / 10) / 100;
                    const aguaComidas = Math.round(aguaTotal * 0.1 * 100) / 100;
                    const aguaEntre = Math.round((aguaTotal - aguaComidas) * 100) / 100;
                    return (
                      <div className="flex items-center gap-4">
                        <div className="w-[70px] h-[70px] shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={[{ value: aguaEntre }, { value: aguaComidas }]} dataKey="value" innerRadius={18} outerRadius={30} startAngle={90} endAngle={-270} isAnimationActive={false}>
                                <Cell fill="#93c5fd" />
                                <Cell fill="#dbeafe" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-3 text-center">
                          <div>
                            <p className="text-lg font-bold">{aguaEntre} L</p>
                            <p className="text-[10px] text-muted-foreground">Entre comidas</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{aguaComidas} L</p>
                            <p className="text-[10px] text-muted-foreground">En las comidas</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{aguaTotal} L</p>
                            <p className="text-[10px] text-muted-foreground">Total</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-card rounded-xl border border-border p-5">
                  <h4 className="text-sm font-semibold mb-4">Ejercicio físico</h4>
                  {(() => {
                    const pesoKg = pacientePeso || 70;
                    const objetivo = pacienteObjetivo || "MANTENIMIENTO";
                    const tmb = Math.round(pesoKg * 24);
                    const factorActividad = objetivo === "DEPORTIVO" ? 1.7 : objetivo === "GANAR_MASA" ? 1.5 : 1.3;
                    const gastoTotal = Math.round(tmb * factorActividad);
                    const minutos = objetivo === "DEPORTIVO" ? 60 : objetivo === "GANAR_MASA" ? 45 : 0;
                    return (
                      <div className="flex items-center gap-4">
                        <div className="w-[70px] h-[70px] shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={[{ value: minutos || 1 }, { value: Math.max(60 - minutos, 1) }]} dataKey="value" innerRadius={18} outerRadius={30} startAngle={90} endAngle={-270} isAnimationActive={false}>
                                <Cell fill="#6ee7b7" />
                                <Cell fill="#ecfdf5" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-3">
                          <div className="text-center">
                            <p className="text-lg font-bold">{minutos} minutos</p>
                            <p className="text-[10px] text-muted-foreground">Actividad física</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{gastoTotal} kcal</p>
                            <p className="text-[10px] text-muted-foreground">Gasto energético diario</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              )}
            </div>

            {showFoodTable && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-sm font-semibold mb-4">Alimentos ordenados por Energía</h4>
              {allFoods.length > 0 ? (
                <>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 font-medium">Nombre</th>
                        <th className="text-right py-2 font-medium pr-3">Energía (kcal)</th>
                        <th className="text-left py-2 font-medium">Comida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foodsVisible.map((food, i) => (
                        <tr key={`${food.nombre}-${i}`} className="border-b border-border/30 last:border-0">
                          <td className="py-2.5 pr-2">{food.nombre}</td>
                          <td className="py-2.5 text-right tabular-nums font-medium pr-3">{food.calorias}</td>
                          <td className="py-2.5 text-muted-foreground">{food.comida}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {foodPages > 1 && (
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-border/30 gap-1">
                      <button onClick={() => setFoodTablePage(Math.max(0, foodTablePage - 1))} disabled={foodTablePage <= 0} className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
                      {Array.from({ length: Math.min(foodPages, 6) }, (_, i) => (
                        <button key={i} onClick={() => setFoodTablePage(i)} className={`w-7 h-7 rounded text-xs font-medium ${i === foodTablePage ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>{i + 1}</button>
                      ))}
                      {foodPages > 6 && <span className="text-xs text-muted-foreground px-1">...</span>}
                      <button onClick={() => setFoodTablePage(Math.min(foodPages - 1, foodTablePage + 1))} disabled={foodTablePage >= foodPages - 1} className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No hay alimentos en este día.</p>
              )}
            </div>
            )}
          </div>
            );
          })()
        )
      ) : null}
    </section>
  );
}

const TIPO_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno",
  MEDIA_MANANA: "Media mañana",
  ALMUERZO: "Almuerzo",
  MERIENDA: "Merienda",
  CENA: "Cena",
  RECENA: "Recena",
};

function macrosDeItem(a: PlanVisualItem) {
  if (a.receta) {
    return {
      calorias: Math.round(a.receta.calorias * a.cantidad * 10) / 10,
      proteinas: Math.round(a.receta.proteinas * a.cantidad * 10) / 10,
      carbohidratos: Math.round(a.receta.carbohidratos * a.cantidad * 10) / 10,
      grasas: Math.round(a.receta.grasas * a.cantidad * 10) / 10,
      fibra: Math.round((a.receta.fibra || 0) * a.cantidad * 10) / 10,
    };
  }
  if (a.alimento) {
    return calcularMacrosPorcion(
      {
        calorias: a.alimento.calorias,
        proteinas: a.alimento.proteinas,
        carbohidratos: a.alimento.carbohidratos,
        grasas: a.alimento.grasas,
        fibra: a.alimento.fibra || 0,
      },
      convertirAGramos(a.cantidad, a.unidad, a.alimento.porcion || 100)
    );
  }
  return { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 };
}

function ResumenSemanal({
  plan,
  onSelectDay,
}: {
  plan: PlanVisualDetalle;
  onSelectDay: (dayKey: string) => void;
}) {
  const diasOrdenados = useMemo(
    () => [...plan.dias].sort((a, b) => DIA_KEYS.indexOf(a.dia as typeof DIA_KEYS[number]) - DIA_KEYS.indexOf(b.dia as typeof DIA_KEYS[number])),
    [plan.dias]
  );

  const semanal = useMemo(() => {
    const allMacros = diasOrdenados.flatMap((d) => d.comidas.flatMap((c) => c.alimentos.map(macrosDeItem)));
    const total = sumarMacros(allMacros);
    const n = Math.max(diasOrdenados.length, 1);
    return {
      calorias: Math.round(total.calorias / n),
      proteinas: Math.round(total.proteinas / n),
      carbohidratos: Math.round(total.carbohidratos / n),
      grasas: Math.round(total.grasas / n),
    };
  }, [diasOrdenados]);

  return (
    <div className="space-y-5">
      {/* Banner de objetivos semanales */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Media diaria de la semana
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tabular-nums">{semanal.calorias}</span>
              <span className="text-sm text-muted-foreground">kcal / día</span>
              {plan.caloriasObjetivo != null && (
                <span className="text-xs text-muted-foreground ml-2">
                  objetivo {plan.caloriasObjetivo}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-sm font-medium">
              Grasa {semanal.grasas} g
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-sm font-medium">
              H. Carbono {semanal.carbohidratos} g
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium">
              Proteína {semanal.proteinas} g
            </span>
          </div>
        </div>
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {diasOrdenados.map((dia) => {
          const macrosList = dia.comidas.flatMap((c) => c.alimentos.map(macrosDeItem));
          const diaTotales = sumarMacros(macrosList);
          const pctCalorias = plan.caloriasObjetivo
            ? Math.min(120, Math.round((diaTotales.calorias / plan.caloriasObjetivo) * 100))
            : null;

          return (
            <button
              key={dia.id}
              type="button"
              onClick={() => onSelectDay(dia.dia)}
              className="group text-left rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h3 className="font-semibold text-foreground">
                    {DIA_LABELS[dia.dia] || dia.dia}
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  Ver día →
                </span>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Energía</span>
                    <span className="text-sm font-bold tabular-nums">
                      {Math.round(diaTotales.calorias)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">kcal</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-primary rounded-full"
                      style={{
                        width: `${
                          pctCalorias ??
                          Math.min(100, Math.round((diaTotales.calorias / Math.max(diaTotales.calorias * 1.1, 1)) * 100))
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1.5 text-center">
                    <p className="text-[10px] font-medium text-yellow-700 dark:text-yellow-400 uppercase">Grasa</p>
                    <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 tabular-nums">
                      {diaTotales.grasas.toFixed(0)}g
                    </p>
                  </div>
                  <div className="rounded-lg bg-orange-50 dark:bg-orange-500/10 px-2 py-1.5 text-center">
                    <p className="text-[10px] font-medium text-orange-700 dark:text-orange-400 uppercase">H. C.</p>
                    <p className="text-sm font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                      {diaTotales.carbohidratos.toFixed(0)}g
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 px-2 py-1.5 text-center">
                    <p className="text-[10px] font-medium text-blue-700 dark:text-blue-400 uppercase">Prot.</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                      {diaTotales.proteinas.toFixed(0)}g
                    </p>
                  </div>
                </div>

                <div className="pt-1 space-y-1.5">
                  {dia.comidas.filter((c) => c.alimentos.length > 0).slice(0, 4).map((comida) => {
                    const previews = comida.alimentos
                      .map((a) => a.alimento?.nombre || a.receta?.nombre || "")
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(", ");
                    return (
                      <div key={comida.id} className="flex items-start gap-2 text-xs">
                        <span className="font-semibold text-muted-foreground w-20 shrink-0">
                          {TIPO_LABELS[comida.tipo] || comida.tipo}
                        </span>
                        <span className="text-foreground/80 flex-1 line-clamp-1">{previews}</span>
                      </div>
                    );
                  })}
                  {dia.comidas.filter((c) => c.alimentos.length === 0).length > 0 && (
                    <p className="text-[10px] text-muted-foreground italic">
                      {dia.comidas.filter((c) => c.alimentos.length === 0).length} comida(s) sin alimentos
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
