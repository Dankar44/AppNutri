"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Power, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { eliminarPaciente, toggleActivoPaciente } from "@/app/actions/pacientes";
import { useTranslations } from "next-intl";
import { withTimeout } from "@/lib/utils";

interface Props {
  pacienteId: string;
  activo: boolean;
}

export function PacienteActions({ pacienteId, activo }: Props) {
  const t = useTranslations("patients");
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggleActivo() {
    setLoading(true);
    try {
      await withTimeout(toggleActivoPaciente(pacienteId));
      toast.success(
        activo ? t("actions.marcadoInactivo") : t("actions.marcadoActivo")
      );
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("actions.errorCambiarEstado"));
    }
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await withTimeout(eliminarPaciente(pacienteId));
      toast.success(t("actions.eliminadoCorrectamente"));
      await new Promise((r) => setTimeout(r, 800)); window.location.href = "/pacientes";
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error(t("actions.errorEliminar"));
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleToggleActivo}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
        title={activo ? t("actions.desactivarPaciente") : t("actions.activarPaciente")}
      >
        <Power className="w-4 h-4" />
        {activo ? t("actions.desactivar") : t("actions.activar")}
      </button>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">
              {t("actions.eliminarPaciente")}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t("actions.eliminarConfirmacion")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                {t("actions.cancelar")}
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("actions.eliminar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
