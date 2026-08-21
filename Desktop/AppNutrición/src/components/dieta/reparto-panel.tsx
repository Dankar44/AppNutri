"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Plus, Scale, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DIAS_SEMANA,
  claveComida,
  normalizeReparto,
  objetivoDeFila,
  pctDeFila,
  repartirKcal,
  fijarPctFilaEnDia,
  sumaPctDia,
  repartoEquitativoPorDia,
  type RepartoComida,
  type RepartoPorComida,
} from "@/lib/reparto-comidas";
import { horaEfectiva, minutosDeHora } from "@/lib/comida-horas";

export type RepartoPanelDia = {
  id: string;
  dia: string;
  comidas: { id: string; tipo: string; nombre?: string | null; hora?: string | null }[];
};

type Props = {
  /** Reparto del slot que se está editando (null = esta dieta no tiene reparto para él). */
  reparto: RepartoPorComida | null;
  /** Guarda el reparto de ESTA dieta. Nunca toca la planificación. */
  onChange: (reparto: RepartoPorComida) => void;
  /** Planificaciones de la dieta. `id: ""` = los días sin planificación asignada. */
  slots: { id: string; nombre: string }[];
  slotActivo: string;
  onSlotChange: (id: string) => void;
  /** Días de la dieta que usan el slot activo, con sus comidas REALES. */
  dias: RepartoPanelDia[];
  diaVisto: string;
  onDiaVistoChange: (dia: string) => void;
  /** Objetivo del día visto. Sin kcal no hay nada que repartir. */
  objetivoDia: {
    kcal?: number | null;
    proteinas?: number | null;
    carbohidratos?: number | null;
    grasas?: number | null;
  };
  /** Abre el modal de comida nueva del editor (la crea de verdad en ese día). */
  onAnadirComida: (diaId: string) => void;
  onCerrar: () => void;
};

/**
 * #78-C — Reparto por comida DENTRO de una dieta.
 *
 * Edita la copia que la dieta guarda, no la planificación: lo que se toque aquí no vuelve a la
 * pauta. Es deliberadamente más simple que la tabla de la planificación (sin cuadraditos de días
 * —aquí la comida existe o no existe— y sin overrides de macros por comida, que son configuración
 * de pauta): los gramos objetivo se muestran, no se editan.
 *
 * Los % son POR DÍA: cada día de la dieta puede tener distinto número de comidas, así que cada uno
 * tiene su propio 100%.
 */
