"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { quitarDeLaClase } from "@/app/actions/alumnos";
import { ConfirmModal } from "@/components/confirm-modal";

/** Saca al alumno de la lista de la clase. Su cuenta y su trabajo no se tocan. */
export function QuitarDeLaLista({
  claseId,
  alumnoId,
  nombre,
}: {
  claseId: string;
  alumnoId: string;
  nombre: string;
}) {
  const t = useTranslations("docencia");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await quitarDeLaClase(claseId, alumnoId);
      if (result.ok) {
        toast.success(t("clases.quitado"));
        setAbierto(false);
        router.refresh();
      } else {
        toast.error(result.error || t("clases.errorGuardar"));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={t("clases.quitarDeLaLista")}
        title={t("clases.quitarDeLaLista")}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
      <ConfirmModal
        open={abierto}
        title={t("clases.quitarDeLaLista")}
        description={t("clases.quitarTexto", { nombre })}
        confirmLabel={t("clases.quitarDeLaLista")}
        loading={isPending}
        onConfirm={confirmar}
        onCancel={() => setAbierto(false)}
      />
    </>
  );
}
