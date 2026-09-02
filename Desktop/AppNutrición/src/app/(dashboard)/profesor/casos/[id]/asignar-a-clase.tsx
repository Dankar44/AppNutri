"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { asignarCasoAClase } from "@/app/actions/casos";
import { cn } from "@/lib/utils";

/**
 * #40 — El botón «Asignar a una clase» con su fecha límite.
 *
 * Está en dos sitios a propósito: en la ficha del caso y encima de la ficha del paciente plantilla,
 * que es donde el profesor pasa el rato rellenando y desde donde pidió poder asignar sin dar
 * vueltas (Guillermo, 2 sep 2026). Si no quedan clases sin el caso, no pinta nada.
 */
export function AsignarAClase({
  casoId,
  clases,
  destacado = false,
}: {
  casoId: string;
  clases: { id: string; nombre: string; curso: string | null }[];
  /** Como botón principal (en el aviso de la ficha) en vez de como enlace discreto. */
  destacado?: boolean;
}) {
  const t = useTranslations("casos");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [claseId, setClaseId] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");

  if (clases.length === 0) return null;

  function asignar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await asignarCasoAClase(casoId, claseId, fechaLimite || undefined);
      if (result.ok) {
        toast.success(t("asignar.asignado"));
        setAbierto(false);
        setClaseId("");
        setFechaLimite("");
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium",
          destacado
            ? "bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            : "text-primary hover:underline",
        )}
      >
        <Plus className="w-4 h-4" />
        {t("asignar.anadir")}
      </button>
    );
  }

  return (
    <form onSubmit={asignar} className="space-y-3 w-full">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("asignar.elige")}</label>
          <select value={claseId} onChange={(e) => setClaseId(e.target.value)} required autoFocus className={input}>
            <option value="">—</option>
            {clases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}{c.curso ? ` · ${c.curso}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{t("asignar.fechaLimite")}</label>
          <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} className={input} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !claseId}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
          {t("asignar.asignar")}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("asignar.cancelar")}
        </button>
      </div>
    </form>
  );
}
