"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Dumbbell,
  Flame,
  Plus,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  EJERCICIOS_DB,
  calcularGastoActividad,
  getEjercicioNombre,
  type EjercicioBase,
} from "@/lib/ejercicios-db";

interface Props {
  ejercicio: boolean;
  tipo: string;
  minutos: number;
  distanciaKm: number;
  kcal: number;
  pesoKg?: number | null;
  ocultarCalorias?: boolean;
  onToggle: (v: boolean) => void;
  onTipo: (v: string) => void;
  onMinutos: (v: number) => void;
  onDistancia: (v: number) => void;
  onKcal: (v: number) => void;
}

const EJ_POR_PAGINA = 5;

export function EjercicioCard({
  ejercicio,
  tipo,
  minutos,
  distanciaKm,
  kcal,
  pesoKg,
  ocultarCalorias = false,
  onToggle,
  onTipo,
  onMinutos,
  onDistancia,
  onKcal,
}: Props) {
  const t = useTranslations("patient-portal");
  const tRoot = useTranslations();
  const peso = pesoKg && pesoKg > 0 ? pesoKg : 70;
  const duracion = minutos > 0 ? minutos : 30;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [customNombre, setCustomNombre] = useState("");
  const [customMet, setCustomMet] = useState("");

  const displayName = (ej: EjercicioBase) => getEjercicioNombre(ej, tRoot);

  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return EJERCICIOS_DB;
    return EJERCICIOS_DB.filter((e) =>
      e.nombre.toLowerCase().includes(q) || getEjercicioNombre(e, tRoot).toLowerCase().includes(q)
    );
  }, [search, tRoot]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / EJ_POR_PAGINA));
  const pageSafe = Math.min(page, totalPages - 1);
  const paginados = filtrados.slice(
    pageSafe * EJ_POR_PAGINA,
    (pageSafe + 1) * EJ_POR_PAGINA
  );

  function seleccionar(ej: EjercicioBase) {
    // Clic sobre la seleccionada → deseleccionar
    if (tipo === ej.nombre) {
      onTipo("");
      onKcal(0);
      return;
    }
    onTipo(ej.nombre);
    if (minutos <= 0) onMinutos(30);
    const mins = minutos > 0 ? minutos : 30;
    onKcal(calcularGastoActividad(ej.met, peso, mins));
  }

  function cambiarDuracion(v: number) {
    const nueva = Math.min(1440, Math.max(0, v));
    onMinutos(nueva);
    // Recalcular kcal si hay actividad conocida seleccionada
    const conocida = EJERCICIOS_DB.find((e) => e.nombre === tipo);
    if (conocida && nueva > 0) {
      onKcal(calcularGastoActividad(conocida.met, peso, nueva));
    }
  }

  function addCustom() {
    const nombre = customNombre.trim();
    const met = parseFloat(customMet);
    if (!nombre || isNaN(met) || met < 1) return;
    onTipo(nombre);
    if (minutos <= 0) onMinutos(30);
    const mins = minutos > 0 ? minutos : 30;
    onKcal(calcularGastoActividad(met, peso, mins));
    setCustomNombre("");
    setCustomMet("");
  }

  return (
    <section
      aria-label={t("seguimiento.ejercicioCard.title")}
      className="rounded-2xl border border-border bg-card overflow-hidden"
    >
      <header className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground">
            <Dumbbell className="w-5 h-5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-base font-semibold">{t("seguimiento.ejercicioCard.title")}</h2>
            <p className="text-[11px] text-muted-foreground">
              {ejercicio ? tipo || t("seguimiento.ejercicioCard.seleccionaActividad") : t("seguimiento.ejercicioCard.teHasMovido")}
            </p>
          </div>
        </div>
        <button
          onClick={() => onToggle(!ejercicio)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            ejercicio ? "bg-emerald-600" : "bg-muted-foreground/30"
          }`}
          aria-pressed={ejercicio}
          aria-label={ejercicio ? t("seguimiento.ejercicioCard.desactivarEjercicio") : t("seguimiento.ejercicioCard.activarEjercicio")}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              ejercicio ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </header>

      {!ejercicio ? (
        <p className="px-5 pb-5 text-sm text-muted-foreground">
          {t("seguimiento.ejercicioCard.toggleHint")}
        </p>
      ) : (
        <>
          {/* Duración + distancia + kcal (kcal oculta si ocultarCalorias) */}
          <div className={`px-5 pb-3 grid gap-3 ${ocultarCalorias ? "grid-cols-2" : "grid-cols-3"}`}>
            <NumberField
              label={t("seguimiento.ejercicioCard.duracion")}
              value={minutos}
              onChange={cambiarDuracion}
              max={1440}
              placeholder="45"
            />
            <NumberField
              label={t("seguimiento.ejercicioCard.distancia")}
              value={distanciaKm}
              onChange={(v) => onDistancia(Math.min(500, Math.max(0, v)))}
              max={500}
              step={0.1}
              placeholder={t("seguimiento.ejercicioCard.distanciaPlaceholder")}
            />
            {!ocultarCalorias && (
            <div>
              <span className="text-xs font-medium text-muted-foreground mb-1 block">
                {t("seguimiento.ejercicioCard.kcalLabel")}
              </span>
              <div className="relative">
                <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={20000}
                  value={kcal || ""}
                  onChange={(e) =>
                    onKcal(Math.min(20000, Math.max(0, Number(e.target.value))))
                  }
                  placeholder={t("seguimiento.ejercicioCard.autoPlaceholder")}
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-border bg-background text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  aria-label={t("seguimiento.ejercicioCard.kcalEditable")}
                />
              </div>
            </div>
            )}
          </div>

          {/* Buscador */}
          <div className="px-5 pb-3 mt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder={t("seguimiento.ejercicioCard.buscarActividad")}
                className="w-full pl-9 pr-3 h-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="px-3 pb-3 space-y-2">
            {paginados.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {t("seguimiento.ejercicioCard.sinActividades")}
              </p>
            ) : (
              paginados.map((ej) => {
                const gasto = calcularGastoActividad(ej.met, peso, duracion);
                const seleccionada = tipo === ej.nombre;
                return (
                  <button
                    key={ej.nombre}
                    type="button"
                    onClick={() => seleccionar(ej)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      seleccionada
                        ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                        : "border-border hover:border-emerald-300 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{displayName(ej)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t("seguimiento.ejercicioCard.compendioParagraph")}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-4 shrink-0">
                      <Stat label="MET" value={ej.met.toString()} />
                      {!ocultarCalorias && <Stat label="Kcal" value={`${gasto}`} />}
                    </div>
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors ${
                        seleccionada
                          ? "bg-emerald-600 text-white"
                          : "border border-border text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      }`}
                    >
                      {seleccionada ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pb-3">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageSafe === 0}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t("seguimiento.ejercicioCard.prevPage")}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {pageSafe + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageSafe >= totalPages - 1}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={t("seguimiento.ejercicioCard.nextPage")}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Custom */}
          <div className="mx-4 mb-4 rounded-xl border border-dashed border-border bg-muted/30 p-3">
            <p className="text-[11px] font-medium text-muted-foreground mb-2">
              {t("seguimiento.ejercicioCard.customTitle")}
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex-1 min-w-[140px]">
                <label className="text-[10px] text-muted-foreground block mb-0.5">
                  {t("seguimiento.ejercicioCard.customNombre")}
                </label>
                <input
                  type="text"
                  placeholder={t("seguimiento.ejercicioCard.customNombrePlaceholder")}
                  value={customNombre}
                  onChange={(e) => setCustomNombre(e.target.value)}
                  maxLength={100}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
              <div className="w-20">
                <label className="text-[10px] text-muted-foreground block mb-0.5">
                  {t("seguimiento.ejercicioCard.customMet")}
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min={1}
                  max={20}
                  placeholder="5.0"
                  value={customMet}
                  onChange={(e) => setCustomMet(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-border bg-background text-sm text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
              <button
                type="button"
                onClick={addCustom}
                disabled={!customNombre.trim() || !customMet}
                className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40"
              >
                {t("seguimiento.ejercicioCard.customAnadir")}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function NumberField({
  label,
  value,
  onChange,
  max,
  step,
  placeholder,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
  step?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground mb-1 block">{label}</span>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        min={0}
        max={max}
        step={step}
        placeholder={placeholder}
        className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-bold tabular-nums leading-none">{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">
        {label}
      </p>
    </div>
  );
}
