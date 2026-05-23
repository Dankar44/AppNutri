"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { eliminarDietista } from "@/app/actions/admin";
import { ConfirmDeleteDietistaModal } from "@/components/confirm-delete-dietista-modal";

interface Props {
  dietistaId: string;
  nombre: string;
}

export function EliminarDietistaButton({ dietistaId, nombre }: Props) {
  const t = useTranslations("admin.dietistas.eliminar");
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleEliminar() {
    setDeleting(true);
    const res = await eliminarDietista(dietistaId);
    if (!res.ok) {
      toast.error(res.error || t("toastError"));
      setDeleting(false);
      return;
    }
    toast.success(t("toastExito", { nombre }));
    setShowConfirm(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        title={t("boton")}
        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <ConfirmDeleteDietistaModal
        open={showConfirm}
        nombre={nombre}
        loading={deleting}
        onConfirm={handleEliminar}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
