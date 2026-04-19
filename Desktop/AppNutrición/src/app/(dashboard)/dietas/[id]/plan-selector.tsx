"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Flame, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { asignarPlanComoActual } from "@/app/actions/planes";

interface PlanItem {
  id: string;
  nombre: string;
  activo: boolean;
  caloriasObjetivo: number | null;
  createdAt: string | Date;
}

interface Props {
  planActualId: string;
  planes: PlanItem[];
}

export function PlanSelector({ planActualId, planes }: Props) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sólo una dieta puede ser la "actual": si hay varias con activo=true
  // (datos antiguos), nos quedamos con la más reciente.
  const planActivoId = useMemo(() => {
    const activos = planes.filter((p) => p.activo);
    if (activos.length === 0) return null;
    const ordenados = [...activos].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return ordenados[0].id;
  }, [planes]);

  const planActual = planes.find((p) => p.id === planActualId) ?? null;
  const esActivo = planActual?.id === planActivoId;

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

  function seleccionar(id: string) {
    setAbierto(false);
    if (id === planActualId) return;
    router.push(`/dietas/${id}`);
  }

  function handleAsignar() {
    if (!planActual || esActivo || pending) return;
    startTransition(async () => {
      try {
        await asignarPlanComoActual(planActual.id);
        toast.success("Dieta asignada como actual");
        router.refresh();
      } catch {
        toast.error("No se pudo asignar como actual");
      }
    });
  }

  const totalPlanes = planes.length;

  return (
    <div className="flex flex-col xs:flex-row xs:items-center gap-2 w-full">
      <div ref={wrapRef} className="relative flex-1 min-w-0">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors"
          title={totalPlanes > 1 ? `Ver las ${totalPlanes} dietas` : "Dietas del paciente"}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="text-base font-semibold truncate">
              {planActual?.nombre ?? "—"}
            </span>
            {esActivo && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Actual
              </span>
            )}
            {planActual?.caloriasObjetivo != null && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium shrink-0">
                <Flame className="w-3 h-3" />
                {planActual.caloriasObjetivo}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0 border-l border-border pl-2.5 ml-1">
            {totalPlanes} <span className="hidden sm:inline">dieta{totalPlanes !== 1 ? "s" : ""}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${abierto ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {abierto && (
          <div className="absolute left-0 right-0 mt-1 z-40 bg-card border border-border rounded-lg shadow-lg overflow-y-auto max-h-80">
            <div className="px-3 py-1.5 border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
              Dietas del paciente
            </div>
            {planes.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Sin dietas.
              </div>
            ) : (
              planes.map((p) => {
                const seleccionado = p.id === planActualId;
                const esEsteElActual = p.id === planActivoId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => seleccionar(p.id)}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-muted/60 transition-colors ${
                      seleccionado ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-base font-medium">{p.nombre}</span>
                      {esEsteElActual && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          Actual
                        </span>
                      )}
                      {p.caloriasObjetivo != null && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium shrink-0">
                          <Flame className="w-3 h-3" />
                          {p.caloriasObjetivo}
                        </span>
                      )}
                    </div>
                    {seleccionado && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleAsignar}
        disabled={esActivo || pending || !planActual}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0 border ${
          esActivo
            ? "bg-muted text-muted-foreground border-border cursor-not-allowed"
            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
        }`}
        title={esActivo ? "Esta dieta ya está marcada como actual" : "Marcar esta dieta como la actual"}
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {esActivo ? "Marcada como actual" : "Marcar como dieta actual"}
        </span>
        <span className="sm:hidden">{esActivo ? "Marcada" : "Marcar"}</span>
      </button>
    </div>
  );
}
