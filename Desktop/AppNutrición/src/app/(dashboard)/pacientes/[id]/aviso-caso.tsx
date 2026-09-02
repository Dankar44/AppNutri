"use client";

import { useState, useTransition } from "react";
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
  const [entregando, setEntregando] = useState(false);
  const [notaAlumno, setNotaAlumno] = useState("");
  const entregada = estado === "ENTREGADA" || estado === "CORREGIDA";

  function accion(entregar: boolean) {
    startTransition(async () => {
      const result = entregar ? await entregarCaso(asignacionId, notaAlumno) : await deshacerEntrega(asignacionId);
      if (result.ok) {
        toast.success(entregar ? t("casos.entregado") : t("casos.entregaDeshecha"));
        setEntregando(false);
        setNotaAlumno("");
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

      {entregando && !entregada && (
        <form onSubmit={(e) => { e.preventDefault(); accion(true); }} className="mt-3 space-y-2">
          <label className="text-xs font-medium text-muted-foreground">{t("casos.notaAlumno")}</label>
          <textarea
            value={notaAlumno}
            onChange={(e) => setNotaAlumno(e.target.value)}
            rows={3}
            maxLength={4000}
            autoFocus
            placeholder={t("casos.notaAlumnoPlaceholder")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          />
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-3">
        {estado !== "CORREGIDA" && !entregada && !entregando && (
          <button
            type="button"
            onClick={() => setEntregando(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground hover:opacity-90"
          >
            <Send className="w-4 h-4" />
            {t("casos.entregar")}
          </button>
        )}
        {entregando && !entregada && (
          <>
            <button
              type="button"
              onClick={() => accion(true)}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 bg-primary text-primary-foreground hover:opacity-90"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("casos.confirmarEntrega")}
            </button>
            <button
              type="button"
              onClick={() => { setEntregando(false); setNotaAlumno(""); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("casos.cancelar")}
            </button>
          </>
        )}
        {estado === "ENTREGADA" && (
          <button
            type="button"
            onClick={() => accion(false)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 border border-border hover:bg-muted"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Undo2 className="w-4 h-4" />}
            {t("casos.deshacerEntrega")}
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
