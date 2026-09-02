"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cambiarFechaLimite } from "@/app/actions/casos";

/**
 * La fecha límite de un caso en UNA clase, con su lápiz al lado. Va junto al nombre de la clase
 * para que se entienda de quién es el plazo: el mismo caso puede tener otra fecha en otra clase.
 */
export function FechaLimite({
  asignacionId,
  valor,
  /** Ya formateada en el servidor ("Hasta el 12/09/2026"), o el texto de "sin fecha límite". */
  etiqueta,
}: {
  asignacionId: string;
  valor: string;
  etiqueta: string;
}) {
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
        title={valor ? t("asignar.cambiarFecha") : t("asignar.ponerFecha")}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {etiqueta}
        <Pencil className="w-3 h-3" />
      </button>
    );
  }

  return (
    <form onSubmit={guardar} className="inline-flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={fecha}
        autoFocus
        onChange={(e) => setFecha(e.target.value)}
        aria-label={t("asignar.fechaLimite")}
        className="rounded-lg border border-border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-2.5 py-1 rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50"
      >
        {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
        {t("guardar")}
      </button>
      <button type="button" onClick={() => setEditando(false)} className="text-xs text-muted-foreground hover:text-foreground">
        {t("cancelar")}
      </button>
    </form>
  );
}
