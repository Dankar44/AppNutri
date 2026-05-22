"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  const isModuleError =
    error.message?.includes("module factory") ||
    error.message?.includes("chunk") ||
    error.message?.includes("Loading chunk");

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          margin: 0,
          background: "#fafafa",
          color: "#18181b",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            Algo ha fallado
          </h2>
          <p style={{ fontSize: 14, color: "#71717a", marginBottom: 20 }}>
            {isModuleError
              ? "El navegador cargó una versión antigua del código. Esto se arregla recargando."
              : "Ha ocurrido un error inesperado."}
          </p>
          <button
            onClick={() => {
              if (isModuleError) {
                window.location.reload();
              } else {
                reset();
              }
            }}
            style={{
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 8,
              border: "none",
              background: "#18181b",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {isModuleError ? "Recargar página" : "Reintentar"}
          </button>
        </div>
      </body>
    </html>
  );
}
