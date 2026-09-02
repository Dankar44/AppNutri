"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cambiarFechaLimite } from "@/app/actions/casos";

/** Cambiar el plazo sin tener que retirar el caso y volver a asignarlo. */
export function FechaLimite({ asignacionId, valor }: { asignacionId: string; valor: string }) {
  const t = useTranslations("casos");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [fecha, setFecha] = useState(valor);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await cambiarFechaLimite(asignacionId, fecha || undefined);
      if (result.ok) {
        toast.success(t("asignar.fechaCambiada"));
        setEditando(false);
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <CalendarClock className="w-4 h-4" />
        {valor ? t("asignar.cambiarFecha") : t("asignar.ponerFecha")}
      </button>
    );
  }

  return (
    <form onSubmit={guardar} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("asignar.fechaLimite")}</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {t("guardar")}
      </button>
      <button
        type="button"
        onClick={() => setEditando(false)}
        className="text-xs text-muted-foreground hover:text-foreground pb-2"
      >
        {t("cancelar")}
      </button>
    </form>
  );
}
