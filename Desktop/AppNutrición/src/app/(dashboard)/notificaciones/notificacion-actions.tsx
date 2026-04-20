"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import {
  marcarTodasLeidas,
  eliminarTodasNotificaciones,
} from "@/app/actions/notificaciones";
import { toast } from "sonner";

type Props = {
  mostrarMarcarLeidas: boolean;
  hayNotificaciones: boolean;
};

export function NotificacionActions({ mostrarMarcarLeidas, hayNotificaciones }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmar, setConfirmar] = useState(false);

  function handleMarcarTodas() {
    startTransition(async () => {
      await marcarTodasLeidas();
      toast.success("Todas marcadas como leídas");
      router.refresh();
    });
  }

  function handleEliminarTodas() {
    startTransition(async () => {
      await eliminarTodasNotificaciones();
      toast.success("Todas las notificaciones eliminadas");
      setConfirmar(false);
      router.refresh();
    });
  }

  return (
    <>
      {mostrarMarcarLeidas && (
        <button
          onClick={handleMarcarTodas}
          disabled={pending}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span className="hidden sm:inline">Marcar todas como leídas</span>
          <span className="sm:hidden">Marcar leídas</span>
        </button>
      )}

      {hayNotificaciones && (
        <button
          onClick={() => setConfirmar(true)}
          disabled={pending}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors text-sm font-medium disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline">Borrar todas</span>
        </button>
      )}

      {confirmar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => !pending && setConfirmar(false)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2">¿Borrar todas las notificaciones?</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Esta acción eliminará todas tus notificaciones. No podrás recuperarlas.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmar(false)}
                disabled={pending}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminarTodas}
                disabled={pending}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {pending ? "Borrando…" : "Sí, borrar todas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
