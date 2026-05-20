"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { guardarComoPlantilla } from "@/app/actions/planes";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { isNextNavigation, withTimeout } from "@/lib/utils";

export function PlantillaButton({ planId }: { planId: string }) {
  const t = useTranslations("diets.plantillaButton");
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGuardar() {
    if (!nombre.trim()) return;
    setLoading(true);
    try {
      await withTimeout(guardarComoPlantilla(planId, nombre));
      toast.success(t("toastSaved"));
      setOpen(false);
      setNombre("");
    } catch (error) { if (isNextNavigation(error)) throw error;
      toast.error(t("toastSaveError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg hover:bg-muted transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none min-h-10 sm:min-h-0"
        aria-label={t("saveAsTemplate")}
      >
        <FileDown className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t("label")}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="font-semibold mb-4">{t("saveAsTemplate")}</h3>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={t("templateName")}
              autoFocus
              maxLength={200}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleGuardar}
                disabled={!nombre.trim() || loading}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loading ? t("saving") : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
