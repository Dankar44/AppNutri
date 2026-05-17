"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { verificarDietista, rechazarDietista } from "@/app/actions/admin";
import { toast } from "sonner";

interface Props {
  dietistaId: string;
  nombre: string;
}

export function VerificacionActions({ dietistaId, nombre }: Props) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [loading, setLoading] = useState<"verificar" | "rechazar" | null>(null);
  const [confirmarRechazo, setConfirmarRechazo] = useState(false);

  async function handleVerificar() {
    setLoading("verificar");
    try {
      await verificarDietista(dietistaId);
      toast.success(t("verificaciones.toast.verificado", { nombre }));
      router.refresh();
    } catch {
      toast.error(t("verificaciones.toast.errorVerificar"));
    } finally {
      setLoading(null);
    }
  }

  async function handleRechazar() {
    setLoading("rechazar");
    try {
      await rechazarDietista(dietistaId);
      toast.success(t("verificaciones.toast.rechazado", { nombre }));
      router.refresh();
    } catch {
      toast.error(t("verificaciones.toast.errorRechazar"));
    } finally {
      setLoading(null);
      setConfirmarRechazo(false);
    }
  }

  if (confirmarRechazo) {
    return (
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm text-red-600 dark:text-red-400">{t("verificaciones.actions.confirmarRechazo")}</span>
        <button
          onClick={handleRechazar}
          disabled={loading !== null}
          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
        >
          {loading === "rechazar" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("verificaciones.actions.si")}
        </button>
        <button
          onClick={() => setConfirmarRechazo(false)}
          className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted"
        >
          {t("verificaciones.actions.no")}
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
        {t("verificaciones.actions.verificar")}
      </button>
      <button
        onClick={() => setConfirmarRechazo(true)}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-500/15 disabled:opacity-50 transition-colors"
      >
        <X className="w-4 h-4" />
        {t("verificaciones.actions.rechazar")}
      </button>
    </div>
  );
}
