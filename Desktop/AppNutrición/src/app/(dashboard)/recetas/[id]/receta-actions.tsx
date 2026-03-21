"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { eliminarReceta } from "@/app/actions/recetas";
import { toast } from "sonner";

export function RecetaActions({ recetaId }: { recetaId: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);

  async function handleDelete() {
    try {
      await eliminarReceta(recetaId);
      toast.success("Receta eliminada correctamente");
      await new Promise((r) => setTimeout(r, 800)); window.location.href = "/recetas";
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al eliminar la receta");
    }
  }

  if (confirmando) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">¿Eliminar?</span>
        <button
          onClick={handleDelete}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Sí
        </button>
        <button
          onClick={() => setConfirmando(false)}
          className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirmando(true)}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
    >
      <Trash2 className="w-4 h-4" />
      Eliminar
    </button>
  );
}
