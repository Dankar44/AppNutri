"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, FileText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { entregarCaso } from "@/app/actions/aula";
import type { PDFSectionOptions, DisplayOverrides } from "@/lib/pdf/generate-plan-pdf";
import { cn } from "@/lib/utils";

/**
 * #40 — El cuadro de entregar un caso: la nota para el profesor y el entregable en PDF.
 *
 * La entrega es una foto fija con su PDF (Guillermo, 2 sep 2026: "lo importante es el entregable
 * final"). Está en tres sitios y es el mismo cuadro en los tres: el aula, el aviso de encima de la
 * ficha y la pestaña Entregables — desde esta última, el PDF va con las secciones que el alumno
 * tenga puestas ahí (`opcionesPdf`); desde las otras dos, con las de siempre.
 */
export function EntregarCaso({
  asignacionId,
  planes,
  reentrega = false,
  opcionesPdf,
  etiqueta,
  onHecho,
}: {
  asignacionId: string;
  planes: { id: string; nombre: string; activo: boolean }[];
  /** Ya estaba entregado: el botón es «Volver a entregar» y sustituye la foto anterior. */
  reentrega?: boolean;
  /** Desde la pestaña Entregables: el plan y las opciones que tiene puestas ahí. */
  opcionesPdf?: { planId: string | null; sections: PDFSectionOptions; displayOverrides: DisplayOverrides };
  etiqueta?: string;
  onHecho?: () => void;
}) {
  const t = useTranslations("aula");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [abierto, setAbierto] = useState(false);
  const [notaAlumno, setNotaAlumno] = useState("");
  const planPorDefecto = opcionesPdf?.planId ?? planes.find((p) => p.activo)?.id ?? planes[0]?.id ?? "";
  const [planId, setPlanId] = useState(planPorDefecto);
  const [adjuntar, setAdjuntar] = useState(planes.length > 0);
  const conPdf = adjuntar && planes.length > 0 && !!planId;

  function entregar() {
    startTransition(async () => {
      const result = await entregarCaso(asignacionId, {
        notaAlumno,
        entregable: conPdf
          ? { planId, sections: opcionesPdf?.sections, displayOverrides: opcionesPdf?.displayOverrides }
          : null,
      });
      if (result.ok) {
        toast.success(t("casos.entregado"));
        setAbierto(false);
        setNotaAlumno("");
        router.refresh();
        onHecho?.();
      } else {
        toast.error(result.error || t("casos.errorAbrir"));
      }
    });
  }

  const boton = "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50";

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={cn(boton, reentrega ? "border border-border hover:bg-muted" : "bg-primary text-primary-foreground hover:opacity-90")}
      >
        {reentrega ? <RefreshCw className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        {etiqueta ?? (reentrega ? t("casos.volverAEntregar") : t("casos.entregar"))}
      </button>
    );
  }

  const planElegido = planes.find((p) => p.id === planId);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); entregar(); }}
      className="w-full space-y-3 border-t border-border pt-3"
    >
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("casos.notaAlumno")}</label>
        <textarea
          value={notaAlumno}
          onChange={(e) => setNotaAlumno(e.target.value)}
          rows={3}
          maxLength={4000}
          autoFocus
          placeholder={t("casos.notaAlumnoPlaceholder")}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
        />
      </div>

      {/* El entregable en PDF */}
      <div className="py-3 lg:p-3 lg:rounded-lg lg:bg-muted/40 border-t border-border lg:border-t-0 space-y-2">
        {planes.length === 0 ? (
          <p className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
            <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {t("casos.sinPlanParaPdf")}
          </p>
        ) : (
          <>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={adjuntar}
                onChange={(e) => setAdjuntar(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <span className="font-medium inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" />
                {t("casos.adjuntarPdf")}
              </span>
            </label>
            {adjuntar && (
              opcionesPdf ? (
                <p className="text-xs text-muted-foreground">
                  {t("casos.pdfConOpcionesDeAqui", { plan: planElegido?.nombre ?? "" })}
                </p>
              ) : (
                <div>
                  {planes.length > 1 && (
                    <select
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                      aria-label={t("casos.quePlan")}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {planes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}{p.activo ? ` · ${t("casos.planActual")}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {planes.length === 1 && <>{t("casos.pdfDe", { plan: planes[0].nombre })} </>}
                    {t("casos.pdfSeccionesDeSiempre")}
                  </p>
                </div>
              )
            )}
          </>
        )}
        {reentrega && <p className="text-xs text-muted-foreground">{t("casos.reentregaSustituye")}</p>}
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className={cn(boton, "bg-primary text-primary-foreground hover:opacity-90")}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {isPending && conPdf ? t("casos.generandoPdf") : t("casos.confirmarEntrega")}
        </button>
        <button
          type="button"
          onClick={() => { setAbierto(false); setNotaAlumno(""); }}
          disabled={isPending}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("casos.cancelar")}
        </button>
      </div>
    </form>
  );
}
