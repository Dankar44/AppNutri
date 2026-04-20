"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Check, X, CalendarClock, AlertTriangle, Loader2, ChevronRight } from "lucide-react";
import {
  aceptarContrapropuestaPaciente,
  rechazarContrapropuestaPaciente,
  cancelarCitaPaciente,
  aceptarPropuestaDietista,
  rechazarPropuestaDietista,
  type CitaPortalPaciente,
} from "@/app/actions/citas-flujo";
import { ContraproponerPacienteModal } from "./contraproponer-paciente-modal";

const ESTADO_BADGE: Record<string, { label: string; className: string }> = {
  PENDIENTE:       { label: "Esperando respuesta", className: "bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-500/30" },
  CONFIRMADA:      { label: "Confirmada",          className: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30" },
  CONTRAPROPUESTA: { label: "Nueva propuesta",     className: "bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-500/30" },
  CANCELADA:       { label: "Cancelada",           className: "bg-muted text-muted-foreground border-border" },
  COMPLETADA:      { label: "Completada",          className: "bg-muted text-muted-foreground border-border" },
};

function formatFechaLarga(iso: string): string {
  const d = new Date(iso);
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()} a las ${hh}:${mm}`;
}

export function CitasPortalClient({ citasIniciales }: { citasIniciales: CitaPortalPaciente[] }) {
  const router = useRouter();
  const [contraponerCita, setContraponerCita] = useState<CitaPortalPaciente | null>(null);
  const [confirmCancelar, setConfirmCancelar] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const now = new Date();
  const citas = citasIniciales;
  // Contrapropuesta del NUTRI → el paciente la acepta/rechaza
  const contrapropuestasNutri = citas.filter(
    (c) => c.estado === "CONTRAPROPUESTA" && c.propuestoPor === "DIETISTA",
  );
  // Propuestas del NUTRI (cita creada por el nutri en modo "proponer") → el paciente acepta/contraopone/rechaza
  const propuestasNutri = citas.filter(
    (c) => c.estado === "PENDIENTE" && c.origen === "DIETISTA",
  );
  const proximas = citas.filter((c) => c.estado === "CONFIRMADA" && new Date(c.fechaHora) >= now);
  // Solicitudes del propio paciente esperando respuesta del nutri
  const pendientesMias = citas.filter(
    (c) => c.estado === "PENDIENTE" && c.origen === "PACIENTE" && new Date(c.fechaHora) >= now,
  );
  // Contrapropuesta mía enviada al nutri
  const misContrapropuestas = citas.filter(
    (c) => c.estado === "CONTRAPROPUESTA" && c.propuestoPor === "PACIENTE",
  );
  const historial = citas.filter(
    (c) => c.estado === "COMPLETADA" || c.estado === "CANCELADA" || new Date(c.fechaHora) < now,
  );

  function handleAceptarContrapropuesta(citaId: string) {
    startTransition(async () => {
      try {
        await aceptarContrapropuestaPaciente(citaId);
        toast.success("Cita confirmada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleRechazarContrapropuesta(citaId: string) {
    startTransition(async () => {
      try {
        await rechazarContrapropuestaPaciente(citaId);
        toast.success("Propuesta rechazada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleAceptarPropuestaNutri(citaId: string) {
    startTransition(async () => {
      try {
        await aceptarPropuestaDietista(citaId);
        toast.success("Cita confirmada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleRechazarPropuestaNutri(citaId: string) {
    startTransition(async () => {
      try {
        await rechazarPropuestaDietista(citaId);
        toast.success("Cita rechazada");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleCancelar(citaId: string) {
    startTransition(async () => {
      try {
        await cancelarCitaPaciente(citaId);
        toast.success("Cita cancelada");
        setConfirmCancelar(null);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Botón solicitar */}
      <Link
        href="/paciente/portal/citas/nueva"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Solicitar nueva cita
      </Link>

      {/* Propuestas del nutricionista (cita creada por el nutri esperando aceptar) */}
      {propuestasNutri.length > 0 && (
        <section className="rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-indigo-900 dark:text-indigo-200">
              Tu nutricionista te ha propuesto una cita
            </h2>
          </div>
          {propuestasNutri.map((c) => (
            <div key={c.id} className="rounded-lg bg-card border border-indigo-200 dark:border-indigo-500/30 p-4 mb-3 last:mb-0">
              <p className="text-sm text-muted-foreground mb-1">
                {c.dietista.nombre} {c.dietista.apellidos} propone:
              </p>
              <p className="text-base font-semibold mb-1">{formatFechaLarga(c.fechaHora)}</p>
              <p className="text-xs text-muted-foreground mb-3">{c.duracion} min{c.motivo ? ` · ${c.motivo}` : ""}</p>
              {c.notas && <p className="text-sm text-muted-foreground mb-3 italic">{c.notas}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAceptarPropuestaNutri(c.id)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  <Check className="w-4 h-4" /> Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => setContraponerCita(c)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-60 transition-colors"
                >
                  <CalendarClock className="w-4 h-4" /> Proponer otra fecha
                </button>
                <button
                  type="button"
                  onClick={() => handleRechazarPropuestaNutri(c.id)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-300 dark:border-red-500/40 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/15 disabled:opacity-60 transition-colors"
                >
                  <X className="w-4 h-4" /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Contrapropuestas del nutri sobre mi solicitud original */}
      {contrapropuestasNutri.length > 0 && (
        <section className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            <h2 className="text-base font-semibold text-blue-900 dark:text-blue-200">
              Nueva propuesta de tu nutricionista
            </h2>
          </div>
          {contrapropuestasNutri.map((c) => (
            <div key={c.id} className="rounded-lg bg-card border border-blue-200 dark:border-blue-500/30 p-4 mb-3 last:mb-0">
              <p className="text-sm text-muted-foreground mb-1">
                {c.dietista.nombre} {c.dietista.apellidos} propone:
              </p>
              <p className="text-base font-semibold mb-3">{formatFechaLarga(c.fechaHora)}</p>
              {c.notas && <p className="text-sm text-muted-foreground mb-3 italic">{c.notas}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAceptarContrapropuesta(c.id)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  <Check className="w-4 h-4" /> Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => setContraponerCita(c)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-60 transition-colors"
                >
                  <CalendarClock className="w-4 h-4" /> Proponer otra fecha
                </button>
                <button
                  type="button"
                  onClick={() => handleRechazarContrapropuesta(c.id)}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-60 transition-colors"
                >
                  <X className="w-4 h-4" /> Rechazar
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Próximas citas confirmadas */}
      <section>
        <h2 className="text-base font-semibold mb-3">Próximas citas</h2>
        {proximas.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-xl">
            No tienes citas confirmadas. Solicita una nueva arriba.
          </p>
        ) : (
          <div className="space-y-2">
            {proximas.map((c) => (
              <CitaRow
                key={c.id}
                cita={c}
                acciones={
                  <button
                    type="button"
                    onClick={() => setConfirmCancelar(c.id)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-medium underline-offset-2 hover:underline"
                  >
                    Cancelar
                  </button>
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Mis solicitudes pendientes y contrapropuestas enviadas al nutri */}
      {(pendientesMias.length > 0 || misContrapropuestas.length > 0) && (
        <section>
          <h2 className="text-base font-semibold mb-3">Esperando respuesta de tu nutricionista</h2>
          <div className="space-y-2">
            {[...pendientesMias, ...misContrapropuestas].map((c) => (
              <CitaRow
                key={c.id}
                cita={c}
                acciones={
                  <button
                    type="button"
                    onClick={() => setConfirmCancelar(c.id)}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium underline-offset-2 hover:underline"
                  >
                    Cancelar solicitud
                  </button>
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Historial */}
      {historial.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Historial</h2>
          <div className="space-y-2">
            {historial.map((c) => <CitaRow key={c.id} cita={c} />)}
          </div>
        </section>
      )}

      {/* Modal contraproponer otra fecha (sobre una propuesta del nutri) */}
      {contraponerCita && (
        <ContraproponerPacienteModal
          cita={contraponerCita}
          onClose={() => setContraponerCita(null)}
          onDone={() => {
            setContraponerCita(null);
            router.refresh();
          }}
        />
      )}

      {/* Confirmación cancelar */}
      {confirmCancelar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setConfirmCancelar(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">¿Seguro que quieres cancelar esta cita?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Tu nutricionista recibirá una notificación de la cancelación.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmCancelar(null)}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                No, mantener
              </button>
              <button
                type="button"
                onClick={() => handleCancelar(confirmCancelar)}
                disabled={pending}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-60 inline-flex items-center gap-2"
              >
                {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CitaRow({ cita, acciones }: { cita: CitaPortalPaciente; acciones?: React.ReactNode }) {
  const badge = ESTADO_BADGE[cita.estado] ?? ESTADO_BADGE.PENDIENTE;
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3">
      <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <CalendarClock className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.className}`}>
            {badge.label}
          </span>
          <span className="text-sm font-semibold">{formatFechaLarga(cita.fechaHora)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {cita.dietista.nombre} {cita.dietista.apellidos} · {cita.duracion} min
          {cita.origen === "PACIENTE" && cita.propuestoPor === "PACIENTE" && " · Solicitada por ti"}
        </p>
        {cita.motivo && <p className="text-xs text-muted-foreground mt-1 italic">Motivo: {cita.motivo}</p>}
        {cita.googleMeetLink && (
          <a
            href={cita.googleMeetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary font-medium inline-flex items-center gap-1 mt-2 hover:underline"
          >
            Unirse a Google Meet <ChevronRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      {acciones && <div className="shrink-0">{acciones}</div>}
    </div>
  );
}
