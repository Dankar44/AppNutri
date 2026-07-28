"use client";

import { useState } from "react";
import { formatQuantity } from "@/lib/units";
import { etiquetaPorciones } from "@/lib/receta-porciones";
import {
  Check,
  Clock,
  StickyNote,
  ChevronDown,
  Coffee,
  Apple,
  UtensilsCrossed,
  Cookie,
  Moon,
  Soup,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { ComidaSeguimiento } from "@/app/actions/seguimiento-paciente";
import { TIPO_HORAS, TIPO_LABELS } from "@/lib/seguimiento";

const TIPO_ICONOS: Record<string, LucideIcon> = {
  DESAYUNO: Coffee,
  MEDIA_MANANA: Apple,
  ALMUERZO: UtensilsCrossed,
  MERIENDA: Cookie,
  CENA: Moon,
  RECENA: Soup,
};

interface Props {
  comida: ComidaSeguimiento;
  onToggleAlimento: (alimentoIdx: number) => void;
  onChangeHora: (hora: string) => void;
  onChangeNotas: (notas: string) => void;
  embedded?: boolean;
}

export function ComidaCard({
  comida,
  onToggleAlimento,
  onChangeHora,
  onChangeNotas,
  embedded = false,
}: Props) {
  const t = useTranslations("patient-portal.seguimiento.comidaCard");
  const [detallesAbiertos, setDetallesAbiertos] = useState(
    Boolean(comida.horaReal || comida.notas)
  );
  const totales = comida.alimentos.length;
  const hechos = comida.alimentos.filter((a) => a.cumplido).length;
  const todosHechos = totales > 0 && hechos === totales;
  const pct = totales > 0 ? (hechos / totales) * 100 : 0;
  const [abierto, setAbierto] = useState(false);
  const Icono = TIPO_ICONOS[comida.tipo] ?? UtensilsCrossed;

  const shell = embedded
    ? "group transition-colors duration-300 overflow-hidden"
    : `group rounded-2xl border transition-all duration-300 overflow-hidden ${
        todosHechos
          ? "border-green-300 dark:border-green-500/40 bg-gradient-to-br from-green-50/70 to-green-50/30 dark:from-green-950/25 dark:to-green-950/10 shadow-sm"
          : "border-border bg-card hover:border-border/80"
      }`;

  return (
    <article className={shell}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        className="w-full flex items-center justify-between px-4 pt-4 pb-1 text-left group/trigger"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-transform group-hover/trigger:scale-105 group-active/trigger:scale-95 ${
              todosHechos
                ? "border-green-300 dark:border-green-500/40 text-green-700 dark:text-green-400"
                : "border-border text-foreground"
            }`}
            aria-hidden
          >
            <Icono className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">
              {TIPO_LABELS[comida.tipo] || comida.tipo}
            </h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {TIPO_HORAS[comida.tipo] || ""}
              {comida.horaReal && comida.horaReal !== TIPO_HORAS[comida.tipo] && (
                <span className="ml-1 text-muted-foreground/70">· real {comida.horaReal}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-semibold tabular-nums ${
              todosHechos ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            }`}
          >
            {hechos}/{totales}
          </span>
          {todosHechos && (
            <span
              aria-hidden
              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white animate-in zoom-in duration-300"
            >
              <Check className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${abierto ? "rotate-180" : ""} ${!abierto && hechos === 0 ? "animate-bounce" : ""}`}
            aria-hidden
          />
        </div>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${abierto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">

      <div className="px-4 mt-3">
        <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-out ${
              todosHechos
                ? "bg-gradient-to-r from-green-500 to-emerald-500"
                : "bg-gradient-to-r from-primary/60 to-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="px-2 py-2 space-y-0.5">
        {comida.alimentos.map((a, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onToggleAlimento(i)}
              className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition-colors ${
                a.cumplido
                  ? "bg-green-100/60 dark:bg-green-900/25 hover:bg-green-100 dark:hover:bg-green-900/40"
                  : "hover:bg-muted/60"
              }`}
              aria-pressed={a.cumplido}
            >
              <span
                className={`relative w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  a.cumplido
                    ? "bg-green-600 text-white scale-100"
                    : "border-2 border-border bg-card scale-95 group-hover:border-border"
                }`}
              >
                <Check
                  className={`w-3.5 h-3.5 transition-opacity duration-200 ${
                    a.cumplido ? "opacity-100" : "opacity-0"
                  }`}
                />
              </span>
              <span className="flex-1 min-w-0 flex items-baseline gap-1.5">
                <span
                  className={`text-sm truncate ${
                    a.cumplido ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {a.nombre}
                </span>
                {a.cantidad > 0 && (
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {a.esReceta
                      ? etiquetaPorciones(a.cantidad, { media: t("mediaRacion"), varias: (n) => t("raciones", { n }) })
                      : formatQuantity(a.cantidad, a.unidad || "GRAMOS")}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => setDetallesAbiertos((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors py-1"
          aria-expanded={detallesAbiertos}
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform ${detallesAbiertos ? "rotate-180" : ""}`}
          />
          {detallesAbiertos ? t("ocultarDetalles") : t("anadirHoraNotas")}
        </button>

        <div
          className={`grid transition-[grid-template-rows] duration-300 ${
            detallesAbiertos ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <label className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="time"
                  value={comida.horaReal || ""}
                  onChange={(e) => onChangeHora(e.target.value)}
                  className="bg-transparent border-none outline-none w-20 tabular-nums"
                  aria-label={t("horaRealLabel")}
                />
              </label>
              <label className="flex-1 flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-2.5 py-1.5 text-xs">
                <StickyNote className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={comida.notas || ""}
                  onChange={(e) => onChangeNotas(e.target.value)}
                  placeholder={t("notasPlaceholder")}
                  maxLength={500}
                  className="flex-1 bg-transparent border-none outline-none placeholder:text-muted-foreground/60"
                  aria-label={t("notasLabel")}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
        </div>
      </div>
    </article>
  );
}
