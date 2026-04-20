"use client";

import { useState, useTransition } from "react";
import { CalendarCheck2, CheckCircle2, Loader2, AlertCircle, Link2Off } from "lucide-react";
import {
  conectarGooglePaciente,
  desconectarGooglePaciente,
  toggleSincronizarPaciente,
} from "@/app/actions/google-integracion";

type Props = {
  integracion: {
    email: string;
    sincronizar: boolean;
    createdAt: Date;
  } | null;
  flash?: { type: "ok" | "error"; message: string } | null;
};

export function IntegracionesCardPaciente({ integracion, flash }: Props) {
  const [pending, startTransition] = useTransition();
  const [showDisconnect, setShowDisconnect] = useState(false);

  const handleConectar = () => {
    startTransition(async () => {
      await conectarGooglePaciente();
    });
  };

  const handleToggle = (nuevo: boolean) => {
    startTransition(async () => {
      await toggleSincronizarPaciente(nuevo);
    });
  };

  return (
    <section className="rounded-xl border border-border p-5">
      <header className="flex items-start gap-3 mb-4">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground shrink-0">
          <CalendarCheck2 className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Google Calendar</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conecta tu cuenta de Google para que tus citas aparezcan automáticamente en tu calendario personal.
          </p>
        </div>
      </header>

      {flash && (
        <div
          className={
            "mb-3 rounded-lg px-3 py-2 text-sm flex items-center gap-2 " +
            (flash.type === "ok"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
              : "bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-500/30")
          }
        >
          {flash.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{flash.message}</span>
        </div>
      )}

      {!integracion ? (
        <button
          onClick={handleConectar}
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {pending ? "Conectando…" : "Conectar con Google"}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">
              Conectado como <strong className="font-semibold">{integracion.email}</strong>
            </span>
          </div>

          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div className="min-w-0">
              <p className="text-sm font-medium">Sincronizar automáticamente</p>
              <p className="text-xs text-muted-foreground">
                Cuando tu nutricionista cree o modifique una cita, también aparecerá en tu Google Calendar.
              </p>
            </div>
            <Toggle
              checked={integracion.sincronizar}
              disabled={pending}
              onChange={handleToggle}
            />
          </label>

          <button
            onClick={() => setShowDisconnect(true)}
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Link2Off className="w-4 h-4" />
            Desconectar
          </button>
        </div>
      )}

      {showDisconnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-xl border border-border max-w-md w-full p-5">
            <h3 className="text-lg font-semibold">Desconectar Google Calendar</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Ya no se añadirán nuevas citas a tu calendario. Los eventos ya creados
              permanecerán en Google hasta que los borres manualmente.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDisconnect(false)}
                disabled={pending}
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  startTransition(async () => {
                    await desconectarGooglePaciente({ accion: "dejar" });
                    setShowDisconnect(false);
                  });
                }}
                disabled={pending}
                className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Sí, desconectar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={
        "shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors " +
        (checked ? "bg-primary" : "bg-muted") +
        (disabled ? " opacity-50 cursor-not-allowed" : "")
      }
    >
      <span
        className={
          "inline-block h-4 w-4 transform rounded-full bg-card transition-transform " +
          (checked ? "translate-x-6" : "translate-x-1")
        }
      />
    </button>
  );
}
