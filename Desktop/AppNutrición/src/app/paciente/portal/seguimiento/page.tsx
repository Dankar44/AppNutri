"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Loader2, UtensilsCrossed, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";
import {
  getSeguimientoPacienteDia,
  guardarSeguimientoPaciente,
  getComidaDelDiaPaciente,
  type ComidaSeguimiento,
  type ComidaPlanificada,
} from "@/app/actions/seguimiento-paciente";
import {
  TIPOS_ORDEN,
  calcularAguaObjetivo,
} from "@/lib/seguimiento";
import { DateNavigator } from "@/components/paciente/seguimiento/date-navigator";
import { ResumenHero } from "@/components/paciente/seguimiento/resumen-hero";
import { ComidaCard } from "@/components/paciente/seguimiento/comida-card";
import { AguaTracker } from "@/components/paciente/seguimiento/agua-tracker";
import { EjercicioCard } from "@/components/paciente/seguimiento/ejercicio-card";
import { NotasCard } from "@/components/paciente/seguimiento/notas-card";
import { useAutosave } from "@/components/paciente/seguimiento/use-autosave";

const SENSACION_MARKER = /^⟦sensacion:([a-z]+)⟧\n?/;

function extraerSensacion(notas: string): { sensacion: string | null; texto: string } {
  const m = notas.match(SENSACION_MARKER);
  if (!m) return { sensacion: null, texto: notas };
  return { sensacion: m[1], texto: notas.replace(SENSACION_MARKER, "") };
}

function combinarSensacion(sensacion: string | null, texto: string): string {
  if (!sensacion) return texto;
  return `⟦sensacion:${sensacion}⟧\n${texto}`;
}

