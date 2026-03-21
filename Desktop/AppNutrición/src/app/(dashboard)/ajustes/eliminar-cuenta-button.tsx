"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { eliminarCuenta } from "@/app/actions/perfil";

export function EliminarCuentaButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await eliminarCuenta();
    } catch {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="text-sm text-muted-foreground hover:text-red-600 transition-colors flex items-center gap-1.5"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Eliminar cuenta
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-red-600">Se borrarán todos tus datos permanentemente.</span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Eliminando..." : "Confirmar"}
      </button>
      <button
        onClick={() => setShowConfirm(false)}
        disabled={loading}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
}
