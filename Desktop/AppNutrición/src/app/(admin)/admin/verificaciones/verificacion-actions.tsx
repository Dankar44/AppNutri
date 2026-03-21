"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { verificarDietista, rechazarDietista } from "@/app/actions/admin";
import { toast } from "sonner";

interface Props {
  dietistaId: string;
  nombre: string;
}

export function VerificacionActions({ dietistaId, nombre }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"verificar" | "rechazar" | null>(null);
  const [confirmarRechazo, setConfirmarRechazo] = useState(false);

  async function handleVerificar() {
    setLoading("verificar");
    try {
      await verificarDietista(dietistaId);
      toast.success(`${nombre} ha sido verificado`);
      router.refresh();
    } catch {
      toast.error("Error al verificar");
    } finally {
      setLoading(null);
    }
  }

  async function handleRechazar() {
    setLoading("rechazar");
    try {
      await rechazarDietista(dietistaId);
      toast.success(`Solicitud de ${nombre} rechazada`);
      router.refresh();
    } catch {
      toast.error("Error al rechazar");
    } finally {
      setLoading(null);
      setConfirmarRechazo(false);
    }
  }

  if (confirmarRechazo) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm text-red-600">¿Eliminar cuenta?</span>
        <button
          onClick={handleRechazar}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
        >
          {loading === "rechazar" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sí"}
        </button>
        <button
          onClick={() => setConfirmarRechazo(false)}
          className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={handleVerificar}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading === "verificar" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        Verificar
      </button>
      <button
        onClick={() => setConfirmarRechazo(true)}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
      >
        <X className="w-4 h-4" />
        Rechazar
      </button>
    </div>
  );
}
