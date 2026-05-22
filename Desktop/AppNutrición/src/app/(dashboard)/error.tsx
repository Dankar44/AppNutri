"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard-error]", error);
  }, [error]);

  const isModuleError =
    error.message?.includes("module factory") ||
    error.message?.includes("chunk") ||
    error.message?.includes("Loading chunk");

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
      <h2 className="text-lg font-semibold mb-2">Algo ha fallado</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {isModuleError
          ? "El navegador cargó una versión antigua del código. Pulsa recargar para solucionarlo."
          : "Ha ocurrido un error inesperado. Puedes reintentar o recargar la página."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => {
            if (isModuleError) {
              window.location.reload();
            } else {
              reset();
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <RotateCcw className="w-4 h-4" />
          {isModuleError ? "Recargar" : "Reintentar"}
        </button>
      </div>
    </div>
  );
}
