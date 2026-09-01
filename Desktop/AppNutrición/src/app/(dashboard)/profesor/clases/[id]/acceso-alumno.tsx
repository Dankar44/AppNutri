"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cambiarAccesoAlumno } from "@/app/actions/alumnos";
import { ConfirmModal } from "@/components/confirm-modal";

/** Retirar o devolver el acceso de un alumno. Nunca borra su cuenta ni su trabajo. */
export function AccesoAlumno({
  claseId,
  alumnoId,
  nombre,
  activa,
}: {
  claseId: string;
  alumnoId: string;
  nombre: string;
  activa: boolean;
}) {
  const t = useTranslations("docencia");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await cambiarAccesoAlumno(claseId, alumnoId, !activa);
      if (result.ok) {
        toast.success(activa ? t("alumnos.accesoRetirado") : t("alumnos.accesoDevuelto"));
        setAbierto(false);
        router.refresh();
      } else {
        toast.error(result.error || t("alumnos.errorAlta"));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        {activa ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
        {activa ? t("alumnos.retirar") : t("alumnos.devolver")}
      </button>
      <ConfirmModal
        open={abierto}
        title={activa ? t("alumnos.retirar") : t("alumnos.devolver")}
        description={activa ? t("alumnos.retirarTexto", { nombre }) : t("alumnos.devolverTexto", { nombre })}
        confirmLabel={activa ? t("alumnos.retirar") : t("alumnos.devolver")}
        loading={isPending}
        onConfirm={confirmar}
        onCancel={() => setAbierto(false)}
      />
    </>
  );
}
