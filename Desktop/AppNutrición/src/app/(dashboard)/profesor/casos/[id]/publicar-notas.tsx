"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { publicarNotasDeLaClase } from "@/app/actions/casos";
import { ConfirmModal } from "@/components/confirm-modal";

/**
 * #40 — Enseñar de golpe las notas de una clase (Guillermo, 7 sep 2026).
 *
 * Corregir no publica: el profesor va corrigiendo a su ritmo, y cuando ha terminado con todos
 * pulsa esto una vez. Cada alumno ve entonces su nota y su comentario, y le llega el aviso.
 */
export function PublicarNotas({ asignacionId, cuantas }: { asignacionId: string; cuantas: number }) {
  const t = useTranslations("casos");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();

  function publicar() {
    startTransition(async () => {
      const result = await publicarNotasDeLaClase(asignacionId);
      if (result.ok) {
        toast.success(t("entregas.notasPublicadas", { n: result.publicadas ?? 0 }));
        setAbierto(false);
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap py-3">
      <p className="text-xs text-muted-foreground">{t("entregas.sinPublicar", { n: cuantas })}</p>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity shrink-0"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
        {t("entregas.publicarNotas")}
      </button>

      <ConfirmModal
        open={abierto}
        title={t("entregas.publicarTitulo")}
        description={t("entregas.publicarTexto", { n: cuantas })}
        confirmLabel={t("entregas.publicarNotas")}
        loading={isPending}
        onConfirm={publicar}
        onCancel={() => setAbierto(false)}
      />
    </div>
  );
}
