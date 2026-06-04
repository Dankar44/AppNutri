"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { X, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModoCopia } from "@/app/actions/planes";

export interface DiaOption {
  id: string;
  key: string;
  label: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Selector reutilizable: días destino (multi) + modo reemplazar/añadir.
// Controlado por el padre para poder reutilizarlo en el asistente de importar.
// ─────────────────────────────────────────────────────────────────────────
export function SelectorDiasModo({
  dias,
  excluirIds = [],
  seleccion,
  onSeleccionChange,
  modo,
  onModoChange,
  mostrarModo = true,
}: {
  dias: DiaOption[];
  excluirIds?: string[];
  seleccion: string[];
  onSeleccionChange: (ids: string[]) => void;
  modo: ModoCopia;
  onModoChange: (m: ModoCopia) => void;
  mostrarModo?: boolean;
}) {
  const t = useTranslations("diets");
  const seleccionables = dias.filter((d) => !excluirIds.includes(d.id));
  const todosSeleccionados =
    seleccionables.length > 0 && seleccionables.every((d) => seleccion.includes(d.id));

  function toggle(id: string) {
    onSeleccionChange(
      seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id],
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">{t("copiar.aQueDias")}</span>
          <button
            type="button"
            onClick={() =>
              onSeleccionChange(todosSeleccionados ? [] : seleccionables.map((d) => d.id))
            }
            className="text-xs font-medium text-primary hover:underline"
          >
            {todosSeleccionados ? t("copiar.ninguno") : t("copiar.todos")}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {dias.map((d) => {
            const excluido = excluirIds.includes(d.id);
            const activo = seleccion.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                disabled={excluido}
                onClick={() => toggle(d.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left",
                  excluido
                    ? "border-border/40 bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
                    : activo
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted text-foreground",
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                    activo ? "bg-primary border-primary text-primary-foreground" : "border-border",
                  )}
                >
                  {activo && <Check className="w-3 h-3" />}
                </span>
                <span className="truncate">{d.label}</span>
                {excluido && (
                  <span className="ml-auto text-[10px] italic">{t("copiar.origen")}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {mostrarModo && (
      <div>
        <span className="text-sm font-semibold text-foreground block mb-2">{t("copiar.modo")}</span>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { id: "reemplazar" as const, label: t("copiar.reemplazar"), desc: t("copiar.reemplazarDesc") },
            { id: "anadir" as const, label: t("copiar.anadir"), desc: t("copiar.anadirDesc") },
          ]).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onModoChange(m.id)}
              className={cn(
                "px-3 py-2 rounded-lg border text-left transition-colors",
                modo === m.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium block",
                  modo === m.id ? "text-primary" : "text-foreground",
                )}
              >
                {m.label}
              </span>
              <span className="text-[11px] text-muted-foreground leading-tight block mt-0.5">
                {m.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Modal intra-plan: copiar una comida o un día a otros días del mismo plan.
// ─────────────────────────────────────────────────────────────────────────
export function CopiarADiasModal({
  open,
  onClose,
  titulo,
  subtitulo,
  dias,
  excluirDiaId,
  pending = false,
  mostrarModo = true,
  tiposComida,
  tipoOrigen,
  tipoDestinoInicial,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  titulo: string;
  subtitulo?: string;
  dias: DiaOption[];
  excluirDiaId?: string;
  pending?: boolean;
  mostrarModo?: boolean;
  /** Si se pasa, muestra un selector de "en qué comida pegarla" (tipos de comida). */
  tiposComida?: { key: string; label: string }[];
  tipoOrigen?: string;
  tipoDestinoInicial?: string;
  onConfirm: (diaDestinoIds: string[], modo: ModoCopia, tipoDestino?: string) => void;
}) {
  const t = useTranslations("diets");
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [modo, setModo] = useState<ModoCopia>("reemplazar");
  const [tipoDestino, setTipoDestino] = useState<string | undefined>(tipoDestinoInicial);

  useEffect(() => {
    if (open) {
      setSeleccion([]);
      setModo("reemplazar");
      setTipoDestino(tipoDestinoInicial);
    }
  }, [open, tipoDestinoInicial]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="bg-card rounded-t-xl sm:rounded-xl border border-border shadow-xl w-full sm:max-w-md max-h-[90dvh] sm:max-h-[80vh] flex flex-col pb-safe sm:pb-0">
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{titulo}</h3>
            {subtitulo && <p className="text-xs text-muted-foreground mt-0.5">{subtitulo}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label={t("copiar.cancelar")}
            className="p-2 hover:bg-muted rounded transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tiposComida && tiposComida.length > 0 && (
            <div>
              <span className="text-sm font-semibold text-foreground block mb-2">
                {t("copiar.enQueComida")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {tiposComida.map((tc) => (
                  <button
                    key={tc.key}
                    type="button"
                    onClick={() => setTipoDestino(tc.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                      tipoDestino === tc.key
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:bg-muted text-foreground",
                    )}
                  >
                    {tc.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <SelectorDiasModo
            dias={dias}
            excluirIds={
              excluirDiaId && (!tiposComida || tipoDestino === tipoOrigen) ? [excluirDiaId] : []
            }
            seleccion={seleccion}
            onSeleccionChange={setSeleccion}
            modo={modo}
            onModoChange={setModo}
            mostrarModo={mostrarModo}
          />
        </div>

        <div className="flex gap-2 p-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            {t("copiar.cancelar")}
          </button>
          <button
            type="button"
            disabled={seleccion.length === 0 || pending}
            onClick={() => onConfirm(seleccion, modo, tipoDestino)}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Copy className="w-4 h-4" />
            {pending ? t("copiar.copiando") : t("copiar.copiar")}
          </button>
        </div>
      </div>
    </div>
  );
}
