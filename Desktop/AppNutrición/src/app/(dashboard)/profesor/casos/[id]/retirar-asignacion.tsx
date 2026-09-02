"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { retirarAsignacion } from "@/app/actions/casos";
import { ConfirmModal } from "@/components/confirm-modal";

/** Quitar el caso de una clase. No borra lo entregado: deja de salirles como pendiente y ya. */
export function RetirarAsignacion({ asignacionId }: { asignacionId: string }) {
  const t = useTranslations("casos");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  function retirar() {
    startTransition(async () => {
      const result = await retirarAsignacion(asignacionId);
      if (result.ok) {
        toast.success(t("asignar.retirado"));
        setConfirmando(false);
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        aria-label={t("asignar.retirar")}
        title={t("asignar.retirar")}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
      <ConfirmModal
        open={confirmando}
        title={t("asignar.retirar")}
        description={t("asignar.retirarTexto")}
        confirmLabel={t("asignar.retirar")}
        loading={isPending}
        onConfirm={retirar}
        onCancel={() => setConfirmando(false)}
      />
    </>
  );
}
