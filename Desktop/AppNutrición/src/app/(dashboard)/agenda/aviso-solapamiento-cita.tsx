"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ConflictoCita } from "@/app/actions/citas";
import { intlTag, type Locale } from "@/i18n/config";
import { toMadridTimeStr } from "@/lib/tz";

interface Props {
  conflicto: ConflictoCita;
  guardando: boolean;
  onRevisar: () => void;
  onConfirmar: () => void;
}

export function AvisoSolapamientoCita({
  conflicto,
  guardando,
  onRevisar,
  onConfirmar,
}: Props) {
  const t = useTranslations("agenda.avisoSolapamiento");
  const tag = intlTag(useLocale() as Locale);
  const avisoRef = useRef<HTMLDivElement>(null);
  const inicio = new Date(conflicto.fechaHora);
  const fin = new Date(inicio.getTime() + conflicto.duracion * 60 * 1000);

  useEffect(() => {
    avisoRef.current?.focus();
  }, []);

  return (
    <div
      ref={avisoRef}
      role="alert"
      tabIndex={-1}
      className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 outline-none focus:ring-2 focus:ring-amber-500/60 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("titulo")}</p>
          <p className="text-sm mt-1 leading-relaxed">
            {t("descripcion", {
              paciente: conflicto.pacienteNombre,
              fecha: inicio.toLocaleDateString(tag, {
                timeZone: "Europe/Madrid",
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
              inicio: toMadridTimeStr(inicio),
              fin: toMadridTimeStr(fin),
            })}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mt-3">
            <button
              type="button"
              onClick={onRevisar}
              disabled={guardando}
              className="min-h-11 px-4 py-2.5 rounded-lg bg-amber-700 text-white text-sm font-medium hover:bg-amber-800 disabled:opacity-60 transition-colors"
            >
              {t("revisar")}
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={guardando}
              className="min-h-11 px-4 py-2.5 rounded-lg border border-amber-400/70 text-sm font-medium hover:bg-amber-100 disabled:opacity-60 transition-colors dark:hover:bg-amber-900/50"
            >
              {guardando ? t("guardando") : t("guardarIgualmente")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
