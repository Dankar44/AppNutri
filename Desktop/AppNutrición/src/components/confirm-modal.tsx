"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div
        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className={`p-2 rounded-full shrink-0 ${destructive ? "bg-red-100 dark:bg-red-500/15" : "bg-amber-100 dark:bg-amber-500/15"}`}>
            <AlertTriangle className={`w-5 h-5 ${destructive ? "text-red-500" : "text-amber-500"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-muted transition-colors shrink-0 -mt-1 -mr-1"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              destructive
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {loading ? "Eliminando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
