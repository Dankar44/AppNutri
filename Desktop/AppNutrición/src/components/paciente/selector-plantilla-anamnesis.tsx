"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  asignarPlantillaPaciente,
  eliminarPlantillaAnamnesis,
  type PlantillaResumen,
} from "@/app/actions/plantillas-anamnesis";

export function SelectorPlantillaAnamnesis({
  pacienteId,
  plantillas,
  valorActual,
  tieneEstructuraPropia,
  onCrearNueva,
  onEditar,
}: {
  pacienteId: string;
  plantillas: PlantillaResumen[];
  valorActual: string | null;
  tieneEstructuraPropia: boolean;
  onCrearNueva: () => void;
  onEditar: () => void;
}) {
  const t = useTranslations("patients.preconsulta");
  const tv = useTranslations("validation");
  const router = useRouter();
  const [valor, setValor] = useState(valorActual ?? "");
  const [abierto, setAbierto] = useState(false);
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [pending, startTransition] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);
  const plantillaActual = plantillas.find((p) => p.id === valor) ?? null;
  const tienePlantillaReutilizable = !tieneEstructuraPropia && Boolean(plantillaActual);

  useEffect(() => {
    setValor(valorActual ?? "");
  }, [valorActual]);

  useEffect(() => {
    if (!abierto) return;

    function onDocMouseDown(e: MouseEvent) {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (wrapRef.current && !wrapRef.current.contains(target)) setAbierto(false);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [abierto]);

  function seleccionar(nuevo: string) {
    setAbierto(false);
    if ((nuevo === valor && !tieneEstructuraPropia) || pending) return;

    const anterior = valor;
    setValor(nuevo);
    startTransition(async () => {
      try {
        const res = await asignarPlantillaPaciente(pacienteId, nuevo || null);
        if (res.ok) {
          toast.success(t("plantillaAplicada"));
          router.refresh();
        } else {
          setValor(anterior);
          toast.error(res.error || tv("general.errorDesconocido"));
        }
      } catch {
        setValor(anterior);
        toast.error(tv("general.errorDesconocido"));
      }
    });
  }

  async function eliminarSeleccionada() {
    if (!plantillaActual || eliminando) return;
    setEliminando(true);
    try {
      const res = await eliminarPlantillaAnamnesis(plantillaActual.id, pacienteId);
      if (res.ok) {
        setConfirmandoEliminacion(false);
        setValor("");
        toast.success(t("plantillaEliminada"));
        router.refresh();
      } else {
        toast.error(res.error || tv("general.errorDesconocido"));
      }
    } catch {
      toast.error(tv("general.errorDesconocido"));
    } finally {
      setEliminando(false);
    }
  }

  const nombreActual = tieneEstructuraPropia
    ? t("plantillaPersonalizada")
    : plantillaActual?.nombre ?? t("plantillaGenerica");
  const etiquetaEditar = tieneEstructuraPropia
    ? t("editarPersonal")
    : plantillaActual
      ? t("editarPlantilla")
      : t("personalizarPaciente");

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
        <div ref={wrapRef} className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setAbierto((v) => !v)}
            disabled={pending}
            aria-label={t("plantillaLabel")}
            aria-haspopup="listbox"
            aria-expanded={abierto}
            className="w-full min-h-11 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors disabled:opacity-50"
          >
            <Layers className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="flex-1 min-w-0 text-left text-sm font-semibold truncate">{nombreActual}</span>
            {pending ? (
              <Loader2 className="w-4 h-4 shrink-0 text-muted-foreground animate-spin" aria-hidden="true" />
            ) : (
              <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${abierto ? "rotate-180" : ""}`} aria-hidden="true" />
            )}
          </button>

          {abierto && (
            <div
              role="listbox"
              aria-label={t("gestionarPlantillas")}
              className="absolute left-0 right-0 mt-1 z-40 bg-card border border-border rounded-lg shadow-lg overflow-y-auto max-h-80"
            >
              <div className="px-3 py-1.5 border-b border-border text-[11px] uppercase tracking-wide text-muted-foreground">
                {t("plantillaLabel")}
              </div>

              <button
                type="button"
                role="option"
                aria-selected={!tieneEstructuraPropia && valor === ""}
                onClick={() => seleccionar("")}
                className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-muted/60 transition-colors ${!tieneEstructuraPropia && valor === "" ? "bg-primary/5" : ""}`}
              >
                <span className="text-sm font-medium">{t("plantillaGenerica")}</span>
                {!tieneEstructuraPropia && valor === "" && <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />}
              </button>

              {plantillas.map((p) => {
                const seleccionada = !tieneEstructuraPropia && p.id === valor;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={seleccionada}
                    onClick={() => seleccionar(p.id)}
                    className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-muted/60 transition-colors ${seleccionada ? "bg-primary/5" : ""}`}
                  >
                    <span className="truncate text-sm font-medium">{p.nombre}</span>
                    {seleccionada && <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={() => { setAbierto(false); onCrearNueva(); }}
            disabled={pending}
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-11 rounded-lg text-sm font-medium transition-colors border border-primary/30 text-primary hover:bg-primary/5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{t("crearPlantillaBoton")}</span>
          </button>
          <button
            type="button"
            onClick={onEditar}
            disabled={pending}
            className="inline-flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3.5 py-2.5 min-h-11 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
            <span>{etiquetaEditar}</span>
          </button>
          {tienePlantillaReutilizable && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setConfirmandoEliminacion(true)}
                aria-label={t("eliminarPlantilla")}
                title={t("eliminarPlantilla")}
                className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Trash2 className="w-5 h-5 text-destructive" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-medium ${tieneEstructuraPropia ? "bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-primary/10 text-primary"}`}>
          {tieneEstructuraPropia ? t("plantillaPersonalizada") : tienePlantillaReutilizable ? t("plantillaReutilizable") : t("plantillaGenerica")}
        </span>
      </div>

      {confirmandoEliminacion && plantillaActual && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
          onClick={() => !eliminando && setConfirmandoEliminacion(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="eliminar-plantilla-titulo"
            className="bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl w-full sm:max-w-md p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" />
                </div>
                <h3 id="eliminar-plantilla-titulo" className="text-base sm:text-lg font-semibold">{t("eliminarPlantillaConfirmacion", { nombre: plantillaActual.nombre })}</h3>
              </div>
              <button
                type="button"
                onClick={() => !eliminando && setConfirmandoEliminacion(false)}
                aria-label={t("cancelar")}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-5">{t("eliminarPlantillaAviso")}</p>
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmandoEliminacion(false)}
                disabled={eliminando}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                {t("cancelar")}
              </button>
              <button
                type="button"
                onClick={eliminarSeleccionada}
                disabled={eliminando}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {eliminando && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {t("confirmarEliminacion")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
