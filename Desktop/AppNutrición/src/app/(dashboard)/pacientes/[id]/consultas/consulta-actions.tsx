"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { eliminarConsulta } from "@/app/actions/consultas";
import { toast } from "sonner";

export function ConsultaActions({ consultaId }: { consultaId: string }) {
  const router = useRouter();
  const t = useTranslations("patients");
  const [confirmando, setConfirmando] = useState(false);

  async function handleDelete() {
    try {
      await eliminarConsulta(consultaId);
      toast.success(t("consultas.consultaEliminada"));
      router.refresh();
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("consultas.errorEliminar"));
    }
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          className="px-2 py-1 rounded bg-red-600 text-white text-xs font-medium"
        >
          {t("consultas.si")}
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="px-2 py-1 rounded border border-border text-xs font-medium"
        >
          {t("consultas.no")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-500/15 text-red-400 hover:text-red-600 transition-colors"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
