"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { corregirEntrega, deshacerCorreccion } from "@/app/actions/casos";

/**
 * #40 — La corrección: nota de 0 a 10 con decimales, comentario, y si el alumno lo ve ya.
 *
 * El interruptor existe porque un profesor suele corregir toda la clase y publicarlas juntas
 * (acordado el 27 ago 2026).
 */
export function Corregir({
  entregaId,
  nota,
  comentario,
  visibleParaAlumno,
  yaCorregida,
  puedeCorregirse,
}: {
  entregaId: string;
  nota: number | null;
  comentario: string | null;
  visibleParaAlumno: boolean;
  yaCorregida: boolean;
  /** Solo se corrige lo entregado: si no, el alumno se queda encerrado sin poder entregar. */
  puedeCorregirse: boolean;
}) {
  const t = useTranslations("casos");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // La nota va como texto: si no, borrar el campo o escribir "8," se pelea con el estado.
  const [texto, setTexto] = useState(nota !== null ? String(nota) : "");
  const [nota_, setNota] = useState(comentario ?? "");
  const [visible, setVisible] = useState(visibleParaAlumno);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const valor = texto.trim() === "" ? null : Number(texto.replace(",", "."));
    if (valor !== null && (Number.isNaN(valor) || valor < 0 || valor > 10)) {
      toast.error(t("entregas.notaFuera"));
      return;
    }
    startTransition(async () => {
      const result = await corregirEntrega(entregaId, {
        nota: valor,
        comentario: nota_,
        visibleParaAlumno: visible,
      });
      if (result.ok) {
        toast.success(t("entregas.corregida"));
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  function deshacer() {
    startTransition(async () => {
      const result = await deshacerCorreccion(entregaId);
      if (result.ok) {
        toast.success(t("entregas.deshecha"));
        setTexto("");
        setNota("");
        setVisible(false);
        router.refresh();
      } else {
        toast.error(result.error || t("errorGuardar"));
      }
    });
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <form onSubmit={guardar} className="py-4 lg:px-6 lg:py-6 lg:border lg:border-border lg:rounded-xl lg:bg-card space-y-4">
      <h2 className="font-semibold">{t("entregas.corregir")}</h2>

      <div className="sm:max-w-[10rem]">
        <label className="text-xs font-medium text-muted-foreground">{t("entregas.nota")}</label>
        <input
          type="text"
          inputMode="decimal"
          value={texto}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="8,5"
          className={`${input} tabular-nums`}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("entregas.comentario")}</label>
        <textarea
          value={nota_}
          onChange={(e) => setNota(e.target.value)}
          rows={4}
          className={`${input} resize-y`}
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={visible}
          onChange={(e) => setVisible(e.target.checked)}
          className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary/30"
        />
        <span>
          <span className="text-sm font-medium">{t("entregas.verLaNota")}</span>
          <span className="block text-xs text-muted-foreground">{t("entregas.verLaNotaAyuda")}</span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !puedeCorregirse}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
          {t("entregas.guardarCorreccion")}
        </button>
        {yaCorregida && (
          <button
            type="button"
            onClick={deshacer}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <Undo2 className="w-4 h-4" />
            {t("entregas.deshacer")}
          </button>
        )}
      </div>
    </form>
  );
}
