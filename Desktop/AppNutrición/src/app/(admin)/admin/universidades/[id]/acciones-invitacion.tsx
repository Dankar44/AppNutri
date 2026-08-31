"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Send } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cancelarInvitacionDocente, reenviarInvitacionDocente } from "@/app/actions/invitaciones-docentes";
import { ConfirmModal } from "@/components/confirm-modal";

export function AccionesInvitacion({ id, email }: { id: string; email: string }) {
  const t = useTranslations("admin.universidades");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await cancelarInvitacionDocente(id);
      if (result.ok) {
        toast.success(t("toastInvitacionCancelada"));
        setAbierto(false);
        router.refresh();
      } else {
        toast.error(result.error || t("toastErrorInvitar"));
      }
    });
  }

  function reenviar() {
    startTransition(async () => {
      const result = await reenviarInvitacionDocente(id);
      if (result.ok) {
        toast.success(t("toastInvitacionReenviada", { envios: result.envios ?? 1 }));
        router.refresh();
      } else {
        toast.error(result.error || t("toastErrorInvitar"));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={reenviar}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {t("reenviarInvitacion")}
      </button>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
        {t("cancelarInvitacion")}
      </button>
      <ConfirmModal
        open={abierto}
        title={t("cancelarInvitacion")}
        description={email}
        confirmLabel={t("cancelarInvitacion")}
        destructive
        loading={isPending}
        onConfirm={confirmar}
        onCancel={() => setAbierto(false)}
      />
    </>
  );
}