export default function SeguimientoPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [manualSaving, setManualSaving] = useState(false);

  const [comidasPlan, setComidasPlan] = useState<ComidaPlanificada[]>([]);
  const [pesoKg, setPesoKg] = useState<number | null>(null);

  const [comidasData, setComidasData] = useState<ComidaSeguimiento[]>([]);
  const [aguaML, setAguaML] = useState(0);
  const [ejercicio, setEjercicio] = useState(false);
  const [ejercicioTipo, setEjercicioTipo] = useState("");
  const [ejercicioMinutos, setEjercicioMinutos] = useState(0);
  const [ejercicioDistanciaKm, setEjercicioDistanciaKm] = useState(0);
  const [ejercicioKcal, setEjercicioKcal] = useState(0);
  const [notasTexto, setNotasTexto] = useState("");
  const [sensacion, setSensacion] = useState<string | null>(null);

  const celebracionRef = useRef(false);
  const aguaObjetivo = calcularAguaObjetivo(pesoKg);

  const loadData = useCallback(async () => {
    setLoading(true);
    celebracionRef.current = false;
    try {
      const [planData, seguimiento] = await Promise.all([
        getComidaDelDiaPaciente(fecha),
        getSeguimientoPacienteDia(fecha),
      ]);

      setComidasPlan(planData.comidas);
      setPesoKg(planData.peso);

      if (seguimiento) {
        setAguaML(seguimiento.aguaML || 0);
        setEjercicio(seguimiento.ejercicio || false);
        setEjercicioTipo(seguimiento.ejercicioTipo || "");
        setEjercicioMinutos(seguimiento.ejercicioMinutos || 0);
        setEjercicioDistanciaKm(seguimiento.ejercicioDistanciaKm || 0);
        setEjercicioKcal(seguimiento.ejercicioKcal || 0);
        const { sensacion: s, texto } = extraerSensacion(seguimiento.notas || "");
        setSensacion(s);
        setNotasTexto(texto);
        if (seguimiento.comidasData && Array.isArray(seguimiento.comidasData)) {
          setComidasData(seguimiento.comidasData);
        } else {
          setComidasData(inicializarComidas(planData.comidas));
        }
      } else {
        setAguaML(0);
        setEjercicio(false);
        setEjercicioTipo("");
        setEjercicioMinutos(0);
        setEjercicioDistanciaKm(0);
        setEjercicioKcal(0);
        setNotasTexto("");
        setSensacion(null);
        setComidasData(inicializarComidas(planData.comidas));
      }
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Autosave
  const autosaveValue = useMemo(
    () => ({
      fecha,
      aguaML,
      ejercicio,
      ejercicioTipo,
      ejercicioMinutos,
      ejercicioDistanciaKm,
      ejercicioKcal,
      notasTexto,
      sensacion,
      comidasData,
    }),
    [
      fecha,
      aguaML,
      ejercicio,
      ejercicioTipo,
      ejercicioMinutos,
      ejercicioDistanciaKm,
      ejercicioKcal,
      notasTexto,
      sensacion,
      comidasData,
    ]
  );

  const { status } = useAutosave(
    autosaveValue,
    async (v) => {
      await guardarSeguimientoPaciente(v.fecha, {
        aguaML: v.aguaML,
        ejercicio: v.ejercicio,
        ejercicioMinutos: v.ejercicioMinutos,
        ejercicioKcal: v.ejercicioKcal,
        ejercicioTipo: v.ejercicioTipo || undefined,
        ejercicioDistanciaKm: v.ejercicioDistanciaKm || undefined,
        notas: combinarSensacion(v.sensacion, v.notasTexto) || undefined,
        comidasData: v.comidasData,
      });
    },
    { delayMs: 900, enabled: !loading }
  );

  const totalAlimentos = comidasData.reduce((s, c) => s + c.alimentos.length, 0);
  const alimentosCumplidos = comidasData.reduce(
    (s, c) => s + c.alimentos.filter((a) => a.cumplido).length,
    0
  );

  // Celebración a 100%
  useEffect(() => {
    if (
      !loading &&
      totalAlimentos > 0 &&
      alimentosCumplidos === totalAlimentos &&
      !celebracionRef.current
    ) {
      celebracionRef.current = true;
      toast.success("Día completo", { duration: 3000 });
    }
  }, [alimentosCumplidos, totalAlimentos, loading]);

  function toggleAlimento(comidaIdx: number, alimentoIdx: number) {
    setComidasData((prev) =>
      prev.map((c, ci) =>
        ci !== comidaIdx
          ? c
          : {
              ...c,
              alimentos: c.alimentos.map((a, ai) =>
                ai !== alimentoIdx ? a : { ...a, cumplido: !a.cumplido }
              ),
            }
      )
    );
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        (navigator as Navigator & { vibrate?: (p: number) => boolean }).vibrate?.(12);
      } catch {}
    }
  }

  function updateHoraReal(comidaIdx: number, hora: string) {
    setComidasData((prev) =>
      prev.map((c, ci) => (ci === comidaIdx ? { ...c, horaReal: hora || null } : c))
    );
  }

  function updateNotasComida(comidaIdx: number, value: string) {
    setComidasData((prev) =>
      prev.map((c, ci) => (ci === comidaIdx ? { ...c, notas: value || null } : c))
    );
  }

  async function guardarManual() {
    setManualSaving(true);
    try {
      await guardarSeguimientoPaciente(fecha, {
        aguaML,
        ejercicio,
        ejercicioMinutos,
        ejercicioKcal,
        ejercicioTipo: ejercicioTipo || undefined,
        ejercicioDistanciaKm: ejercicioDistanciaKm || undefined,
        notas: combinarSensacion(sensacion, notasTexto) || undefined,
        comidasData,
      });
      toast.success("Seguimiento guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setManualSaving(false);
    }
  }

  // Atajos de teclado
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
      }
      if (e.key === "ArrowLeft") {
        const d = new Date(fecha + "T12:00:00");
        d.setDate(d.getDate() - 1);
        setFecha(d.toISOString().split("T")[0]);
      } else if (e.key === "ArrowRight") {
        const d = new Date(fecha + "T12:00:00");
        d.setDate(d.getDate() + 1);
        setFecha(d.toISOString().split("T")[0]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fecha]);

  const comidasOrdenadas = TIPOS_ORDEN.map((tipo) =>
    comidasData.findIndex((c) => c.tipo === tipo)
  ).filter((idx) => idx !== -1);

  if (loading) {
    return (
      <div className="pb-8">
        <SeguimientoHeader status="idle" />
        <div className="space-y-4 mt-4">
          <div className="h-40 rounded-2xl bg-muted/40 animate-pulse" />
          <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
          <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
          <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10 space-y-5">
      <SeguimientoHeader status={status} />

      <DateNavigator fecha={fecha} onChange={setFecha} />

      <ResumenHero
        comidasCumplidas={alimentosCumplidos}
        comidasTotal={totalAlimentos}
        aguaML={aguaML}
        aguaObjetivo={aguaObjetivo}
        ejercicio={ejercicio}
        ejercicioMinutos={ejercicioMinutos}
        ejercicioKcal={ejercicioKcal}
      />

      {comidasPlan.length === 0 ? (
        <section className="rounded-2xl border border-border bg-card p-8 text-center">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">Sin plan activo para hoy</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Tu nutricionista aún no te ha asignado un plan alimenticio para este día.
          </p>
        </section>
      ) : (
        <section
          aria-label="Comidas del día"
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground">
                <UtensilsCrossed className="w-5 h-5" strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="text-base font-semibold">Comidas del día</h2>
                <p className="text-[11px] text-muted-foreground">
                  Marca lo que has tomado
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-muted-foreground tabular-nums">
              {alimentosCumplidos}/{totalAlimentos}
            </span>
          </header>
          <div className="divide-y divide-border">
            {comidasOrdenadas.map((comidaIdx) => (
              <ComidaCard
                key={comidasData[comidaIdx].tipo}
                comida={comidasData[comidaIdx]}
                onToggleAlimento={(ai) => toggleAlimento(comidaIdx, ai)}
                onChangeHora={(h) => updateHoraReal(comidaIdx, h)}
                onChangeNotas={(n) => updateNotasComida(comidaIdx, n)}
                embedded
              />
            ))}
          </div>
        </section>
      )}

      <AguaTracker aguaML={aguaML} objetivo={aguaObjetivo} onChange={setAguaML} />

      <EjercicioCard
        ejercicio={ejercicio}
        tipo={ejercicioTipo}
        minutos={ejercicioMinutos}
        distanciaKm={ejercicioDistanciaKm}
        kcal={ejercicioKcal}
        pesoKg={pesoKg}
        onToggle={setEjercicio}
        onTipo={setEjercicioTipo}
        onMinutos={setEjercicioMinutos}
        onDistancia={setEjercicioDistanciaKm}
        onKcal={setEjercicioKcal}
      />

      <NotasCard
        notas={notasTexto}
        onChange={setNotasTexto}
        sensacion={sensacion}
        onSensacion={setSensacion}
      />

      <div className="flex justify-center pt-2">
        <button
          onClick={guardarManual}
          disabled={manualSaving}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 h-11 rounded-xl transition-all disabled:opacity-50 shadow-sm"
        >
          {manualSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {manualSaving ? "Guardando..." : "Guardar ahora"}
        </button>
      </div>
    </div>
  );
}

function SeguimientoHeader({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  return (
    <PageHeader
      icon={BookOpen}
      title="Diario"
      subtitle="Registra cómo te ha ido el día"
      action={<SaveIndicator status={status} />}
    />
  );
}

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;
  const config = {
    saving: {
      icon: <Loader2 className="w-3 h-3 animate-spin" />,
      text: "Guardando…",
      color: "text-muted-foreground",
    },
    saved: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      text: "Guardado",
      color: "text-green-600 dark:text-green-400",
    },
    error: {
      icon: <AlertCircle className="w-3 h-3" />,
      text: "Error",
      color: "text-red-600 dark:text-red-400",
    },
  }[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-medium ${config.color} animate-in fade-in`}
    >
      {config.icon}
      {config.text}
    </span>
  );
}

function inicializarComidas(comidas: ComidaPlanificada[]): ComidaSeguimiento[] {
  return comidas.map((c) => ({
    tipo: c.tipo,
    alimentos: c.alimentos.map((a) => ({
      nombre: a.nombre,
      cantidad: a.cantidad,
      cumplido: false,
    })),
    horaReal: null,
    notas: null,
  }));
}

