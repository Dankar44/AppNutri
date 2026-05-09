"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, FileDown, Share2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { guardarComoPlantilla, eliminarPlan } from "@/app/actions/planes";
import { toast } from "sonner";

const ACTIONS = [
  { id: "ia", icon: Sparkles, label: "IA", style: "border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400" },
  { id: "plantilla", icon: FileDown, label: "Plantilla", style: "" },
  { id: "compartir", icon: Share2, label: "Compartir", style: "" },
  { id: "editar", icon: Pencil, label: "Editar", style: "" },
  { id: "eliminar", icon: Trash2, label: "Eliminar", style: "border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400" },
] as const;

export function ActionBarMobile({ planId }: { planId: string }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [plantillaOpen, setPlantillaOpen] = useState(false);
  const [plantillaNombre, setPlantillaNombre] = useState("");
  const [plantillaLoading, setPlantillaLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setExpanded(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  function handleTap(id: string) {
    if (expanded === id) {
      switch (id) {
        case "ia": router.push(`/dietas/${planId}/generar-ia`); break;
        case "plantilla": setPlantillaOpen(true); break;
        case "compartir": router.push(`/dietas/${planId}/compartir`); break;
        case "editar": router.push(`/dietas/${planId}/editar`); break;
        case "eliminar": setConfirmDelete(true); break;
      }
    } else {
      setExpanded(id);
    }
  }

  async function handleGuardarPlantilla() {
    if (!plantillaNombre.trim()) return;
    setPlantillaLoading(true);
    try {
      await guardarComoPlantilla(planId, plantillaNombre);
      toast.success("Plantilla guardada");
      setPlantillaOpen(false);
      setPlantillaNombre("");
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al guardar plantilla");
    } finally {
      setPlantillaLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await eliminarPlan(planId);
      toast.success("Plan eliminado correctamente");
      await new Promise((r) => setTimeout(r, 800));
      window.location.href = "/dietas";
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al eliminar el plan");
    }
  }

  if (confirmDelete) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-2">
        <span className="text-xs text-muted-foreground">¿Eliminar?</span>
        <button
          onClick={handleDelete}
          className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
        >
          Sí
        </button>
        <button
          onClick={() => setConfirmDelete(false)}
          className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        ref={barRef}
        className="flex items-center gap-1 rounded-xl border border-border bg-card p-1"
      >
        {ACTIONS.map(({ id, icon: Icon, label, style }) => {
          const isExpanded = expanded === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTap(id)}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg transition-all duration-300 ease-in-out text-xs font-medium min-h-10",
                isExpanded ? "px-3 py-2" : "px-2 py-2 flex-1",
                style || "hover:bg-muted",
              )}
              aria-label={label}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span
                className="overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out"
                style={{
                  maxWidth: isExpanded ? "5rem" : "0",
                  opacity: isExpanded ? 1 : 0,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {plantillaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold mb-4">Guardar como plantilla</h3>
            <input
              type="text"
              value={plantillaNombre}
              onChange={(e) => setPlantillaNombre(e.target.value)}
              placeholder="Nombre de la plantilla"
              autoFocus
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPlantillaOpen(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarPlantilla}
                disabled={!plantillaNombre.trim() || plantillaLoading}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {plantillaLoading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
