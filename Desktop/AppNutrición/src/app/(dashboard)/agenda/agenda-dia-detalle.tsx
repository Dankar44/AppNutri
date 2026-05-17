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
import { useTranslations, useLocale } from "next-intl";
import { intlTag, type Locale } from "@/i18n/config";
import { ContraproponerModal } from "./contraproponer-modal";

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  CONFIRMADA: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  COMPLETADA: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30",
  CANCELADA: "bg-muted text-muted-foreground border-border",
  CONTRAPROPUESTA: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30",
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
  const t = useTranslations("agenda.dayDetail");
  const tag = intlTag(useLocale() as Locale);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [contraponerId, setContraponerId] = useState<string | null>(null);
  const fechaObj = new Date(fecha + "T12:00:00");
  const fechaFormateada = fechaObj.toLocaleDateString(tag, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleEstado(citaId: string, estado: "CONFIRMADA" | "COMPLETADA" | "CANCELADA") {
    try {
      await actualizarEstadoCita(citaId, estado);
      const key = estado === "CONFIRMADA" ? "toastConfirmed" : estado === "COMPLETADA" ? "toastCompleted" : "toastCancelled";
      toast.success(t(key));
      router.refresh();
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("toastError"));
    }
  }

  function handleAceptarSolicitud(citaId: string) {
    startTransition(async () => {
      try {
        await aceptarSolicitudCita(citaId);
        toast.success(t("toastAccepted"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("toastError"));
      }
    });
  }

  function handleRechazarSolicitud(citaId: string) {
    startTransition(async () => {
      try {
        await rechazarSolicitudCita(citaId);
        toast.success(t("toastRejected"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("toastError"));
      }
    });
  }

  function handleAceptarContrapropuestaPaciente(citaId: string) {
    startTransition(async () => {
      try {
        await aceptarContrapropuestaDietista(citaId);
        toast.success(t("toastAccepted"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("toastError"));
      }
    });
  }

  function handleRechazarContrapropuestaPaciente(citaId: string) {
    startTransition(async () => {
      try {
        await rechazarContrapropuestaDietista(citaId);
        toast.success(t("toastRejected"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("toastError"));
      }
    });
  }

  async function handleEliminar(citaId: string) {
    try {
      await eliminarCita(citaId);
      toast.success(t("toastCancelled"));
      router.refresh();
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("toastError"));
    }
  }

  function googleCalendarUrl(cita: Cita) {
    const start = new Date(cita.fechaHora);
    const end = new Date(start.getTime() + cita.duracion * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const title = encodeURIComponent(`${t("consultationDefault")}: ${cita.paciente.nombre} ${cita.paciente.apellidos}`);
    const details = encodeURIComponent(cita.motivo || t("consultationDefault"));
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
          {t("noAppointmentsForDay")}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {citas.map((cita) => {
            const hora = new Date(cita.fechaHora).toLocaleTimeString(tag, {
              hour: "2-digit",
              minute: "2-digit",
            });
            const horaFin = new Date(
              new Date(cita.fechaHora).getTime() + cita.duracion * 60000
            ).toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });

            return (
              <div key={cita.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2 sm:w-32 flex-shrink-0">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{hora} - {horaFin}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {cita.paciente.nombre} {cita.paciente.apellidos}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${ESTADO_STYLES[cita.estado]}`}>
                      {t(`estadoLabels.${cita.estado}`)}
                    </span>
                    {cita.origen === "PACIENTE" && cita.estado === "PENDIENTE" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 font-medium">
                        {t("requestedByPatient")}
                      </span>
                    )}
                    {cita.estado === "CONTRAPROPUESTA" && cita.propuestoPor === "PACIENTE" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 font-medium">
                        {t("counterproposalByPatient")}
                      </span>
                    )}
                    {cita.estado === "CONTRAPROPUESTA" && cita.propuestoPor === "DIETISTA" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 font-medium">
                        {t("waitingForPatient")}
                      </span>
                    )}
                    {cita.estado === "PENDIENTE" && cita.origen === "DIETISTA" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-medium">
                        {t("proposedToPatient")}
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

                <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
                  {cita.estado === "PENDIENTE" && cita.origen === "PACIENTE" ? (
                    <>
                      <button
                        onClick={() => handleAceptarSolicitud(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> {t("accept")}
                      </button>
                      <button
                        onClick={() => setContraponerId(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-60 transition-colors"
                      >
                        <CalendarClock className="w-3.5 h-3.5" /> {t("anotherDate")}
                      </button>
                      <button
                        onClick={() => handleRechazarSolicitud(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-500/15 disabled:opacity-60 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> {t("reject")}
                      </button>
                    </>
                  ) : cita.estado === "CONTRAPROPUESTA" && cita.propuestoPor === "PACIENTE" ? (
                    <>
                      <button
                        onClick={() => handleAceptarContrapropuestaPaciente(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> {t("accept")}
                      </button>
                      <button
                        onClick={() => setContraponerId(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-60 transition-colors"
                      >
                        <CalendarClock className="w-3.5 h-3.5" /> {t("anotherDate")}
                      </button>
                      <button
                        onClick={() => handleRechazarContrapropuestaPaciente(cita.id)}
                        disabled={pending}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-500/15 disabled:opacity-60 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" /> {t("reject")}
                      </button>
                    </>
                  ) : cita.estado === "PENDIENTE" ? (
                    <>
                      <button
                        onClick={() => handleEstado(cita.id, "CONFIRMADA")}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                      >
                        {t("confirm")}
                      </button>
                      <button
                        onClick={() => handleEstado(cita.id, "CANCELADA")}
                        className="p-1 rounded-lg bg-muted text-muted-foreground hover:bg-gray-300 transition-colors"
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
                      {t("complete")}
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
                    className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors"
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
          onDone={() => { setContraponerId(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
