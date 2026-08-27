"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { quitarRolDocente } from "@/app/actions/admin-docencia";
import { ConfirmModal } from "@/components/confirm-modal";

export function QuitarRolButton({ dietistaId, nombre }: { dietistaId: string; nombre: string }) {
  const t = useTranslations("admin.universidades");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      const result = await quitarRolDocente(dietistaId);
      if (result.ok) {
        toast.success(t("toastRolQuitado"));
        setAbierto(false);
        router.refresh();
      } else {
        toast.error(result.error || t("toastErrorQuitarRol"));
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0"
      >
        <UserMinus className="w-4 h-4" />
        {t("quitarRol")}
      </button>
      <ConfirmModal
        open={abierto}
        title={t("quitarRolTitulo")}
        // Importante que quede claro que NO se borra la cuenta: solo pierde el espacio docente.
        description={t("quitarRolTexto", { nombre })}
        confirmLabel={t("quitarRol")}
        destructive
        loading={isPending}
        onConfirm={confirmar}
        onCancel={() => setAbierto(false)}
      />
    </>
  );
}
