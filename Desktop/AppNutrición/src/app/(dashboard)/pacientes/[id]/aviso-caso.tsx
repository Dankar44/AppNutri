"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, CalendarClock, Send, Undo2, Loader2, Star, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { entregarCaso, deshacerEntrega } from "@/app/actions/aula";

/**
 * #40 — Lo que el alumno necesita tener delante mientras trabaja el caso.
 *
 * Sin esto, la consigna y la fecha solo estaban en el aula: se ponía a hacer el plan sin recordar
 * qué le habían pedido, y para entregar tenía que volver a buscar (auditoría 2 sep 2026).
 */
export function AvisoCaso({
  asignacionId,
  casoNombre,
  consigna,
  claseNombre,
  estado,
  nota,
  comentario,
  fechaLimite,
  fueraDePlazo,
}: {
  asignacionId: string;
  casoNombre: string;
  consigna: string | null;
  claseNombre: string;
  estado: "SIN_EMPEZAR" | "EN_MARCHA" | "ENTREGADA" | "CORREGIDA";
  nota: number | null;
  comentario: string | null;
  /** Ya formateada en el servidor. */
  fechaLimite: string | null;
  fueraDePlazo: boolean;
}) {
  const t = useTranslations("aula");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const entregada = estado === "ENTREGADA" || estado === "CORREGIDA";

  function accion(entregar: boolean) {
    startTransition(async () => {
      const result = entregar ? await entregarCaso(asignacionId) : await deshacerEntrega(asignacionId);
      if (result.ok) {
        toast.success(entregar ? t("casos.entregado") : t("casos.entregaDeshecha"));
        router.refresh();
      } else {
        toast.error(result.error || t("casos.errorAbrir"));
      }
    });
  }

  return (
    <section className="mb-6 py-4 lg:p-5 lg:rounded-xl lg:border lg:border-primary/30 lg:bg-primary/5 border-b border-border lg:border-b">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary inline-flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            {t("casos.esUnCaso", { clase: claseNombre })}
          </p>
          <h2 className="font-semibold mt-0.5">{casoNombre}</h2>
        </div>
        {nota !== null && (
          <span className="inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary shrink-0 tabular-nums">
            <Star className="w-3.5 h-3.5" />
            {nota}
          </span>
        )}
      </div>

      {consigna && <p className="text-sm mt-2 whitespace-pre-wrap">{consigna}</p>}

      {fechaLimite && (
        <p
          className={`text-xs mt-2 inline-flex items-center gap-1 ${
            fueraDePlazo ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
          }`}
        >
          {fueraDePlazo ? <AlertTriangle className="w-3.5 h-3.5" /> : <CalendarClock className="w-3.5 h-3.5" />}
          {fueraDePlazo ? t("casos.sePasoLaFecha", { fecha: fechaLimite }) : t("casos.entregaAntes", { fecha: fechaLimite })}
        </p>
      )}

      {comentario && (
        <div className="mt-3 py-3 lg:p-3 lg:rounded-lg lg:bg-card border-t border-border lg:border-t-0">
          <p className="text-xs font-medium text-muted-foreground">{t("casos.comentarioDelProfesor")}</p>
          <p className="text-sm mt-0.5 whitespace-pre-wrap">{comentario}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {estado !== "CORREGIDA" && (
          <button
            type="button"
            onClick={() => accion(!entregada)}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              entregada
                ? "border border-border hover:bg-muted"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : entregada ? <Undo2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {entregada ? t("casos.deshacerEntrega") : t("casos.entregar")}
          </button>
        )}
        <Link
          href="/aula"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t("casos.volverAlAula")}
        </Link>
      </div>
    </section>
  );
}
