"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserMinus, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { quitarRolDocente, sacarProfesorDeLaUniversidad } from "@/app/actions/admin-docencia";
import { ConfirmModal } from "@/components/confirm-modal";

/**
 * Las dos formas de apartar a un profesor (Guillermo, 6 sep 2026), que no son lo mismo:
 *
 *  - **Sacar de la universidad**: libera la plaza y le quita las clases de esta facultad, pero
 *    sigue siendo docente y se le puede asignar a otra universidad.
 *  - **Quitar el rol**: deja de ser docente y vuelve a su cuenta de nutricionista.
 */
export function QuitarRolButton({ dietistaId, nombre }: { dietistaId: string; nombre: string }) {
  const t = useTranslations("admin.universidades");
  const router = useRouter();
  const [abierto, setAbierto] = useState<"universidad" | "rol" | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirmar() {
    const que = abierto;
    if (!que) return;
    startTransition(async () => {
      const result = que === "rol"
        ? await quitarRolDocente(dietistaId)
        : await sacarProfesorDeLaUniversidad(dietistaId);
      if (result.ok) {
        toast.success(t(que === "rol" ? "toastRolQuitado" : "toastFueraDeLaUniversidad"));
        setAbierto(null);
        router.refresh();
      } else {
        toast.error(result.error || t("toastErrorQuitarRol"));
      }
    });
  }

  const boton = "inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0";

  return (
    <>
      <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3 shrink-0">
        <button type="button" onClick={() => setAbierto("universidad")} className={boton}>
          <LogOut className="w-4 h-4" />
          {t("sacarDeLaUniversidad")}
        </button>
        <button type="button" onClick={() => setAbierto("rol")} className={boton}>
          <UserMinus className="w-4 h-4" />
          {t("quitarRol")}
        </button>
      </div>
      <ConfirmModal
        open={abierto !== null}
        title={t(abierto === "rol" ? "quitarRolTitulo" : "sacarDeLaUniversidadTitulo")}
        // Importante que quede claro que NO se borra la cuenta: solo pierde el espacio docente.
        description={t(abierto === "rol" ? "quitarRolTexto" : "sacarDeLaUniversidadTexto", { nombre })}
        confirmLabel={t(abierto === "rol" ? "quitarRol" : "sacarDeLaUniversidad")}
        destructive
        loading={isPending}
        onConfirm={confirmar}
        onCancel={() => setAbierto(null)}
      />
    </>
  );
}
