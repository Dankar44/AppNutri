"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, Check, X, Calendar } from "lucide-react";
import { actualizarEstadoCita, eliminarCita } from "@/app/actions/citas";
import { toast } from "sonner";

const DIA_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMADA: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETADA: "bg-green-50 text-green-700 border-green-200",
  CANCELADA: "bg-gray-100 text-gray-500 border-gray-200",
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

interface Cita {
  id: string;
  fechaHora: Date | string;
  duracion: number;
  motivo: string | null;
  estado: string;
  notas: string | null;
  paciente: { nombre: string; apellidos: string };
}

interface Props {
  citas: Cita[];
  lunes: string;
}

export function AgendaSemanal({ citas, lunes }: Props) {
  const router = useRouter();

  const lunesDate = new Date(lunes);
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunesDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const citasPorDia = diasSemana.map((dia) => {
    const diaStr = dia.toISOString().split("T")[0];
    return citas.filter((c) => {
      const citaDia = new Date(c.fechaHora).toISOString().split("T")[0];
      return citaDia === diaStr;
    });
  });

  async function handleEstado(citaId: string, estado: "CONFIRMADA" | "COMPLETADA" | "CANCELADA") {
    try {
      await actualizarEstadoCita(citaId, estado);
      toast.success(`Cita ${ESTADO_LABELS[estado].toLowerCase()}`);
      router.refresh();
    } catch {
      toast.error("Error al actualizar estado");
    }
  }

  async function handleEliminar(citaId: string) {
    try {
      await eliminarCita(citaId);
      toast.success("Cita eliminada");
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  function googleCalendarUrl(cita: Cita) {
    const start = new Date(cita.fechaHora);
    const end = new Date(start.getTime() + cita.duracion * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const title = encodeURIComponent(`Consulta: ${cita.paciente.nombre} ${cita.paciente.apellidos}`);
    const details = encodeURIComponent(cita.motivo || "Consulta de nutrición");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
  }

  const hoyStr = new Date().toISOString().split("T")[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {diasSemana.map((dia, i) => {
        const diaStr = dia.toISOString().split("T")[0];
        const isHoy = diaStr === hoyStr;
        return (
          <div key={i} className="min-w-0">
            <div
              className={`text-center text-sm font-semibold py-2 rounded-t-lg border-b border-border ${
                isHoy ? "bg-primary/10 text-primary" : "bg-muted/50"
              }`}
            >
              <p>{DIA_LABELS[i]}</p>
              <p className="text-xs font-normal text-muted-foreground">
                {dia.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </p>
            </div>
            <div className="border-x border-b border-border rounded-b-lg p-2 min-h-[120px] space-y-2">
              {citasPorDia[i].length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">-</p>
              ) : (
                citasPorDia[i].map((cita) => {
                  const hora = new Date(cita.fechaHora).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={cita.id}
                      className={`rounded-lg border p-2 text-xs ${ESTADO_STYLES[cita.estado] || ESTADO_STYLES.PENDIENTE}`}
                    >
                      <div className="flex items-center gap-1 font-semibold mb-1">
                        <Clock className="w-3 h-3" />
                        {hora} ({cita.duracion}min)
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">
                          {cita.paciente.nombre} {cita.paciente.apellidos}
                        </span>
                      </div>
                      {cita.motivo && (
                        <p className="text-[10px] opacity-80 truncate">{cita.motivo}</p>
                      )}
                      {cita.estado === "PENDIENTE" && (
                        <div className="flex gap-1 mt-1.5">
                          <button
                            onClick={() => handleEstado(cita.id, "CONFIRMADA")}
                            className="flex-1 px-1 py-0.5 rounded bg-blue-600 text-white text-[10px] font-medium hover:bg-blue-700"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => handleEstado(cita.id, "CANCELADA")}
                            className="px-1 py-0.5 rounded bg-gray-200 text-gray-600 text-[10px] font-medium hover:bg-gray-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {cita.estado === "CONFIRMADA" && (
                        <button
                          onClick={() => handleEstado(cita.id, "COMPLETADA")}
                          className="w-full mt-1.5 px-1 py-0.5 rounded bg-green-600 text-white text-[10px] font-medium hover:bg-green-700 flex items-center justify-center gap-0.5"
                        >
                          <Check className="w-3 h-3" /> Completar
                        </button>
                      )}
                      {cita.estado !== "CANCELADA" && cita.estado !== "COMPLETADA" && (
                        <a
                          href={googleCalendarUrl(cita)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full mt-1 px-1 py-0.5 rounded bg-white border border-gray-200 text-gray-600 text-[10px] font-medium hover:bg-gray-50 flex items-center justify-center gap-0.5"
                        >
                          <Calendar className="w-3 h-3" /> Google Calendar
                        </a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
