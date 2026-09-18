"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Calendar, ExternalLink, Link2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { ocultarAvisoCopiaGoogle } from "./google-calendar-cliente";

interface Props {
  urlGoogle: string;
  onClose: () => void;
}

export function AvisoCopiaGoogleModal({ urlGoogle, onClose }: Props) {
  const t = useTranslations("agenda.avisoCopiaGoogle");
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [noMostrarDeNuevo, setNoMostrarDeNuevo] = useState(false);

  useEffect(() => {
    tituloRef.current?.focus();

    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") onClose();
    }
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [onClose]);

  function confirmarCopiaManual() {
    if (noMostrarDeNuevo) {
      ocultarAvisoCopiaGoogle();
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="aviso-copia-google-titulo"
        aria-describedby="aviso-copia-google-descripcion"
        className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Google Calendar</p>
              <h2
                id="aviso-copia-google-titulo"
                ref={tituloRef}
                tabIndex={-1}
                className="text-lg font-semibold mt-0.5 outline-none"
              >
                {t("titulo")}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("cerrar")}
            className="w-11 h-11 -mr-2 -mt-2 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p
            id="aviso-copia-google-descripcion"
            className="text-sm text-muted-foreground leading-relaxed"
          >
            {t("descripcion")}
          </p>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Link2 className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t("sincronizacionTitulo")}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {t("sincronizacionDescripcion")}
                </p>
                <Link
                  href="/ajustes#integraciones"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 min-h-11 text-sm font-medium text-primary hover:underline"
                >
                  {t("configurarSincronizacion")}
                </Link>
              </div>
            </div>
          </div>

          <label className="min-h-11 flex items-center gap-3 rounded-lg px-1 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={noMostrarDeNuevo}
              onChange={(evento) => setNoMostrarDeNuevo(evento.target.checked)}
              className="w-4 h-4 rounded border-border accent-primary shrink-0"
            />
            <span>{t("noMostrarDeNuevo")}</span>
          </label>
        </div>

        <div className="p-5 pt-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            {t("cancelar")}
          </button>
          <a
            href={urlGoogle}
            target="_blank"
            rel="noopener noreferrer"
            onClick={confirmarCopiaManual}
            className="min-h-11 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center justify-center gap-2"
          >
            {t("crearCopiaManual")}
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}
