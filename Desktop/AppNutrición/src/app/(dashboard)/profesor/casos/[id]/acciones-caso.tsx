"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Copy, Archive, ArchiveRestore, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { archivarCaso, duplicarCaso } from "@/app/actions/casos";
import { ConfirmModal } from "@/components/confirm-modal";

/** Editar, duplicar y archivar un caso. Archivar no borra las entregas hechas. */
export function AccionesCaso({ casoId, archivado }: { casoId: string; archivado: boolean }) {
  const t = useTranslations("casos");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);

  function duplicar() {
    startTransition(async () => {
      const result = await duplicarCaso(casoId);
      if (result.ok && result.casoId) {
        toast.success(t("acciones.duplicado"));
        router.push(`/profesor/casos/${result.casoId}`);
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  function cambiarArchivo() {
    startTransition(async () => {
      const result = await archivarCaso(casoId, !archivado);
      if (result.ok) {
        toast.success(archivado ? t("acciones.desarchivado") : t("acciones.archivado"));
        setConfirmando(false);
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  const boton =
    "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Link href={`/profesor/casos/${casoId}/editar`} className={boton}>
          <Pencil className="w-4 h-4" />
          {t("acciones.editar")}
        </Link>
        <button type="button" onClick={duplicar} disabled={isPending} className={boton}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
          {t("acciones.duplicar")}
        </button>
        <button type="button" onClick={() => setConfirmando(true)} className={boton}>
          {archivado ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          {archivado ? t("acciones.desarchivar") : t("acciones.archivar")}
        </button>
      </div>

      <ConfirmModal
        open={confirmando}
        title={archivado ? t("acciones.desarchivar") : t("acciones.archivar")}
        description={t("acciones.archivarTexto")}
        confirmLabel={archivado ? t("acciones.desarchivar") : t("acciones.archivar")}
        loading={isPending}
        onConfirm={cambiarArchivo}
        onCancel={() => setConfirmando(false)}
      />
    </>
  );
}
