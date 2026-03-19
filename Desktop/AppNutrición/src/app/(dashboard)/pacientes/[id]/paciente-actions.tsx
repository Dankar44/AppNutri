"use client";

import { useState } from "react";
import { Trash2, Power, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { eliminarPaciente, toggleActivoPaciente } from "@/app/actions/pacientes";

interface Props {
  pacienteId: string;
  activo: boolean;
}

export function PacienteActions({ pacienteId, activo }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggleActivo() {
    setLoading(true);
    try {
      await toggleActivoPaciente(pacienteId);
      toast.success(
        activo ? "Paciente marcado como inactivo" : "Paciente marcado como activo"
      );
    } catch {
      toast.error("Error al cambiar el estado");
    }
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await eliminarPaciente(pacienteId);
      toast.success("Paciente eliminado");
    } catch {
      toast.error("Error al eliminar el paciente");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleToggleActivo}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
        title={activo ? "Desactivar paciente" : "Activar paciente"}
      >
        <Power className="w-4 h-4" />
        {activo ? "Desactivar" : "Activar"}
      </button>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Confirm dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">
              Eliminar paciente
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Esta acción es irreversible. Se eliminarán todos los datos del
              paciente, incluyendo sus dietas y medidas.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
