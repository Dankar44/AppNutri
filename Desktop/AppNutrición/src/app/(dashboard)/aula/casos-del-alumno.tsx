"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList, Loader2, CalendarClock, CheckCircle2, Send, Undo2, User, AlertTriangle, Star,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { abrirCaso, entregarCaso, deshacerEntrega } from "@/app/actions/aula";

export interface CasoParaAlumno {
  asignacionId: string;
  casoNombre: string;
  consigna: string | null;
  pacienteDelCaso: string;
  claseNombre: string;
  estado: "SIN_EMPEZAR" | "EN_MARCHA" | "ENTREGADA" | "CORREGIDA";
  pacienteId: string | null;
  nota: number | null;
  comentario: string | null;
  /** Ya formateado en el servidor. */
  fechaLimite: string | null;
  /** Se pasó la fecha y no lo ha entregado. */
  fueraDePlazo: boolean;
  diasQueQuedan: number | null;
}

/**
 * #40 — Los casos del alumno en su aula.
 *
 * Abrir el caso le crea SU paciente y le lleva a su ficha: a partir de ahí trabaja con las
 * pantallas de siempre, que es lo que tiene que aprender a usar.
 */
export function CasosDelAlumno({ casos }: { casos: CasoParaAlumno[] }) {
  const t = useTranslations("aula");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [trabajando, setTrabajando] = useState<string | null>(null);

  function abrir(asignacionId: string, pacienteId: string | null) {
    if (pacienteId) {
      // Con la marca del espacio: sin ella el menú cambia al de nutricionista y desaparece el
      // aula, que es el único sitio desde donde se entrega (auditoría 2 sep 2026).
      router.push(`/pacientes/${pacienteId}?espacio=aula`);
      return;
    }
    setTrabajando(asignacionId);
    startTransition(async () => {
      const result = await abrirCaso(asignacionId);
      setTrabajando(null);
      if (result.ok && result.pacienteId) {
        router.push(`/pacientes/${result.pacienteId}?espacio=aula`);
      } else {
        toast.error(result.error || t("casos.errorAbrir"));
      }
    });
  }

  function entregar(asignacionId: string) {
    setTrabajando(asignacionId);
    startTransition(async () => {
      const result = await entregarCaso(asignacionId);
      setTrabajando(null);
      if (result.ok) {
        toast.success(t("casos.entregado"));
        router.refresh();
      } else {
        toast.error(result.error || t("casos.errorAbrir"));
      }
    });
  }

  function deshacer(asignacionId: string) {
    setTrabajando(asignacionId);
    startTransition(async () => {
      const result = await deshacerEntrega(asignacionId);
      setTrabajando(null);
      if (result.ok) {
        toast.success(t("casos.entregaDeshecha"));
        router.refresh();
      } else {
        toast.error(result.error || t("casos.errorAbrir"));
      }
    });
  }

  if (casos.length === 0) return null;

  const boton =
    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50";

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">{t("casos.titulo", { n: casos.length })}</h2>
        {/* Que sepa desde el principio que su paciente es inventado y que se trabaja igual. */}
        <p className="text-sm text-muted-foreground mt-0.5">{t("casos.explicacionPrimeraVez")}</p>
      </div>

      <div className="divide-y divide-border lg:divide-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
        {casos.map((c) => {
          const ocupado = isPending && trabajando === c.asignacionId;
          return (
            <div
              key={c.asignacionId}
              className="py-4 lg:py-0 lg:p-5 lg:border lg:border-border lg:rounded-2xl lg:bg-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold leading-tight">{c.casoNombre}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {c.pacienteDelCaso} · {c.claseNombre}
                  </p>
                </div>
                {c.estado === "CORREGIDA" && c.nota !== null && (
                  <span className="inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary shrink-0 tabular-nums">
                    <Star className="w-3.5 h-3.5" />
                    {c.nota}
                  </span>
                )}
              </div>

              {c.consigna && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3 whitespace-pre-wrap">{c.consigna}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs">
                {c.fechaLimite && (
                  <span
                    className={`inline-flex items-center gap-1 ${
                      c.fueraDePlazo
                        ? "text-red-600 dark:text-red-400 font-medium"
                        : c.diasQueQuedan !== null && c.diasQueQuedan <= 3
                          ? "text-amber-600 dark:text-amber-400 font-medium"
                          : "text-muted-foreground"
                    }`}
                  >
                    {c.fueraDePlazo ? <AlertTriangle className="w-3.5 h-3.5" /> : <CalendarClock className="w-3.5 h-3.5" />}
                    {c.fueraDePlazo ? t("casos.sePasoLaFecha", { fecha: c.fechaLimite }) : t("casos.entregaAntes", { fecha: c.fechaLimite })}
                  </span>
                )}
                {(c.estado === "ENTREGADA" || c.estado === "CORREGIDA") && (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {/* Mientras el profesor no publique la nota, para el alumno sigue "entregada":
                        decirle "corregida" y no enseñarle nada es peor que no decir nada. */}
                    {t(c.estado === "CORREGIDA" && c.nota === null && !c.comentario
                      ? "casos.estado.ENTREGADA"
                      : `casos.estado.${c.estado}`)}
                  </span>
                )}
              </div>

              {c.comentario && (
                <div className="mt-3 py-3 lg:p-3 lg:rounded-lg lg:bg-muted/60 border-t border-border lg:border-t-0">
                  <p className="text-xs font-medium text-muted-foreground">{t("casos.comentarioDelProfesor")}</p>
                  <p className="text-sm mt-0.5 whitespace-pre-wrap">{c.comentario}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => abrir(c.asignacionId, c.pacienteId)}
                  disabled={ocupado}
                  className={`${boton} bg-primary text-primary-foreground hover:opacity-90`}
                >
                  {ocupado ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
                  {c.estado === "SIN_EMPEZAR" ? t("casos.empezar") : t("casos.abrir")}
                </button>

                {c.estado === "EN_MARCHA" && (
                  <button
                    type="button"
                    onClick={() => entregar(c.asignacionId)}
                    disabled={ocupado}
                    className={`${boton} border border-border hover:bg-muted`}
                  >
                    <Send className="w-4 h-4" />
                    {t("casos.entregar")}
                  </button>
                )}

                {c.estado === "ENTREGADA" && (
                  <button
                    type="button"
                    onClick={() => deshacer(c.asignacionId)}
                    disabled={ocupado}
                    className={`${boton} border border-border hover:bg-muted`}
                  >
                    <Undo2 className="w-4 h-4" />
                    {t("casos.deshacerEntrega")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
