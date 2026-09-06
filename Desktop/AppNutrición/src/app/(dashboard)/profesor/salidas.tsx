"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { dejarLaUniversidad, dejarDeSerProfesor } from "@/app/actions/docencia";
import { ConfirmModal } from "@/components/confirm-modal";

/**
 * #39 — Las dos salidas que decide el profesor por su cuenta (Guillermo, 6 sep 2026).
 *
 * Dejar la universidad libera su plaza y le quita las clases de esa facultad, pero sigue siendo
 * docente, esperando a que le metan en otra. Dejar de ser profesor le devuelve a su cuenta de
 * nutricionista de siempre. En las dos, sus pacientes y su trabajo siguen donde estaban.
 */
export function SalidasDelProfesor({ institucion }: { institucion: string | null }) {
  const t = useTranslations("docencia");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [abierto, setAbierto] = useState<"universidad" | "docencia" | null>(null);

  function confirmar() {
    const que = abierto;
    if (!que) return;
    startTransition(async () => {
      const result = que === "universidad" ? await dejarLaUniversidad() : await dejarDeSerProfesor();
      if (result.ok) {
        toast.success(t(que === "universidad" ? "salidas.fueraUniversidad" : "salidas.fueraDocencia"));
        setAbierto(null);
        router.push(que === "universidad" ? "/profesor" : "/dashboard");
        router.refresh();
      } else {
        toast.error(result.error || t("clases.errorGuardar"));
      }
    });
  }

  return (
    <section className="pt-2">
      <details className="group">
        <summary className="text-xs text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1.5 list-none">
          <LogOut className="w-3.5 h-3.5" />
          {t("salidas.titulo")}
        </summary>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {institucion && (
            <button
              type="button"
              onClick={() => setAbierto("universidad")}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t("salidas.dejarUniversidad", { institucion })}
            </button>
          )}
          <button
            type="button"
            onClick={() => setAbierto("docencia")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
          >
            <GraduationCap className="w-4 h-4" />
            {t("salidas.dejarDocencia")}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{t("salidas.ayuda")}</p>
      </details>

      <ConfirmModal
        open={abierto !== null}
        title={t(abierto === "docencia" ? "salidas.dejarDocenciaTitulo" : "salidas.dejarUniversidadTitulo")}
        description={
          abierto === "docencia"
            ? t("salidas.dejarDocenciaTexto")
            : t("salidas.dejarUniversidadTexto", { institucion: institucion ?? "" })
        }
        confirmLabel={t(abierto === "docencia" ? "salidas.dejarDocenciaConfirmar" : "salidas.dejarUniversidadConfirmar")}
        destructive
        loading={isPending}
        onConfirm={confirmar}
        onCancel={() => setAbierto(null)}
      />
    </section>
  );
}
