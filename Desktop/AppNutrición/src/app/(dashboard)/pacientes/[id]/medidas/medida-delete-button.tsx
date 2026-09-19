"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { eliminarMedida } from "@/app/actions/medidas";
import { toast } from "sonner";
import { isNextNavigation } from "@/lib/utils";
import { useDemoGuard } from "@/contexts/demo-context";

export function MedidaDeleteButton({
  medidaId,
  cantidadMediciones,
}: {
  medidaId: string;
  cantidadMediciones: number;
}) {
  const router = useRouter();
  const t = useTranslations("patients");
  const blockIfDemo = useDemoGuard();
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function handleDelete() {
    if (blockIfDemo()) return;
    setEliminando(true);
    try {
      await eliminarMedida(medidaId);
      setMostrarConfirmacion(false);
      toast.success(t("medidas.medidaEliminada"));
      router.refresh();
    } catch (error) {
      if (isNextNavigation(error)) throw error;
      toast.error(t("medidas.errorEliminar"));
    } finally {
      setEliminando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (blockIfDemo()) return;
          setMostrarConfirmacion(true);
        }}
        disabled={eliminando}
        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-500/15 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
        title={t("medidas.eliminarMedida")}
        aria-label={t("medidas.eliminarMedida")}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {mostrarConfirmacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmar-eliminar-medicion-titulo"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 id="confirmar-eliminar-medicion-titulo" className="text-lg font-semibold">
                  {cantidadMediciones > 1
                    ? t("medidas.confirmarEliminarGrupoTitulo")
                    : t("medidas.confirmarEliminarTitulo")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {cantidadMediciones > 1
                    ? t("medidas.confirmarEliminarGrupoDescripcion", {
                        count: cantidadMediciones,
                      })
                    : t("medidas.confirmarEliminarDescripcion")}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setMostrarConfirmacion(false)}
                disabled={eliminando}
                autoFocus
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {t("medidas.cancelar")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={eliminando}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {eliminando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {t("medidas.eliminarMedida")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
