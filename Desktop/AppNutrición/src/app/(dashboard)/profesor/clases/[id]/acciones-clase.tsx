"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Archive, ArchiveRestore, Loader2, X, CalendarOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { editarClase, archivarClase, cerrarCursoDeClase, eliminarClase } from "@/app/actions/clases";
import { ConfirmModal } from "@/components/confirm-modal";
import { DatePicker } from "@/components/date-picker";

interface ClaseEditable {
  id: string;
  nombre: string;
  /** YYYY-MM-DD, o null. */
  fechaInicioCurso: string | null;
  /** Ya en YYYY-MM-DD, listo para el campo de fecha. */
  fechaFinCurso: string | null;
  archivada: boolean;
  alumnosActivos: number;
}

export function AccionesClase({ clase }: { clase: ClaseEditable }) {
  const t = useTranslations("docencia");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [cerrandoCurso, setCerrandoCurso] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [nombre, setNombre] = useState(clase.nombre);
  const [fechaInicio, setFechaInicio] = useState(clase.fechaInicioCurso ?? "");
  const [fechaFin, setFechaFin] = useState(clase.fechaFinCurso ?? "");

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await editarClase(clase.id, { nombre, fechaInicioCurso: fechaInicio, fechaFinCurso: fechaFin });
      if (result.ok) {
        toast.success(t("clases.guardada"));
        setEditando(false);
        router.refresh();
      } else {
        toast.error(result.error || t("clases.errorGuardar"));
      }
    });
  }

  function cambiarArchivo() {
    startTransition(async () => {
      const result = await archivarClase(clase.id, !clase.archivada);
      if (result.ok) {
        toast.success(clase.archivada ? t("clases.desarchivada") : t("clases.archivadaHecho"));
        setConfirmando(false);
        router.refresh();
      } else {
        toast.error(result.error || t("clases.errorGuardar"));
      }
    });
  }

  function cerrarCurso() {
    startTransition(async () => {
      const result = await cerrarCursoDeClase(clase.id);
      if (result.ok) {
        toast.success(t("clases.cursoCerradoHecho", { n: result.alumnos ?? 0 }));
        setCerrandoCurso(false);
        router.refresh();
      } else {
        toast.error(result.error || t("clases.errorGuardar"));
      }
    });
  }

  function eliminar() {
    startTransition(async () => {
      const result = await eliminarClase(clase.id);
      if (result.ok) {
        toast.success(t("clases.eliminada"));
        router.push("/profesor/clases");
      } else {
        toast.error(result.error || t("clases.errorGuardar"));
        setEliminando(false);
      }
    });
  }

  const input =
    "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const boton =
    "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button type="button" onClick={() => setEditando(true)} className={boton}>
          <Pencil className="w-4 h-4" />
          {t("clases.editar")}
        </button>
        {!clase.archivada && clase.alumnosActivos > 0 && (
          <button type="button" onClick={() => setCerrandoCurso(true)} className={boton}>
            <CalendarOff className="w-4 h-4" />
            {t("clases.cerrarCurso")}
          </button>
        )}
        <button type="button" onClick={() => setConfirmando(true)} className={boton}>
          {clase.archivada ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          {clase.archivada ? t("clases.desarchivar") : t("clases.archivar")}
        </button>
        <button
          type="button"
          onClick={() => setEliminando(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-500/30 bg-card px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          {t("clases.eliminar")}
        </button>
      </div>

      <ConfirmModal
        open={eliminando}
        title={t("clases.eliminar")}
        description={t("clases.eliminarTexto", { n: clase.alumnosActivos })}
        confirmLabel={t("clases.eliminar")}
        destructive
        loading={isPending}
        onConfirm={eliminar}
        onCancel={() => setEliminando(false)}
      />

      {editando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => !isPending && setEditando(false)}
        >
          <form
            onSubmit={guardar}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{t("clases.editar")}</h2>
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                aria-label={t("clases.cerrar")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">{t("clases.nombre")}</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={120} className={input} />
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
            <p className="text-xs text-muted-foreground -mt-2">{t("clases.finCursoAyuda")}</p>

            <button
              type="submit"
              disabled={isPending || !nombre.trim()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("clases.guardar")}
            </button>
          </form>
        </div>
      )}

      <ConfirmModal
        open={cerrandoCurso}
        title={t("clases.cerrarCurso")}
        description={t("clases.cerrarCursoTexto", { n: clase.alumnosActivos })}
        confirmLabel={t("clases.cerrarCurso")}
        loading={isPending}
        onConfirm={cerrarCurso}
        onCancel={() => setCerrandoCurso(false)}
      />

      <ConfirmModal
        open={confirmando}
        title={clase.archivada ? t("clases.desarchivar") : t("clases.archivar")}
        // Que quede claro que archivar no borra nada: es la duda de cualquiera al pulsarlo.
        description={clase.archivada ? t("clases.desarchivarTexto") : t("clases.archivarTexto")}
        confirmLabel={clase.archivada ? t("clases.desarchivar") : t("clases.archivar")}
        loading={isPending}
        onConfirm={cambiarArchivo}
        onCancel={() => setConfirmando(false)}
      />
    </>
  );
}
