"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { eliminarMedida } from "@/app/actions/medidas";
import { toast } from "sonner";
import { isNextNavigation } from "@/lib/utils";

export function MedidaDeleteButton({ medidaId }: { medidaId: string }) {
  const router = useRouter();
  const t = useTranslations("patients");

  async function handleDelete() {
    try {
      await eliminarMedida(medidaId);
      toast.success(t("medidas.medidaEliminada"));
      router.refresh();
    } catch (error) { if (isNextNavigation(error)) throw error;
      toast.error(t("medidas.errorEliminar"));
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/15 text-red-400 hover:text-red-600 transition-colors"
      title={t("medidas.eliminarMedida")}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
