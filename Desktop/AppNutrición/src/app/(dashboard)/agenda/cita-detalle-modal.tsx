"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X, Clock, User, Check, Calendar, CalendarClock, Trash2, Loader2, ExternalLink, Video,
} from "lucide-react";
import { toast } from "sonner";
import { actualizarEstadoCita, eliminarCita } from "@/app/actions/citas";
import {
  aceptarSolicitudCita,
  rechazarSolicitudCita,
  aceptarContrapropuestaDietista,
  rechazarContrapropuestaDietista,
} from "@/app/actions/citas-flujo";
import { ContraproponerModal } from "./contraproponer-modal";

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  CONFIRMADA: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  COMPLETADA: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30",
  CANCELADA: "bg-muted text-muted-foreground border-border",
  CONTRAPROPUESTA: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  CONFIRMADA: "Confirmada",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
  CONTRAPROPUESTA: "Esperando paciente",
};

export interface CitaDetalle {
  id: string;
  fechaHora: string;
  duracion: number;
  motivo: string | null;
  estado: string;
  notas: string | null;
  origen?: string;
  propuestoPor?: string;
  isOnline?: boolean;
  googleMeetLink?: string | null;
  paciente: { id: string; nombre: string; apellidos: string; fotoUrl?: string | null };
}

function formatFechaLarga(iso: string): string {
  const d = new Date(iso);
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} a las ${hh}:${mm}`;
}

function googleCalendarUrl(cita: CitaDetalle) {
  const start = new Date(cita.fechaHora);
  const end = new Date(start.getTime() + cita.duracion * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const title = encodeURIComponent(`Consulta: ${cita.paciente.nombre} ${cita.paciente.apellidos}`);
  const details = encodeURIComponent(cita.motivo || "Consulta de nutrición");
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
}

interface Props {
  cita: CitaDetalle;
  onClose: () => void;
}

export function CitaDetalleModal({ cita, onClose }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showContraponer, setShowContraponer] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(false);

  const horaFin = new Date(
    new Date(cita.fechaHora).getTime() + cita.duracion * 60000,
  ).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const horaInicio = new Date(cita.fechaHora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  function refrescar() {
    router.refresh();
    onClose();
  }

  function run(fn: () => Promise<unknown>, okMsg: string) {
    startTransition(async () => {
      try { await fn(); toast.success(okMsg); refrescar(); }
      catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
    });
  }

  const esSolicitudPaciente = cita.estado === "PENDIENTE" && cita.origen === "PACIENTE";
  const esContrapropuestaPaciente = cita.estado === "CONTRAPROPUESTA" && cita.propuestoPor === "PACIENTE";
  const esPendiente = cita.estado === "PENDIENTE";
  const esConfirmada = cita.estado === "CONFIRMADA";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-lg font-semibold">Detalle de la cita</h2>
            <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Paciente */}
            <div className="flex items-center gap-3">
              {cita.paciente.fotoUrl ? (
                <img src={cita.paciente.fotoUrl} alt="" className="w-11 h-11 rounded-full object-cover" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {cita.paciente.nombre[0]}{cita.paciente.apellidos[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {cita.paciente.nombre} {cita.paciente.apellidos}
                </p>
                <Link
                  href={`/pacientes/${cita.paciente.id}`}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  Ver ficha del paciente <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Estado + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${ESTADO_STYLES[cita.estado]}`}>
                {ESTADO_LABELS[cita.estado] ?? cita.estado}
              </span>
              {esSolicitudPaciente && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 font-medium">
                  Solicitada por el paciente
                </span>
              )}
              {esContrapropuestaPaciente && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 font-medium">
                  Contrapropuesta del paciente
                </span>
              )}
              {cita.estado === "CONTRAPROPUESTA" && cita.propuestoPor === "DIETISTA" && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-medium">
                  Esperando respuesta del paciente
                </span>
              )}
              {cita.estado === "PENDIENTE" && cita.origen === "DIETISTA" && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-medium">
                  Propuesta al paciente
                </span>
              )}
            </div>

            {/* Fecha + hora */}
            <div className="rounded-lg bg-muted/40 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="capitalize">{formatFechaLarga(cita.fechaHora)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{horaInicio} – {horaFin} ({cita.duracion} min)</span>
              </div>
              {cita.isOnline && (
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
                  <Video className="w-4 h-4" />
                  {cita.googleMeetLink ? (
                    <a
                      href={cita.googleMeetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium hover:underline truncate"
                    >
                      Unirse a Google Meet
                    </a>
                  ) : (
                    <span className="text-muted-foreground">
                      Cita online — el enlace se generará al sincronizar con Google
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Motivo + notas */}
            {cita.motivo && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Motivo</p>
                <p className="text-sm">{cita.motivo}</p>
              </div>
            )}
            {cita.notas && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notas internas</p>
                <p className="text-sm italic text-muted-foreground">{cita.notas}</p>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="p-5 border-t border-border bg-muted/20 space-y-2">
            {esSolicitudPaciente ? (
              // Solicitud del paciente pendiente
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => run(() => aceptarSolicitudCita(cita.id), "Cita aceptada")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  <Check className="w-4 h-4" /> Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => setShowContraponer(true)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-60 transition-colors"
                >
                  <CalendarClock className="w-4 h-4" /> Proponer otra fecha
                </button>
                <button
                  type="button"
                  onClick={() => run(() => rechazarSolicitudCita(cita.id), "Solicitud rechazada")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/15 disabled:opacity-60 transition-colors"
                >
                  <X className="w-4 h-4" /> Rechazar
                </button>
              </div>
            ) : esContrapropuestaPaciente ? (
              // Contrapropuesta del paciente → nutri acepta / contrapropone / rechaza
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => run(() => aceptarContrapropuestaDietista(cita.id), "Contrapropuesta aceptada")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  <Check className="w-4 h-4" /> Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => setShowContraponer(true)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-60 transition-colors"
                >
                  <CalendarClock className="w-4 h-4" /> Proponer otra fecha
                </button>
                <button
                  type="button"
                  onClick={() => run(() => rechazarContrapropuestaDietista(cita.id), "Contrapropuesta rechazada")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/15 disabled:opacity-60 transition-colors"
                >
                  <X className="w-4 h-4" /> Rechazar
                </button>
              </div>
            ) : esPendiente ? (
              // Cita creada por el nutri (manualmente) sin flujo de paciente
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => run(() => actualizarEstadoCita(cita.id, "CONFIRMADA"), "Cita confirmada")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  <Check className="w-4 h-4" /> Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => run(() => actualizarEstadoCita(cita.id, "CANCELADA"), "Cita cancelada")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-60 transition-colors"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </div>
            ) : esConfirmada ? (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => run(() => actualizarEstadoCita(cita.id, "COMPLETADA"), "Cita completada")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
                >
                  <Check className="w-4 h-4" /> Marcar como completada
                </button>
                <button
                  type="button"
                  onClick={() => run(() => actualizarEstadoCita(cita.id, "CANCELADA"), "Cita cancelada")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-60 transition-colors"
                >
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </div>
            ) : null}

            {/* Acciones auxiliares */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <a
                href={googleCalendarUrl(cita)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium"
              >
                <Calendar className="w-3.5 h-3.5" /> Abrir en Google Calendar
              </a>
              <button
                type="button"
                onClick={() => setConfirmEliminar(true)}
                className="inline-flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar cita
              </button>
            </div>

            {pending && (
              <div className="flex items-center justify-center pt-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal contrapropuesta */}
      {showContraponer && (
        <ContraproponerModal
          citaId={cita.id}
          citaActual={cita}
          onClose={() => setShowContraponer(false)}
          onDone={() => {
            setShowContraponer(false);
            refrescar();
          }}
        />
      )}

      {/* Confirmación eliminar */}
      {confirmEliminar && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setConfirmEliminar(false)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">¿Eliminar esta cita?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Esta acción no se puede deshacer. La cita se borrará de tu agenda.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmEliminar(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => run(() => eliminarCita(cita.id), "Cita eliminada")}
                disabled={pending}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-60 transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
