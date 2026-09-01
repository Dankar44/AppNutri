"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, Loader2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  anadirProfesorAClase,
  quitarProfesorDeClase,
  type ProfesorDeClase,
} from "@/app/actions/clases";
import { ConfirmModal } from "@/components/confirm-modal";

/**
 * #39 — Quién lleva la clase.
 *
 * En una facultad la misma asignatura la dan varios profesores, y todos tienen que ver los mismos
 * alumnos y el mismo trabajo (Guillermo, 1 sep 2026). Solo se puede añadir a gente de la misma
 * facultad, y al que la creó no se le puede quitar.
 */
export function ProfesoresClase({
  claseId,
  profesores,
  candidatos,
}: {
  claseId: string;
  profesores: ProfesorDeClase[];
  candidatos: ProfesorDeClase[];
}) {
  const t = useTranslations("docencia");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [anadiendo, setAnadiendo] = useState(false);
  const [quitando, setQuitando] = useState<ProfesorDeClase | null>(null);

  function anadir(profesorId: string) {
    startTransition(async () => {
      const result = await anadirProfesorAClase(claseId, profesorId);
      if (result.ok) {
        toast.success(t("profesores.anadido"));
        setAnadiendo(false);
        router.refresh();
      } else {
        toast.error(result.error || t("clases.errorGuardar"));
      }
    });
  }

  function quitar() {
    if (!quitando) return;
    startTransition(async () => {
      const result = await quitarProfesorDeClase(claseId, quitando.id);
      if (result.ok) {
        toast.success(t("profesores.quitado"));
        setQuitando(null);
        router.refresh();
      } else {
        toast.error(result.error || t("clases.errorGuardar"));
      }
    });
  }

  return (
    <section className="py-4 lg:p-5 lg:border lg:border-border lg:rounded-xl lg:bg-card">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-semibold inline-flex items-center gap-2">
          <UserCog className="w-4 h-4 text-muted-foreground" />
          {t("profesores.titulo", { n: profesores.length })}
        </h3>
        {candidatos.length > 0 && !anadiendo && (
          <button
            type="button"
            onClick={() => setAnadiendo(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <UserPlus className="w-4 h-4" />
            {t("profesores.anadir")}
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-1">{t("profesores.explicacion")}</p>

      <div className="mt-3 divide-y divide-border">
        {profesores.map((p) => (
          <div key={p.id} className="flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">
                {p.nombre} {p.apellidos}
                {p.esElCreador && (
                  <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {t("profesores.creador")}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground truncate">{p.email}</p>
            </div>
            {!p.esElCreador && (
              <button
                type="button"
                onClick={() => setQuitando(p)}
                aria-label={t("profesores.quitar")}
                title={t("profesores.quitar")}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {anadiendo && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("profesores.elige")}</p>
          {candidatos.map((c) => (
            <button
              key={c.id}
              type="button"
              disabled={isPending}
              onClick={() => anadir(c.id)}
              className="w-full flex items-center gap-2 text-left rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50 transition-colors"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span className="min-w-0 flex-1 truncate">
                {c.nombre} {c.apellidos} <span className="text-muted-foreground">· {c.email}</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAnadiendo(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t("profesores.cancelar")}
          </button>
        </div>
      )}

      <ConfirmModal
        open={quitando !== null}
        title={t("profesores.quitar")}
        description={t("profesores.quitarTexto", { nombre: quitando ? `${quitando.nombre} ${quitando.apellidos}` : "" })}
        confirmLabel={t("profesores.quitar")}
        loading={isPending}
        onConfirm={quitar}
        onCancel={() => setQuitando(null)}
      />
    </section>
  );
}
