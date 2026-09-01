"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { crearClase } from "@/app/actions/clases";
import { cursoQueSeContrata } from "@/lib/docencia";

export function CrearClaseBoton({ puedeCrear }: { puedeCrear: boolean }) {
  const t = useTranslations("docencia");
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState("");
  const [curso, setCurso] = useState(cursoQueSeContrata());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await crearClase({ nombre, curso });
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

            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("clases.curso")}</label>
              <input
                type="text"
                value={curso}
                onChange={(e) => setCurso(e.target.value)}
                maxLength={20}
                className={input}
              />
            </div>

            <button
              type="submit"
              disabled={isPending || !nombre.trim()}
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
