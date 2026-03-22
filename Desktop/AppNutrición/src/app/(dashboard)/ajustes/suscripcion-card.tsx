"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Clock, ArrowUpRight, Check } from "lucide-react";
import { cambiarPlan } from "@/app/actions/suscripcion";
import { toast } from "sonner";

interface Props {
  plan: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string | null;
}

const PLAN_LABELS: Record<string, { nombre: string; precio: string }> = {
  BASICO: { nombre: "Básico", precio: "9,99€/mes" },
  PROFESIONAL: { nombre: "Profesional", precio: "11,99€/mes" },
};

const ESTADO_LABELS: Record<string, { texto: string; color: string }> = {
  ACTIVA: { texto: "Activa", color: "bg-green-50 text-green-700" },
  PRUEBA: { texto: "Periodo de prueba", color: "bg-blue-50 text-blue-700" },
  CANCELADA: { texto: "Cancelada", color: "bg-red-50 text-red-700" },
  EXPIRADA: { texto: "Expirada", color: "bg-gray-100 text-gray-600" },
};

export function SuscripcionCard({ plan, estado, fechaInicio, fechaFin }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const planInfo = PLAN_LABELS[plan] || PLAN_LABELS.BASICO;
  const estadoInfo = ESTADO_LABELS[estado] || ESTADO_LABELS.PRUEBA;
  const otroPlan = plan === "BASICO" ? "PROFESIONAL" : "BASICO";
  const otroPlanInfo = PLAN_LABELS[otroPlan];

  // Calcular días restantes
  let diasRestantes: number | null = null;
  if (fechaFin) {
    const diff = new Date(fechaFin).getTime() - Date.now();
    diasRestantes = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  async function handleCambiarPlan() {
    setLoading(true);
    try {
      await cambiarPlan(otroPlan);
      toast.success(`Plan cambiado a ${otroPlanInfo.nombre}`);
      router.refresh();
    } catch {
      toast.error("Error al cambiar de plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Plan actual */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${plan === "PROFESIONAL" ? "bg-amber-50" : "bg-primary/10"}`}>
            <Crown className={`w-5 h-5 ${plan === "PROFESIONAL" ? "text-amber-600" : "text-primary"}`} />
          </div>
          <div>
            <p className="font-semibold">Plan {planInfo.nombre}</p>
            <p className="text-sm text-muted-foreground">{planInfo.precio}</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${estadoInfo.color}`}>
          {estadoInfo.texto}
        </span>
      </div>

      {/* Días restantes (prueba o suscripción) */}
      {diasRestantes !== null && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${
          diasRestantes <= 3 ? "bg-red-50 text-red-700" : "bg-muted/50"
        }`}>
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">
            {diasRestantes === 0
              ? estado === "PRUEBA"
                ? "Tu prueba gratuita ha expirado"
                : "Tu suscripción ha expirado"
              : estado === "PRUEBA"
                ? `Te quedan ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""} de prueba gratuita`
                : `Tu suscripción se renueva en ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}`}
          </span>
        </div>
      )}

      {/* Info de fechas */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Inicio</p>
          <p className="font-medium">
            {new Date(fechaInicio).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        {fechaFin && (
          <div>
            <p className="text-muted-foreground text-xs">
              {estado === "PRUEBA" ? "Fin de prueba" : "Próxima renovación"}
            </p>
            <p className="font-medium">
              {new Date(fechaFin).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </div>

      {/* Comparativa + cambiar plan */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {plan === "BASICO" ? "Pasa a Profesional" : "Cambiar a Básico"}
            </p>
            <p className="text-xs text-muted-foreground">
              {plan === "BASICO"
                ? "IA, pacientes ilimitados, informes PDF — solo 2€ más"
                : "25 pacientes, sin IA ni informes PDF"}
            </p>
          </div>
          <button
            onClick={handleCambiarPlan}
            disabled={loading}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              plan === "BASICO"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border hover:bg-muted"
            }`}
          >
            {plan === "BASICO" ? (
              <>
                <ArrowUpRight className="w-4 h-4" />
                Mejorar plan
              </>
            ) : (
              "Cambiar a Básico"
            )}
          </button>
        </div>
      </div>

      {/* Comparativa rápida */}
      <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1.5">
        <div className="grid grid-cols-3 gap-2 font-semibold text-muted-foreground">
          <span></span>
          <span className="text-center">Básico</span>
          <span className="text-center">Profesional</span>
        </div>
        {[
          ["Pacientes", "25", "Ilimitados"],
          ["Planes y recetas", "Ilimitados", "Ilimitados"],
          ["Portal paciente", "check", "check"],
          ["Generación con IA", "no", "check"],
          ["Informes PDF", "no", "check"],
          ["Soporte prioritario", "no", "check"],
        ].map(([feature, basico, pro]) => (
          <div key={feature} className="grid grid-cols-3 gap-2 items-center">
            <span>{feature}</span>
            <span className="text-center">
              {basico === "check" ? (
                <Check className="w-3.5 h-3.5 text-green-600 mx-auto" />
              ) : basico === "no" ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                basico
              )}
            </span>
            <span className="text-center">
              {pro === "check" ? (
                <Check className="w-3.5 h-3.5 text-green-600 mx-auto" />
              ) : (
                pro
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
