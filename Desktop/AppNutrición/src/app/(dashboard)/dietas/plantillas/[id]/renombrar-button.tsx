"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { renombrarPlantilla } from "@/app/actions/plantillas";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function RenombrarPlantillaButton({ id, nombreActual }: { id: string; nombreActual: string }) {
  const t = useTranslations("diets.plantillaDetalle");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(nombreActual);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    if (trimmed === nombreActual) { setOpen(false); return; }

    setSaving(true);
    const res = await renombrarPlantilla(id, trimmed);
    setSaving(false);

    if (res.ok) {
      toast.success(t("toastRenamed"));
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error || t("toastRenameError"));
    }
  }

  return (
    <>
      <button
        onClick={() => { setNombre(nombreActual); setOpen(true); }}
        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg hover:bg-muted transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none min-h-10 sm:min-h-0"
        title={t("renameTitle")}
      >
        <Pencil className="w-3.5 h-3.5" />
        <span className="hidden xs:inline sm:inline">{t("rename")}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm mx-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{t("renameTitle")}</h3>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
              maxLength={100}
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                {t("renameCancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !nombre.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? t("renameSaving") : t("renameSave")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
