"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogSize = "sm" | "md" | "lg" | "xl";

interface DialogWrapperProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: DialogSize;
  sheetOnMobile?: boolean;
  hideCloseButton?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
};

/**
 * Modal responsive estándar.
 * - Móvil (<640px): bottom sheet con rounded-t-xl, safe-area-bottom, max-h-[90dvh]
 * - Desktop (>=640px): modal centrado clásico
 *
 * Uso:
 * <DialogWrapper open={open} onClose={cerrar} title="Mi título" size="md">
 *   ...contenido...
 * </DialogWrapper>
 */
export function DialogWrapper({
  open,
  onClose,
  title,
  size = "md",
  sheetOnMobile = true,
  hideCloseButton = false,
  children,
  footer,
}: DialogWrapperProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    // Bloquear scroll del body
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center bg-black/50 px-0 sm:px-4",
        sheetOnMobile ? "items-end sm:items-center" : "items-center",
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-card border border-border shadow-xl w-full flex flex-col",
          sizeClasses[size],
          sheetOnMobile
            ? "rounded-t-2xl sm:rounded-xl max-h-[90dvh] pb-safe sm:pb-0"
            : "rounded-xl mx-4 max-h-[90dvh]",
        )}
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border">
            {title && (
              <h3 id="dialog-title" className="font-semibold text-base truncate">
                {title}
              </h3>
            )}
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="p-2 rounded-lg hover:bg-muted transition-colors min-h-11 min-w-11 flex items-center justify-center shrink-0 -mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto touch-scroll-x">{children}</div>
        {footer && (
          <div className="border-t border-border p-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