export function RepartoPanel({
  reparto,
  onChange,
  slots,
  slotActivo,
  onSlotChange,
  dias,
  diaVisto,
  onDiaVistoChange,
  objetivoDia,
  onAnadirComida,
  onCerrar,
}: Props) {
  const t = useTranslations("diets.reparto");
  const tc = useTranslations("diets.comidaSlot.tipoLabels");
  const tDias = useTranslations("patients.planVisual.dias");
  // Buffer de tecleo: mientras se escribe "1" de "15" no se puede reajustar el resto en cada pulsación.
  const [kcalEdit, setKcalEdit] = useState<{ clave: string; val: string } | null>(null);

  const activo = !!reparto?.activo;
  const comidas = reparto?.comidas ?? [];
  const kcalDia = objetivoDia.kcal ?? 0;

  /** Comidas reales de cada día del slot, por día de la semana. */
  const comidasPorDia = useMemo(() => {
    const out: Record<string, RepartoPanelDia["comidas"]> = {};
    for (const d of dias) out[d.dia] = d.comidas;
    return out;
  }, [dias]);

  const diaActual = dias.find((d) => d.dia === diaVisto) ?? dias[0];
  const clavesDelDia = useMemo(
    () => [...new Set((diaActual?.comidas ?? []).map((c) => claveComida(c)))],
    [diaActual],
  );

  /** ¿Todos los días de este slot tienen las mismas comidas? Entonces editar un % se aplica a todos
   *  (lo normal: una dieta con los 7 días iguales). Si difieren, se toca solo el día visto. */
  const mismasComidas = useMemo(() => {
    if (dias.length <= 1) return true;
    const firma = (d: RepartoPanelDia) =>
      [...new Set(d.comidas.map((c) => claveComida(c)))].sort().join("|");
    const primera = firma(dias[0]);
    return dias.every((d) => firma(d) === primera);
  }, [dias]);

  /** Filas a mostrar: las del reparto que existen este día, en orden cronológico, con sus kcal y
   *  gramos objetivo. Las kcal salen del reparto de restos mayores, igual que en el editor. */
  const filas = useMemo(() => {
    const participantes = comidas.filter(
      (c) => c.incluida && clavesDelDia.includes(claveComida(c)),
    );
    const ordenadas = [...participantes].sort(
      (a, b) => minutosDeHora(horaEfectiva(a)) - minutosDeHora(horaEfectiva(b)),
    );
    const kcals = repartirKcal(
      kcalDia,
      ordenadas.map((c) => pctDeFila(c, diaVisto)),
    );
    return ordenadas.map((c, i) => {
      const pct = pctDeFila(c, diaVisto);
      const obj = objetivoDeFila(kcals[i], pct, c, objetivoDia);
      return {
        fila: c,
        clave: claveComida(c),
        etiqueta: (c.nombre ?? "").trim() || tc(c.tipo as never),
        pct,
        kcal: obj.kcal,
        protG: obj.protG,
        carbG: obj.carbG,
        grasaG: obj.grasaG,
      };
    });
  }, [comidas, clavesDelDia, diaVisto, kcalDia, objetivoDia, tc]);

  const sumaPct = useMemo(
    () => sumaPctDia(comidas, diaVisto, clavesDelDia),
    [comidas, diaVisto, clavesDelDia],
  );
  const kcalRepartidas = filas.reduce((s, f) => s + f.kcal, 0);
  const cuadra = sumaPct === 100;

  /** Comidas del día que NO están en el reparto (fila quitada o desmarcada): se listan para que el
   *  nutri sepa por qué no tienen objetivo, en vez de buscarlas en la tabla sin encontrarlas. */
  const fueraDelReparto = useMemo(() => {
    const dentro = new Set(filas.map((f) => f.clave));
    return (diaActual?.comidas ?? [])
      .filter((c) => !dentro.has(claveComida(c)))
      .map((c) => (c.nombre ?? "").trim() || tc(c.tipo as never));
  }, [filas, diaActual, tc]);

  function aplicarPct(clave: string, pct: number) {
    if (!reparto) return;
    // Con todos los días iguales, el cambio va a los días del slot (es lo que el nutri espera de una
    // dieta con la semana repetida). Si los días tienen comidas distintas, solo al que está viendo:
    // cada uno tiene su propio 100% y propagarlo lo descuadraría.
    const objetivo = mismasComidas ? dias.map((d) => d.dia) : [diaVisto];
    let siguientes = reparto.comidas;
    for (const dia of objetivo) {
      const claves = [...new Set((comidasPorDia[dia] ?? []).map((c) => claveComida(c)))];
      siguientes = fijarPctFilaEnDia(siguientes, clave, pct, dia, claves);
    }
    onChange({ activo: true, comidas: siguientes });
  }

  function cuadrarResto() {
    if (!reparto || filas.length < 2) return;
    // Se deja como está la comida con más peso y se reajustan las demás (mismo criterio que la
    // planificación): así el nutri no pierde el número que acaba de poner.
    const mayor = filas.reduce((a, b) => (b.pct > a.pct ? b : a));
    aplicarPct(mayor.clave, mayor.pct);
  }

  function repartirIgual() {
    if (!reparto) return;
    onChange({ activo: true, comidas: repartoEquitativoPorDia(reparto.comidas, comidasPorDia) });
  }

  function activar() {
    // Cada día se reparte por separado entre SUS comidas: los días pueden tener distinto número de
    // comidas y cada uno tiene su propio 100%.
    const base = normalizeReparto(reparto).comidas;
    onChange({ activo: true, comidas: repartoEquitativoPorDia(base, comidasPorDia) });
  }

  function desactivar() {
    if (!reparto) return;
    onChange({ activo: false, comidas: reparto.comidas });
  }

  const kcalValue = (clave: string, calc: number) =>
    kcalEdit?.clave === clave ? kcalEdit.val : String(calc);

  function commitKcal(clave: string) {
    if (kcalEdit?.clave !== clave) return;
    const kcal = parseFloat(kcalEdit.val.replace(",", "."));
    setKcalEdit(null);
    if (!Number.isFinite(kcal) || kcal < 0 || kcalDia <= 0) return;
    aplicarPct(clave, Math.round((kcal / kcalDia) * 100));
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.03] dark:bg-primary/[0.06] overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-3 sm:px-4 py-3 border-b border-primary/20">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary shrink-0" />
            {t("titulo")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("soloEstaDieta")}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {activo && (
            <button
              type="button"
              onClick={desactivar}
              className="px-2.5 py-1 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("desactivar")}
            </button>
          )}
          <button
            type="button"
            onClick={onCerrar}
            title={t("cerrar")}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-3 space-y-3">
        {/* Con varias planificaciones hay que decir SIEMPRE de cuál es la tabla: cada una tiene su
            reparto y los días de las demás no se tocan. */}
        {slots.length > 1 && (
          <label className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">{t("planificacion")}</span>
            <select
              value={slotActivo}
              onChange={(e) => onSlotChange(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {slots.map((s) => (
                <option key={s.id || "__global"} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </label>
        )}

        {dias.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("sinDiasEnPlani")}</p>
        ) : !activo ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t("activarTexto")}</p>
            <button
              type="button"
              onClick={activar}
              disabled={kcalDia <= 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check className="w-3.5 h-3.5" />
              {t("activar")}
            </button>
            {kcalDia <= 0 && <p className="text-xs text-amber-600 dark:text-amber-400">{t("sinKcal")}</p>}
          </div>
        ) : (
          <>
            {/* Selector de día: los % son de cada día, así que hay que poder ver el de cada uno. */}
            {dias.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {DIAS_SEMANA.filter((d) => dias.some((x) => x.dia === d)).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => onDiaVistoChange(d)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors",
                      d === diaVisto
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {tDias(d as never)}
                  </button>
                ))}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-[420px] w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="py-1.5 pr-3 font-medium">{t("thComida")}</th>
                    <th className="py-1.5 px-2 font-medium w-[130px]">{t("thPct")}</th>
                    <th className="py-1.5 px-2 font-medium w-[110px]">{t("thKcal")}</th>
                    <th className="py-1.5 pl-2 font-medium hidden sm:table-cell">{t("thMacros")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filas.map((f) => (
                    <tr key={f.clave} className="border-t border-border/60">
                      <td className="py-2 pr-3 align-top">
                        <span className="font-medium text-foreground">{f.etiqueta}</span>
                        <span className="block text-xs text-muted-foreground">{horaEfectiva(f.fila)}</span>
                      </td>
                      <td className="py-2 px-2 align-top">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={100}
                            value={f.pct}
                            onChange={(e) => aplicarPct(f.clave, parseInt(e.target.value, 10) || 0)}
                            className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                          <span className="text-muted-foreground text-xs">%</span>
                        </div>
                        {/* Arrastrar re-equilibra las DEMÁS comidas de ese día (como en la planificación). */}
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={f.pct}
                          onChange={(e) => aplicarPct(f.clave, parseInt(e.target.value, 10))}
                          className="macro-slider w-full mt-1.5"
                          style={
                            {
                              "--slider-color": "var(--primary)",
                              "--slider-pct": `${f.pct}%`,
                            } as React.CSSProperties
                          }
                        />
                      </td>
                      <td className="py-2 px-2 align-top">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            value={kcalValue(f.clave, f.kcal)}
                            onChange={(e) => setKcalEdit({ clave: f.clave, val: e.target.value })}
                            onBlur={() => commitKcal(f.clave)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitKcal(f.clave);
                            }}
                            disabled={kcalDia <= 0}
                            className="w-20 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                          />
                          <span className="text-muted-foreground text-xs">kcal</span>
                        </div>
                      </td>
                      <td className="py-2 pl-2 align-top text-xs text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {f.protG != null && <span>P {f.protG}g</span>}
                        {f.carbG != null && <span> · C {f.carbG}g</span>}
                        {f.grasaG != null && <span> · G {f.grasaG}g</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pie: lo que reparte ESE día, sin maquillar. Si el nutri se pasa del objetivo, se ve. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
              <span
                className={cn(
                  "font-medium",
                  cuadra ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
                )}
              >
                {t("pieDia", {
                  dia: tDias(diaVisto as never),
                  pct: sumaPct,
                  kcal: kcalRepartidas,
                  objetivo: Math.round(kcalDia),
                })}
              </span>
              {!cuadra && filas.length >= 2 && (
                <button
                  type="button"
                  onClick={cuadrarResto}
                  className="font-medium text-primary hover:underline"
                >
                  {t("cuadrarResto")}
                </button>
              )}
              <button type="button" onClick={repartirIgual} className="font-medium text-primary hover:underline">
                {t("repartirIgual")}
              </button>
              {mismasComidas && dias.length > 1 && (
                <span className="text-muted-foreground">{t("aplicaATodos", { n: dias.length })}</span>
              )}
            </div>

            {fueraDelReparto.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("fueraDelReparto", { comidas: fueraDelReparto.join(", ") })}
              </p>
            )}

            {diaActual && (
              <button
                type="button"
                onClick={() => onAnadirComida(diaActual.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("anadirComida", { dia: tDias(diaVisto as never) })}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export type { RepartoComida };
