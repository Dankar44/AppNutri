"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { cambiarAccesoAlumno } from "@/app/actions/admin-docencia";
import { ConfirmModal } from "@/components/confirm-modal";

/**
 * Quitar o devolver el acceso de un alumno, desde administración.
 *
 * Lo mismo que puede hacer su profesor. Con aviso antes de quitarlo, porque el alumno se queda sin
 * poder entrar en su aula y su plaza no vuelve a la bolsa hasta el 31 de agosto.
 */
export function AccesoAlumno({
  alumnoId,
  claseId,
  nombre,
  activo,
}: {
  alumnoId: string;
  claseId: string;
  nombre: string;
  activo: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();

  function cambiar() {
    startTransition(async () => {
      const r = await cambiarAccesoAlumno(alumnoId, claseId, !activo);
      if (r.ok) {
        toast.success(activo ? "Acceso retirado" : "Acceso devuelto");
        setAbierto(false);
        router.refresh();
      } else {
        toast.error(r.error ?? "");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (activo ? setAbierto(true) : cambiar())}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 whitespace-nowrap"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : activo ? (
          <UserMinus className="w-3.5 h-3.5" />
        ) : (
          <UserPlus className="w-3.5 h-3.5" />
        )}
        {activo ? "Quitar acceso" : "Devolver acceso"}
      </button>
      <ConfirmModal
        open={abierto}
        title={`¿Quitar el acceso a ${nombre}?`}
        description="Dejará de poder entrar en su aula, pero no se borra nada: su cuenta y su trabajo siguen ahí, y puedes devolvérselo cuando quieras. La plaza no vuelve a la bolsa hasta el 31 de agosto."
        confirmLabel="Quitar el acceso"
        destructive
        loading={isPending}
        onConfirm={cambiar}
        onCancel={() => setAbierto(false)}
      />
    </>
  );
}
