"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { eliminarPlantilla } from "@/app/actions/plantillas";
import { toast } from "sonner";
import { ConfirmModal } from "@/components/confirm-modal";

export function EliminarPlantillaButton({ id, nombre }: { id: string; nombre: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleEliminar() {
    setDeleting(true);
    try {
      await eliminarPlantilla(id);
      toast.success("Plantilla eliminada");
      setShowConfirm(false);
      router.push("/dietas/plantillas");
    } catch {
      toast.error("Error al eliminar");
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={deleting}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none min-h-10 sm:min-h-0 disabled:opacity-50"
        title="Eliminar plantilla"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden xs:inline sm:inline">Eliminar</span>
      </button>

      <ConfirmModal
        open={showConfirm}
        title="Eliminar plantilla"
        description={`¿Estás seguro de que quieres eliminar la plantilla "${nombre}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        destructive
        loading={deleting}
        onConfirm={handleEliminar}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
