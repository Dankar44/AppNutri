"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { copiarAlimento } from "@/app/actions/alimentos";
import { copiarReceta } from "@/app/actions/recetas";

/**
 * #39 — "Copiar a lo mío", para el material que a uno le comparten.
 *
 * El alumno coge lo del profesor y lo toca sin miedo: se lleva una copia y el original se queda
 * como estaba. El tipo va como texto, no como función: por el límite servidor→cliente.
 */
export function CopiarMaterialButton({ id, tipo }: { id: string; tipo: "alimento" | "receta" }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function copiar() {
    startTransition(async () => {
      const result = tipo === "alimento" ? await copiarAlimento(id) : await copiarReceta(id);
      if (result.ok && result.id) {
        toast.success(t("copiarMaterial.hecha"));
        router.push(tipo === "alimento" ? `/alimentos/${result.id}/editar` : `/recetas/${result.id}/editar`);
      } else {
        toast.error(result.error || t("copiarMaterial.error"));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={copiar}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
      {t("copiarMaterial.boton")}
    </button>
  );
}
