"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { asignarPlanComoActual } from "@/app/actions/planes";
import {
  ChevronDown,
  Check,
  Flame,
  CheckCircle2,
  Loader2,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanVisual, type PlanVisualDetalle } from "./plan-visual";

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

type PlanDetalleItem = {
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
    categoria?: string;
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

export function PlanDeAlimentacionTab({
  pacienteId,
  pacienteNombre,
  planes,
  pacientePeso,
  pacienteObjetivo,
}: {
  pacienteId: string;
  pacienteNombre: string;
  planes: PlanDetalle[];
  pacientePeso?: number | null;
  pacienteObjetivo?: string | null;
}) {
  const t = useTranslations("patients.planAlimentacion");
  const router = useRouter();
  const [isPendingAssign, startAssign] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Plan seleccionado: por defecto, el activo; si no hay, el primero.
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const activo = planes.find((p) => p.activo);
    return activo?.id ?? planes[0]?.id ?? "";
  });

  const selectedPlan = useMemo(
    () => planes.find((p) => p.id === selectedPlanId) ?? planes[0] ?? null,
    [planes, selectedPlanId],
  );

  // Solo una dieta puede estar marcada como actual: si hay varias con activo=true (datos antiguos),
  // nos quedamos con la más reciente.
  const planActivoId = useMemo(() => {
    const activos = planes.filter((p) => p.activo);
    if (activos.length === 0) return null;
    const ordenados = [...activos].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return ordenados[0].id;
  }, [planes]);

  const esActivo = selectedPlan?.id === planActivoId;

  useEffect(() => {
    if (!abierto) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = wrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setAbierto(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [abierto]);

  function handleAsignarActual() {
    if (!selectedPlan || esActivo || isPendingAssign) return;
    startAssign(async () => {
      try {
        await asignarPlanComoActual(selectedPlan.id);
        toast.success(t("dietaAsignadaActual"));
        router.refresh();
      } catch {
        toast.error(t("noSePudoAsignar"));
      }
    });
  }

  if (planes.length === 0 || !selectedPlan) {
    return (
      <section className="bg-card rounded-xl border border-border p-8 text-center">
        <p className="text-sm text-muted-foreground mb-3">
          {t("sinPlanAlimentacion")}
        </p>
        <Link
          href={`/dietas/nuevo?pacienteId=${pacienteId}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {t("crearPrimeraDieta")}
        </Link>
      </section>
    );
  }

  const totalPlanes = planes.length;
  const planVisualData: PlanVisualDetalle = {
    id: selectedPlan.id,
    nombre: selectedPlan.nombre,
    caloriasObjetivo: selectedPlan.caloriasObjetivo,
    activo: selectedPlan.activo,
    proteinasObjetivo: selectedPlan.proteinasObjetivo,
    carbohidratosObjetivo: selectedPlan.carbohidratosObjetivo,
    grasasObjetivo: selectedPlan.grasasObjetivo,
    createdAt: selectedPlan.createdAt,
    dias: selectedPlan.dias,
  };

  return (
    <div className="space-y-4">
      {/* Selector de dieta + botón "Marcar como actual" */}
      <div className="flex items-center gap-2 w-full">
        <div ref={wrapRef} className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            className="w-full flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors"
            title={t("dietasPaciente")}
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
              <span className="text-sm sm:text-base font-semibold truncate">{selectedPlan.nombre}</span>
              {esActivo && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  {t("actual")}
                </span>
              )}
              {selectedPlan.caloriasObjetivo != null && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium shrink-0">
                  <Flame className="w-3 h-3" />
                  {selectedPlan.caloriasObjetivo}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0 border-l border-border pl-2.5 ml-1">
              <span className="sm:hidden">{totalPlanes}</span>
              <span className="hidden sm:inline">{t("dietaCount", { count: totalPlanes })}</span>
              <ChevronDown
                className={cn("w-4 h-4 transition-transform", abierto && "rotate-180")}
              />
            </span>
          </button>

          {abierto && (
            <div className="absolute left-0 right-0 mt-1 z-40 bg-card border border-border rounded-lg shadow-lg overflow-y-auto max-h-80">
              <div className="px-3 py-1.5 border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                {t("dietasPaciente")}
              </div>
              {planes.map((p) => {
                const seleccionado = p.id === selectedPlanId;
                const esEsteActivo = p.id === planActivoId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlanId(p.id);
                      setAbierto(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-muted/60 transition-colors",
                      seleccionado && "bg-primary/5",
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-base font-medium">{p.nombre}</span>
                      {esEsteActivo && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          {t("actual")}
                        </span>
                      )}
                      {p.caloriasObjetivo != null && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium shrink-0">
                          <Flame className="w-3 h-3" />
                          {p.caloriasObjetivo}
                        </span>
                      )}
                    </div>
                    {seleccionado && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/dietas/nuevo?pacienteId=${pacienteId}`}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 border border-primary/30 text-primary hover:bg-primary/5"
            title={t("crearNuevoPlanParaPaciente")}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t("nuevoPlan")}</span>
          </Link>

          <button
            type="button"
            onClick={handleAsignarActual}
            disabled={esActivo || isPendingAssign}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 border",
              esActivo
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 cursor-default"
                : "bg-card text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed",
            )}
            title={esActivo ? t("dietaYaMarcada") : t("marcarDietaActual")}
          >
            {isPendingAssign ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{esActivo ? t("marcada") : t("marcarActual")}</span>
          </button>
        </div>
      </div>

      {/* Vista completa del plan (mismo layout que /dietas/[id]) */}
      <PlanVisual
        plan={planVisualData}
        pacienteId={pacienteId}
        pacienteNombre={pacienteNombre}
        pacientePeso={pacientePeso}
        pacienteObjetivo={pacienteObjetivo}
        showPlanSelector={false}
        showPdfButton={false}
        showAsignarButton={false}
        showNuevaDietaButton={false}
        showAguaEjercicio={false}
        showFoodTable={false}
        vistaInicial="plan"
      />
    </div>
  );
}
