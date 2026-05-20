"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { eliminarAlimento } from "@/app/actions/alimentos";
import { toast } from "sonner";
import { isNextNavigation } from "@/lib/utils";

export function AlimentoActions({ alimentoId }: { alimentoId: string }) {
  const t = useTranslations("foods");
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);

  async function handleDelete() {
    try {
      await eliminarAlimento(alimentoId);
      toast.success(t("detail.alimentoEliminado"));
      await new Promise((r) => setTimeout(r, 800)); window.location.href = "/alimentos";
    } catch (error) {
      if (isNextNavigation(error)) throw error;
      toast.error(t("detail.errorEliminar"));
    }
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t("detail.eliminarPregunta")}</span>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
        >
          {t("detail.si")}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          {t("detail.no")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors text-sm font-medium"
    >
      <Trash2 className="w-4 h-4" />
      {t("detail.eliminar")}
    </button>
  );
}
