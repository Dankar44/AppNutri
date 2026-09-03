"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { actualizarCopiasDelCaso } from "@/app/actions/casos";
import { ConfirmModal } from "@/components/confirm-modal";

/**
 * #40 — «Actualizar el caso en los alumnos»: vuelca la ficha actual del caso a los alumnos que ya
 * tienen su copia (Guillermo, 3 sep 2026). Con confirmación, porque sobrescribe lo que hayan
 * tocado en la ficha (no en sus planes ni en su planificación).
 */
export function ActualizarCopias({
  casoId,
  empezados,
  ultimaVez,
}: {
  casoId: string;
  empezados: number;
  /** Ya formateada en el servidor, o null si nunca. */
  ultimaVez: string | null;
}) {
  const t = useTranslations("casos");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  if (empezados === 0) return null;

  function actualizar() {
    startTransition(async () => {
      const r = await actualizarCopiasDelCaso(casoId);
      setConfirmando(false);
      if (!r.ok) {
        toast.error(r.error || t("errorGuardar"));
        return;
      }
      if (r.fallidas) toast.error(t("actualizar.parcial", { n: r.actualizadas ?? 0, fallidas: r.fallidas }));
      else toast.success(t("actualizar.hecho", { n: r.actualizadas ?? 0 }));
      router.refresh();
    });
  }

  return (
    <>
      <span className="inline-flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t("actualizar.boton", { n: empezados })}
        </button>
        {ultimaVez && <span className="text-xs text-muted-foreground">{t("actualizar.ultimaVez", { fecha: ultimaVez })}</span>}
      </span>
      <ConfirmModal
        open={confirmando}
        title={t("actualizar.titulo")}
        description={t("actualizar.texto", { n: empezados })}
        confirmLabel={t("actualizar.confirmar")}
        loading={isPending}
        onConfirm={actualizar}
        onCancel={() => setConfirmando(false)}
      />
    </>
  );
}
