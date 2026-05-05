"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Copy, Check, XCircle } from "lucide-react";
import { crearEnlace, eliminarEnlace } from "@/app/actions/compartir";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface Enlace {
  id: string;
  token: string;
  createdAt: Date | string;
}

export function CompartirPanel({
  planId,
  enlaces,
}: {
  planId: string;
  enlaces: Enlace[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function handleCrear() {
    setLoading(true);
    try {
      await crearEnlace(planId);
      toast.success("Enlace creado");
      router.refresh();
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al crear enlace");
    } finally {
      setLoading(false);
    }
  }

  async function handleEliminar(id: string) {
    try {
      await eliminarEnlace(id);
      toast.success("Enlace eliminado");
      router.refresh();
    } catch (error) { if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al eliminar");
    }
  }

  function copyUrl(token: string) {
    const url = `${window.location.origin}/compartido/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    toast.success("Enlace copiado");
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6 max-w-xl">
      <button
        onClick={handleCrear}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
      >
        <Link2 className="w-4 h-4" />
        {loading ? "Generando..." : "Generar nuevo enlace"}
      </button>

      <div className="space-y-3">
        {enlaces.map((enlace) => (
          <div
            key={enlace.id}
            className="p-4 rounded-lg border border-border"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400">
                Activo
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(enlace.createdAt)}
              </span>
            </div>
            <code className="text-xs text-muted-foreground block truncate mb-2">
              /compartido/{enlace.token}
            </code>
            <div className="flex gap-2">
              <button
                onClick={() => copyUrl(enlace.token)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded border border-border hover:bg-muted transition-colors text-xs font-medium"
              >
                {copied === enlace.token ? (
                  <><Check className="w-3 h-3" /> Copiado</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copiar enlace</>
                )}
              </button>
              <button
                onClick={() => handleEliminar(enlace.id)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/15 transition-colors text-xs font-medium"
              >
                <XCircle className="w-3 h-3" /> Eliminar
              </button>
            </div>
          </div>
        ))}
        {enlaces.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay enlaces creados. Genera uno para compartir este plan.
          </p>
        )}
      </div>
    </div>
  );
}
