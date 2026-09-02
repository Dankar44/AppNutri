import { Target } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { PlanificacionCongelada } from "@/lib/entrega-congelada";

/**
 * #40 — La planificación del alumno, en solo lectura, para el profesor (Guillermo, 2 sep 2026:
 * "que vea absolutamente todo, no solo la dieta, también la planificación").
 *
 * Es un resumen de lo que decidió: objetivos, peso y grasa, actividad, ajuste y reparto por
 * comidas. No es el editor: el profesor no puede tocarlo y no le hace falta el cálculo en vivo.
 */
const TIPOS_COMIDA: Record<string, string> = {
  DESAYUNO: "Desayuno", MEDIA_MANANA: "Media mañana", ALMUERZO: "Almuerzo",
  MERIENDA: "Merienda", CENA: "Cena", RECENA: "Recena", OTRA: "Otra",
};

function n(v: number | string | null | undefined, sufijo = ""): string | null {
  if (v === null || v === undefined || v === "") return null;
  const num = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(num)) return null;
  return `${Math.round(num * 10) / 10}${sufijo}`;
}

export async function PlanificacionResumen({ planificaciones }: { planificaciones: PlanificacionCongelada[] }) {
  const t = await getTranslations("casos");
  return (
    <section className="py-4 lg:px-6 lg:py-6 lg:border lg:border-border lg:rounded-xl lg:bg-card">
      <h2 className="font-semibold inline-flex items-center gap-2">
        <Target className="w-4 h-4 text-muted-foreground" />
        {t("planificacion.titulo")}
      </h2>
      {planificaciones.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-2">{t("planificacion.ninguna")}</p>
      ) : (
        <div className="mt-3 space-y-4">
          {planificaciones.map((p) => {
            const d = p.datos;
            const datos: [string, string | null][] = [
              [t("planificacion.kcal"), n(d.kcalObjetivo, " kcal")],
              [t("planificacion.proteinas"), n(d.protGObjetivo, " g") && `${n(d.protGObjetivo, " g")}${d.protPct != null ? ` (${n(d.protPct, "%")})` : ""}`],
              [t("planificacion.carbohidratos"), n(d.carbGObjetivo, " g") && `${n(d.carbGObjetivo, " g")}${d.carbPct != null ? ` (${n(d.carbPct, "%")})` : ""}`],
              [t("planificacion.grasas"), n(d.grasaGObjetivo, " g") && `${n(d.grasaGObjetivo, " g")}${d.grasaPct != null ? ` (${n(d.grasaPct, "%")})` : ""}`],
              [t("planificacion.pesoActual"), n(d.pesoActual, " kg")],
              [t("planificacion.pesoObjetivo"), n(d.pesoObjetivo, " kg")],
              [t("planificacion.grasaActual"), n(d.grasaActual, "%")],
              [t("planificacion.grasaObjetivo"), n(d.grasaObjetivo, "%")],
              [t("planificacion.ajuste"), d.ajusteObjetivoPct != null ? `${d.ajusteObjetivoPct > 0 ? "+" : ""}${d.ajusteObjetivoPct}%` : null],
              [t("planificacion.actividad"), d.actividadObjetivo || d.actividadActual || null],
              [t("planificacion.formula"), [d.formulaBmr, d.formulaEer].filter(Boolean).join(" · ") || null],
            ];
            const conDato = datos.filter(([, v]) => v);
            const reparto = d.repartoPorComida?.activo ? d.repartoPorComida.comidas.filter((c) => c.incluida) : [];
            return (
              <div key={p.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                <p className="text-sm font-medium">
                  {p.nombre}
                  {p.esDefecto && <span className="ml-2 text-xs font-normal text-muted-foreground">{t("planificacion.porDefecto")}</span>}
                </p>
                {conDato.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-1">{t("planificacion.vacia")}</p>
                ) : (
                  <dl className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                    {conDato.map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-muted-foreground">{k}</dt>
                        <dd className="font-medium tabular-nums">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {reparto.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground">{t("planificacion.reparto")}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {reparto.map((c, i) => (
                        <span key={`${c.tipo}-${c.nombre ?? i}`} className="text-xs px-2 py-1 rounded-lg bg-muted tabular-nums">
                          {c.nombre || TIPOS_COMIDA[c.tipo] || c.tipo}{c.hora ? ` ${c.hora}` : ""} · {Math.round(c.kcalPct)}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
