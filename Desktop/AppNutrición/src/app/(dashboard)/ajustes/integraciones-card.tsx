"use client";

import { useState, useTransition } from "react";
import { CalendarCheck2, CheckCircle2, Loader2, AlertCircle, Link2Off } from "lucide-react";
import {
  conectarGoogleNutri,
  desconectarGoogleNutri,
  toggleSincronizarNutri,
} from "@/app/actions/google-integracion";

type Props = {
  integracion: {
    email: string;
    sincronizar: boolean;
    crearMeet: boolean;
    createdAt: Date;
  } | null;
  flash?: { type: "ok" | "error"; message: string } | null;
};

export function IntegracionesCard({ integracion, flash }: Props) {
  const [pending, startTransition] = useTransition();
  const [showDisconnect, setShowDisconnect] = useState(false);

  const handleConectar = () => {
    startTransition(async () => {
      await conectarGoogleNutri();
    });
  };

  const handleToggleSincro = (nuevo: boolean) => {
    startTransition(async () => {
      await toggleSincronizarNutri(nuevo);
    });
  };

  return (
    <section className="bg-card rounded-xl border border-border p-5">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <CalendarCheck2 className="w-5 h-5 text-primary" />
        Integraciones
      </h2>

      {flash && (
        <div
          className={
            "mb-3 rounded-lg px-3 py-2 text-sm flex items-center gap-2 " +
            (flash.type === "ok"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200")
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

      <div className="border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <GoogleCalendarLogo />
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Google Calendar</p>
            <p className="text-xs text-muted-foreground">
              Sincroniza automáticamente tus citas con tu calendario de Google.
              Si activas Google Meet en una cita, se genera el enlace automáticamente.
            </p>
          </div>
        </div>

        {!integracion ? (
          <button
            onClick={handleConectar}
            disabled={pending}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-4 py-2.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {pending ? "Conectando…" : "Conectar con Google"}
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="truncate">
                Conectado como <strong className="font-semibold">{integracion.email}</strong>
              </span>
            </div>

            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div className="min-w-0">
                <p className="text-sm font-medium">Sincronizar citas automáticamente</p>
                <p className="text-xs text-muted-foreground">
                  Al crear/editar/cancelar una cita se actualizará en Google Calendar.
                </p>
              </div>
              <Toggle
                checked={integracion.sincronizar}
                disabled={pending}
                onChange={handleToggleSincro}
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
      </div>

      {showDisconnect && (
        <DisconnectDialog
          onClose={() => setShowDisconnect(false)}
          pending={pending}
          onConfirm={(accion) => {
            startTransition(async () => {
              await desconectarGoogleNutri({ accion });
              setShowDisconnect(false);
            });
          }}
        />
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
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform " +
          (checked ? "translate-x-6" : "translate-x-1")
        }
      />
    </button>
  );
}

function DisconnectDialog({
  onClose,
  onConfirm,
  pending,
}: {
  onClose: () => void;
  onConfirm: (accion: "borrar" | "dejar") => void;
  pending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border max-w-md w-full p-5">
        <h3 className="text-lg font-semibold">Desconectar Google Calendar</h3>
        <p className="text-sm text-muted-foreground mt-2">
          ¿Qué quieres hacer con las citas que ya se han sincronizado con Google Calendar?
        </p>

        <div className="mt-4 space-y-2">
          <button
            onClick={() => onConfirm("dejar")}
            disabled={pending}
            className="w-full text-left rounded-lg border border-border p-3 hover:bg-muted disabled:opacity-50"
          >
            <p className="text-sm font-medium">Dejar las citas en Google</p>
            <p className="text-xs text-muted-foreground mt-1">
              Los eventos creados se quedan en tu calendario pero dejan de actualizarse.
            </p>
          </button>
          <button
            onClick={() => onConfirm("borrar")}
            disabled={pending}
            className="w-full text-left rounded-lg border border-red-200 p-3 hover:bg-red-50 disabled:opacity-50"
          >
            <p className="text-sm font-medium text-red-700">Borrar las citas de Google</p>
            <p className="text-xs text-muted-foreground mt-1">
              Se eliminarán todos los eventos creados por AppNutri de tu calendario.
            </p>
          </button>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            disabled={pending}
            className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function GoogleCalendarLogo() {
  return (
    <div className="w-10 h-10 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
      <svg width="22" height="22" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <path fill="#fff" d="M37 9H11v30h26z" />
        <path fill="#1e88e5" d="M34 42H14l-5-5V11l5-5h20l5 5v26z" />
        <path fill="#fafafa" d="M34 42H14l-5-5V11l5-5h20l5 5v26z" opacity=".0" />
        <path fill="#1e88e5" d="M24 21.8l-1.5-.3c-.3.7-1 1.2-1.9 1.2-1.2 0-2-.8-2-2 0-1.1.8-2 1.9-2 .8 0 1.4.4 1.7 1.1l1.6-.6c-.5-1.3-1.8-2.2-3.3-2.2-2.1 0-3.7 1.6-3.7 3.7 0 2.1 1.6 3.7 3.7 3.7 1.9 0 3.3-1.2 3.5-3z" />
        <path fill="#1e88e5" d="M27.3 22.6c-1.1 0-1.9-.8-1.9-1.9 0-1.1.8-1.9 1.9-1.9.8 0 1.5.5 1.8 1.2l1.5-.5c-.5-1.2-1.7-2.1-3.3-2.1-2 0-3.6 1.5-3.6 3.5s1.6 3.5 3.6 3.5c1.4 0 2.6-.8 3.2-2l-1.5-.5c-.3.4-1 .7-1.7.7z" />
        <path fill="#fff" d="M22.7 32h2.9v-3.6l1.8 1.8 1.4-1.4-1.8-1.8h3.6v-2h-3.6l1.8-1.8-1.4-1.4-1.8 1.8V20h-2.9v3.6l-1.8-1.8-1.4 1.4 1.8 1.8h-3.6v2h3.6l-1.8 1.8 1.4 1.4 1.8-1.8z" />
      </svg>
    </div>
  );
}
