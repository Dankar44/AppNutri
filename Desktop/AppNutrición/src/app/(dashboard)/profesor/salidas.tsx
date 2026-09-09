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
 * Dejar la universidad le quita las clases de esa facultad, pero **sigue siendo docente hasta el
 * 31 de agosto de ese curso**: su plaza está pagada y sus casos son suyos. La plaza no vuelve a la
 * bolsa. Dejar de ser profesor le devuelve ya a su cuenta de nutricionista de siempre. En las dos,
 * sus pacientes y su trabajo siguen donde estaban.
 *
 * Vive en Ajustes, con lo demás de su cuenta: estaba escondido en un desplegable dentro del espacio
 * docente y ahí no lo buscaba nadie (Guillermo, 9 sep 2026).
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
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
      <p className="text-xs text-muted-foreground mt-3">{t("salidas.ayuda")}</p>

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
    </div>
  );
}
