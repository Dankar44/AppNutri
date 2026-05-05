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
        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors disabled:opacity-50 border border-border"
        title="Eliminar plantilla"
      >
        <Trash2 className="w-4 h-4" />
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
