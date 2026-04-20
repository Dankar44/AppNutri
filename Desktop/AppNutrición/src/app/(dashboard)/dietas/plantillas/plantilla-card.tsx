"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookCopy, CalendarDays, UtensilsCrossed, Trash2 } from "lucide-react";
import { eliminarPlantilla } from "@/app/actions/plantillas";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  id: string;
  nombre: string;
  createdAt: Date | string;
  diasCount: number;
  alimentosCount: number;
}

export function PlantillaCard({ id, nombre, createdAt, diasCount, alimentosCount }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleEliminar() {
    if (!confirm(`¿Eliminar la plantilla "${nombre}"?`)) return;
    setDeleting(true);
    try {
      await eliminarPlantilla(id);
      toast.success("Plantilla eliminada");
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
      setDeleting(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BookCopy className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{nombre}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDate(createdAt)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {diasCount} días
        </span>
        <span className="flex items-center gap-1">
          <UtensilsCrossed className="w-3.5 h-3.5" />
          {alimentosCount} alimentos
        </span>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <Link
          href={`/dietas/nuevo`}
          className="flex-1 text-center px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Usar plantilla
        </Link>
        <button
          onClick={handleEliminar}
          disabled={deleting}
          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors disabled:opacity-50"
          title="Eliminar plantilla"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
