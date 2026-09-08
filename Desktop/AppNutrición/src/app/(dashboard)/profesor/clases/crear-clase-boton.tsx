"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { crearClase } from "@/app/actions/clases";
import { finDeCursoPorDefecto, inicioDeCursoPorDefecto } from "@/lib/docencia";
import { DatePicker } from "@/components/date-picker";

/**
 * Nueva clase: el nombre y las fechas del curso. Sin texto libre de "2026/27": el curso es del día
 * que empieza al día que acaba (Guillermo, 4 sep 2026), y por defecto va de hoy al 31 de agosto.
 */
export function CrearClaseBoton({ puedeCrear }: { puedeCrear: boolean }) {
  const t = useTranslations("docencia");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState(inicioDeCursoPorDefecto());
  const [fechaFin, setFechaFin] = useState(finDeCursoPorDefecto());

  // Las dos fechas llegan como YYYY-MM-DD, así que se comparan tal cual.
  const cursoAlReves = !!fechaInicio && !!fechaFin && fechaFin <= fechaInicio;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await crearClase({ nombre, fechaInicioCurso: fechaInicio || undefined, fechaFinCurso: fechaFin || undefined });
      if (result.ok && result.claseId) {
        toast.success(t("clases.creada"));
        setAbierto(false);
        setNombre("");
        router.push(`/profesor/clases/${result.claseId}`);
      } else {
        toast.error(result.error || t("clases.errorCrear"));
      }
    });
  }

  if (!puedeCrear) {
    return <p className="text-sm text-muted-foreground">{t("clases.noPuedeCrear")}</p>;
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
      >
        <Plus className="w-4 h-4" />
        {t("clases.crear")}
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => !isPending && setAbierto(false)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{t("clases.crear")}</h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                aria-label={t("clases.cerrar")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("clases.nombre")}</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                maxLength={120}
                autoFocus
                placeholder={t("clases.nombrePlaceholder")}
                className={input}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("clases.inicioCurso")}</label>
                <div className="mt-1">
                  <DatePicker value={fechaInicio} onChange={setFechaInicio} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">{t("clases.finCurso")}</label>
                <div className="mt-1">
                  <DatePicker value={fechaFin} onChange={setFechaFin} />
                </div>
              </div>
            </div>
            {/* De la fecha de fin depende cuándo pierden el acceso los alumnos: una clase al revés
                nace con el curso ya terminado. Se avisa aquí y se comprueba también en el servidor. */}
            {cursoAlReves ? (
              <p className="text-xs text-red-600 dark:text-red-400 -mt-2">{t("clases.cursoAlReves")}</p>
            ) : (
              <p className="text-xs text-muted-foreground -mt-2">{t("clases.finCursoAyuda")}</p>
            )}

            <button
              type="submit"
              disabled={isPending || !nombre.trim() || cursoAlReves}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {t("clases.crear")}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
