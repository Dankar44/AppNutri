"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Clock, User, Check, Calendar, CalendarClock, Loader2 } from "lucide-react";
import { actualizarEstadoCita, eliminarCita } from "@/app/actions/citas";
import {
  aceptarSolicitudCita,
  contraproponerCita,
  rechazarSolicitudCita,
  aceptarContrapropuestaDietista,
  rechazarContrapropuestaDietista,
} from "@/app/actions/citas-flujo";
import { toast } from "sonner";
import { ContraproponerModal } from "./contraproponer-modal";

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMADA: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETADA: "bg-green-50 text-green-700 border-green-200",
  CANCELADA: "bg-gray-100 text-gray-500 border-gray-200",
  CONTRAPROPUESTA: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
  CONTRAPROPUESTA: "Esperando paciente",
};

interface Cita {
  id: string;
  fechaHora: string;
  duracion: number;
  motivo: string | null;
  estado: string;
  notas: string | null;
  origen?: string;
  propuestoPor?: string;
  paciente: { nombre: string; apellidos: string };
}

interface Props {
  fecha: string;
  citas: Cita[];
  onClose: () => void;
}

export function AgendaDiaDetalle({ fecha, citas, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [contraponerId, setContraponerId] = useState<string | null>(null);
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

  function handleAceptarSolicitud(citaId: string) {
    startTransition(async () => {
      try {
        await aceptarSolicitudCita(citaId);
        toast.success("Cita aceptada. El paciente ha sido notificado.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleRechazarSolicitud(citaId: string) {
    startTransition(async () => {
      try {
        await rechazarSolicitudCita(citaId);
        toast.success("Solicitud rechazada. El paciente ha sido notificado.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleAceptarContrapropuestaPaciente(citaId: string) {
    startTransition(async () => {
      try {
        await aceptarContrapropuestaDietista(citaId);
        toast.success("Contrapropuesta aceptada. El paciente ha sido notificado.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleRechazarContrapropuestaPaciente(citaId: string) {
    startTransition(async () => {
      try {
        await rechazarContrapropuestaDietista(citaId);
        toast.success("Contrapropuesta rechazada. El paciente ha sido notificado.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {cita.paciente.nombre} {cita.paciente.apellidos}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ESTADO_STYLES[cita.estado]}`}>
                      {ESTADO_LABELS[cita.estado] ?? cita.estado}
                    </span>
                    {cita.origen === "PACIENTE" && cita.estado === "PENDIENTE" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                        Solicitada por paciente
                      </span>
                    )}
                    {cita.estado === "CONTRAPROPUESTA" && cita.propuestoPor === "PACIENTE" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                        Contrapropuesta del paciente
                      </span>
                    )}
                    {cita.estado === "CONTRAPROPUESTA" && cita.propuestoPor === "DIETISTA" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 font-medium">
                        Esperando al paciente
                      </span>
                    )}
                    {cita.estado === "PENDIENTE" && cita.origen === "DIETISTA" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-medium">
                        Propuesta al paciente
                      </span>
                    )}
                  </div>
                  {cita.motivo && (
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">{cita.motivo}</p>
                  )}
                  {cita.notas && (
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6 italic">{cita.notas}</p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                  {cita.estado === "PENDIENTE" && cita.origen === "PACIENTE" ? (
                    // Flujo de SOLICITUD del paciente: aceptar / contraponer / rechazar
                    <>
                      <button
                        onClick={() => handleAceptarSolicitud(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Aceptar
                      </button>
                      <button
                        onClick={() => setContraponerId(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-60 transition-colors"
                      >
                        <CalendarClock className="w-3.5 h-3.5" /> Otra fecha
                      </button>
                      <button
                        onClick={() => handleRechazarSolicitud(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-300 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-60 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Rechazar
                      </button>
                    </>
                  ) : cita.estado === "CONTRAPROPUESTA" && cita.propuestoPor === "PACIENTE" ? (
                    // Paciente ha contrapuesto otra fecha → nutri acepta / contrapone / rechaza
                    <>
                      <button
                        onClick={() => handleAceptarContrapropuestaPaciente(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Aceptar
                      </button>
                      <button
                        onClick={() => setContraponerId(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-60 transition-colors"
                      >
                        <CalendarClock className="w-3.5 h-3.5" /> Otra fecha
                      </button>
                      <button
                        onClick={() => handleRechazarContrapropuestaPaciente(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-300 text-red-600 text-xs font-medium hover:bg-red-50 disabled:opacity-60 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> Rechazar
                      </button>
                    </>
                  ) : cita.estado === "PENDIENTE" ? (
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
                  ) : null}
                  {pending && (cita.estado === "PENDIENTE" || cita.estado === "CONTRAPROPUESTA") && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
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

      {contraponerId && (
        <ContraproponerModal
          citaId={contraponerId}
          citaActual={citas.find((c) => c.id === contraponerId) || null}
          onClose={() => setContraponerId(null)}
          onDone={() => {
            setContraponerId(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
