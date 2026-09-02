"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Plus, X, Loader2, Users, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { asignarCasoAClase, retirarAsignacion, type AsignacionResumen } from "@/app/actions/casos";
import { ConfirmModal } from "@/components/confirm-modal";

/**
 * #40 — A qué clases está puesto el caso y cómo va cada una.
 *
 * Retirar una asignación no borra lo entregado: deja de salirle al alumno como pendiente y ya.
 */
export function Asignaciones({
  casoId,
  asignaciones,
  clases,
  /** Fechas ya formateadas en el servidor: el cliente no traduce fechas. */
  fechas,
}: {
  casoId: string;
  asignaciones: AsignacionResumen[];
  clases: { id: string; nombre: string; curso: string | null }[];
  fechas: Record<string, string>;
}) {
  const t = useTranslations("casos");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [asignando, setAsignando] = useState(false);
  const [claseId, setClaseId] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [retirando, setRetirando] = useState<AsignacionResumen | null>(null);

  function asignar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await asignarCasoAClase(casoId, claseId, fechaLimite || undefined);
      if (result.ok) {
        toast.success(t("asignar.asignado"));
        setAsignando(false);
        setClaseId("");
        setFechaLimite("");
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  function retirar() {
    if (!retirando) return;
    startTransition(async () => {
      const result = await retirarAsignacion(retirando.id);
      if (result.ok) {
        toast.success(t("asignar.retirado"));
        setRetirando(null);
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <section className="py-4 lg:p-5 lg:border lg:border-border lg:rounded-xl lg:bg-card">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold">{t("asignar.titulo", { n: asignaciones.length })}</h2>
        {clases.length > 0 && !asignando && (
          <button
            type="button"
            onClick={() => setAsignando(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Plus className="w-4 h-4" />
            {t("asignar.anadir")}
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">{t("asignar.explicacion")}</p>

      {asignaciones.length > 0 && (
        <div className="mt-3 divide-y divide-border">
          {asignaciones.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-3">
              <Link href={`/profesor/casos/${casoId}/entregas/${a.id}`} className="min-w-0 flex-1 group">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {a.claseNombre}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {t("asignar.progreso", { entregadas: a.entregadas + a.corregidas, alumnos: a.alumnos })}
                  </span>
                  {a.corregidas > 0 && <> · {t("asignar.corregidas", { n: a.corregidas })}</>}
                  {" · "}
                  {a.fechaLimite ? fechas[a.id] : t("asignar.sinFechaLimite")}
                </p>
              </Link>
              <Link
                href={`/profesor/casos/${casoId}/entregas/${a.id}`}
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 shrink-0"
              >
                {t("entregas.verEntregas")}
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => setRetirando(a)}
                aria-label={t("asignar.retirar")}
                title={t("asignar.retirar")}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {asignando && (
        <form onSubmit={asignar} className="mt-3 space-y-3 border-t border-border pt-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("asignar.elige")}</label>
            <select value={claseId} onChange={(e) => setClaseId(e.target.value)} required className={input}>
              <option value="">—</option>
              {clases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}{c.curso ? ` · ${c.curso}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("asignar.fechaLimite")}</label>
            <input type="date" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} className={input} />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending || !claseId}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
              {t("asignar.asignar")}
            </button>
            <button
              type="button"
              onClick={() => setAsignando(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t("asignar.cancelar")}
            </button>
          </div>
        </form>
      )}

      {clases.length === 0 && asignaciones.length === 0 && (
        <p className="text-sm text-muted-foreground mt-3">
          {t("asignar.sinClases")}{" "}
          <Link href="/profesor/clases" className="text-primary hover:underline">
            {t("asignar.irAClases")}
          </Link>
        </p>
      )}
      {clases.length === 0 && asignaciones.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">{t("asignar.todasAsignadas")}</p>
      )}

      <ConfirmModal
        open={retirando !== null}
        title={t("asignar.retirar")}
        description={t("asignar.retirarTexto")}
        confirmLabel={t("asignar.retirar")}
        loading={isPending}
        onConfirm={retirar}
        onCancel={() => setRetirando(null)}
      />
    </section>
  );
}
