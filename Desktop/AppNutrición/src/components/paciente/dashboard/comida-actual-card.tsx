"use client";

import Link from "next/link";
import { ArrowRight, Clock, UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";
import { TIPO_LABELS, TIPO_HORAS } from "@/lib/seguimiento";
import { formatQuantity } from "@/lib/units";
import { etiquetaPorciones } from "@/lib/receta-porciones";

interface Alimento {
  nombre: string;
  cantidad: number;
  unidad?: string;
  /** Las recetas se guardan con unidad GRAMOS pero su cantidad son porciones. */
  esReceta?: boolean;
}

interface Props {
  tipoActual: string | null;
  alimentos: Alimento[];
  ahoraHHMM: string;
  hayPlan: boolean;
  className?: string;
}

export function ComidaActualCard({
  tipoActual,
  alimentos,
  ahoraHHMM,
  hayPlan,
  className = "",
}: Props) {
  const t = useTranslations("patient-portal.dashboard.comidaActualCard");
  const shell = `rounded-2xl border border-border bg-card w-full flex flex-col ${className}`;

  if (!hayPlan) {
    return (
      <section className={`${shell} p-5`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground">
            <UtensilsCrossed className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-base font-semibold">{t("tuPlan")}</h2>
            <p className="text-[11px] text-muted-foreground">
              {t("sinPlanAsignado")}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          {t("sinPlanDesc")}
        </p>
      </section>
    );
  }

  if (!tipoActual) {
    return (
      <section className={`${shell} p-5`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground">
            <UtensilsCrossed className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-base font-semibold">{t("sinComidaAhora")}</h2>
            <p className="text-[11px] text-muted-foreground">{t("sonLas", { hora: ahoraHHMM })}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4 flex-1">
          {t("entreComidas")}
        </p>
        <Link
          href="/paciente/portal/dieta"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          {t("verDietaCompleta")}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>
    );
  }

  return (
    <section className={`${shell} overflow-hidden`}>
      <header className="flex items-center justify-between gap-3 p-5 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground shrink-0">
            <UtensilsCrossed className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              {t("teToca")}
            </p>
            <h2 className="text-base font-semibold truncate">
              {TIPO_LABELS[tipoActual] || tipoActual}
            </h2>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Clock className="w-3.5 h-3.5" />
          {TIPO_HORAS[tipoActual] || ahoraHHMM}
        </span>
      </header>

      {alimentos.length > 0 ? (
        <ul className="px-5 space-y-1.5 pb-3 flex-1">
          {alimentos.slice(0, 5).map((a, i) => (
            <li key={i} className="flex items-baseline gap-2 text-sm">
              <span className="w-1 h-1 rounded-full bg-foreground/40 shrink-0 mt-2" />
              <span className="truncate">{a.nombre}</span>
              {a.cantidad > 0 && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {a.esReceta
                    ? etiquetaPorciones(a.cantidad, { media: t("mediaRacion"), varias: (n) => t("raciones", { n }) })
                    : formatQuantity(a.cantidad, a.unidad || "GRAMOS")}
                </span>
              )}
            </li>
          ))}
          {alimentos.length > 5 && (
            <li className="text-[11px] text-muted-foreground pl-3">
              {t("yMas", { count: alimentos.length - 5 })}
            </li>
          )}
        </ul>
      ) : (
        <p className="px-5 pb-3 text-sm text-muted-foreground flex-1">
          {t("sinAlimentos")}
        </p>
      )}

      <div className="p-5 pt-2 border-t border-border flex items-center justify-between gap-3 mt-auto">
        <Link
          href="/paciente/portal/dieta"
          className="text-sm text-primary hover:underline"
        >
          {t("verDieta")}
        </Link>
        <Link
          href="/paciente/portal/seguimiento"
          className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          {t("registrar")}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}
