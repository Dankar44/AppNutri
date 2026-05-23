"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  open: boolean;
  nombre: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteDietistaModal({ open, nombre, loading, onConfirm, onCancel }: Props) {
  const t = useTranslations("admin.dietistas.eliminar");
  const [inputValue, setInputValue] = useState("");
  const palabraConfirmacion = t("palabraConfirmacion");
  const coincide = inputValue === palabraConfirmacion;

  useEffect(() => {
    if (!open) setInputValue("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div
        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full shrink-0 bg-red-100 dark:bg-red-500/15">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base">{t("titulo")}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t("descripcion", { nombre })}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded hover:bg-muted transition-colors shrink-0 -mt-1 -mr-1"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1.5">{t("inputLabel")}</label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={palabraConfirmacion}
            autoFocus
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!coincide || loading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 bg-red-500 text-white hover:bg-red-600"
          >
            {loading ? t("eliminando") : t("confirmarLabel")}
          </button>
        </div>
      </div>
    </div>
  );
}
