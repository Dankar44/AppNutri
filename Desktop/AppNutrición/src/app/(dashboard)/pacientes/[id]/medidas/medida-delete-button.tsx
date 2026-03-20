"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { eliminarMedida } from "@/app/actions/medidas";
import { toast } from "sonner";

export function MedidaDeleteButton({ medidaId }: { medidaId: string }) {
  const router = useRouter();

  async function handleDelete() {
    try {
      await eliminarMedida(medidaId);
      toast.success("Medida eliminada");
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
      title="Eliminar medida"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
