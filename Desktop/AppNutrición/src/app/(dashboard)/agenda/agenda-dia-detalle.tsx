"use client";

import { useRouter } from "next/navigation";
import { X, Clock, User, Check, Calendar } from "lucide-react";
import { actualizarEstadoCita, eliminarCita } from "@/app/actions/citas";
import { toast } from "sonner";

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
  fechaHora: string;
  duracion: number;
  motivo: string | null;
  estado: string;
  notas: string | null;
  paciente: { nombre: string; apellidos: string };
}

interface Props {
  fecha: string;
  citas: Cita[];
  onClose: () => void;
}

export function AgendaDiaDetalle({ fecha, citas, onClose }: Props) {
  const router = useRouter();
  const fechaObj = new Date(fecha + "T12:00:00");
  const fechaFormateada = fechaObj.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleEstado(citaId: string, estado: "CONFIRMADA" | "COMPLETADA" | "CANCELADA") {
    try {
      await actualizarEstadoCita(citaId, estado);
      toast.success(`Cita ${ESTADO_LABELS[estado].toLowerCase()}`);
      router.refresh();
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al actualizar estado");
    }
  }

  async function handleEliminar(citaId: string) {
    try {
      await eliminarCita(citaId);
      toast.success("Cita eliminada");
      router.refresh();
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
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

  return (
    <div className="mt-4 bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
        <h3 className="text-sm font-semibold capitalize">{fechaFormateada}</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {citas.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No hay citas para este día
        </div>
      ) : (
        <div className="divide-y divide-border">
          {citas.map((cita) => {
            const hora = new Date(cita.fechaHora).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const horaFin = new Date(
              new Date(cita.fechaHora).getTime() + cita.duracion * 60000
            ).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

            return (
              <div key={cita.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Hora */}
                <div className="flex items-center gap-2 sm:w-32 flex-shrink-0">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{hora} - {horaFin}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {cita.paciente.nombre} {cita.paciente.apellidos}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ESTADO_STYLES[cita.estado]}`}>
                      {ESTADO_LABELS[cita.estado]}
                    </span>
                  </div>
                  {cita.motivo && (
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">{cita.motivo}</p>
                  )}
                  {cita.notas && (
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6 italic">{cita.notas}</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {cita.estado === "PENDIENTE" && (
                    <>
                      <button
                        onClick={() => handleEstado(cita.id, "CONFIRMADA")}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => handleEstado(cita.id, "CANCELADA")}
                        className="p-1 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {cita.estado === "CONFIRMADA" && (
                    <button
                      onClick={() => handleEstado(cita.id, "COMPLETADA")}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Completar
                    </button>
                  )}
                  {cita.estado !== "CANCELADA" && cita.estado !== "COMPLETADA" && (
                    <a
                      href={googleCalendarUrl(cita)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleEliminar(cita.id)}
                    className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
