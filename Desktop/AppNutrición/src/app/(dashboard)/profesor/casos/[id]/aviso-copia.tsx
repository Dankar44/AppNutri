"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ocultarAvisoCopia } from "@/app/actions/casos";

/**
 * #40 — "N alumnos ya lo han empezado y tienen su copia: lo que cambies ahora no les llega".
 * Con una ✕ que lo quita para este caso y no vuelve (Guillermo, 3 sep 2026). Se guarda en el
 * caso, no en el navegador. Interfaz optimista: desaparece al instante.
 */
export function AvisoCopia({ casoId, empezados, oculto }: { casoId: string; empezados: number; oculto: boolean }) {
  const t = useTranslations("casos");
  const [visible, setVisible] = useState(!oculto && empezados > 0);
  const [, startTransition] = useTransition();
  if (!visible) return null;

  function quitar() {
    setVisible(false);
    startTransition(async () => {
      const r = await ocultarAvisoCopia(casoId);
      if (!r.ok) setVisible(true);
    });
  }

  return (
    <p className="text-sm mt-2 flex items-start gap-1.5 text-amber-800 dark:text-amber-300">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="flex-1">{t("paciente.yaEmpezado", { n: empezados })}</span>
      <button
        type="button"
        onClick={quitar}
        aria-label={t("paciente.quitarAviso")}
        title={t("paciente.quitarAviso")}
        className="p-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-500/20 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </p>
  );
}
