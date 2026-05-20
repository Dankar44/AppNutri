"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import {
  getDisponibilidadSemanaPaciente,
  solicitarCitaPaciente,
  type DiaDisponibilidad,
  type DisponibilidadSemanal,
} from "@/app/actions/citas-flujo";
import { withTimeout } from "@/lib/utils";

const MESES_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const;

const PX_PER_HOUR = 36;

function lunesDeSemana(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toYYYYMMDD(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
}

function hoyMadridStr(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
}

function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m || 0);
}

function labelSemana(lunesISO: string, tCommon: ReturnType<typeof useTranslations<"common">>): string {
  const [y, m, d] = lunesISO.split("-").map(Number);
  const ini = new Date(y, m - 1, d);
  const fin = new Date(ini);
  fin.setDate(fin.getDate() + 6);
  if (ini.getMonth() === fin.getMonth()) {
    const mes = tCommon(`monthsLong.${MESES_KEYS[ini.getMonth()]}` as never) as string;
    return `${ini.getDate()}–${fin.getDate()} de ${mes}`;
  }
  const mesIniShort = tCommon(`monthsShort.${MESES_KEYS[ini.getMonth()]}` as never) as string;
  const mesFinShort = tCommon(`monthsShort.${MESES_KEYS[fin.getMonth()]}` as never) as string;
  return `${ini.getDate()} ${mesIniShort} – ${fin.getDate()} ${mesFinShort}`;
}

function labelFechaCita(fechaHoraISO: string, locale: string): string {
  const d = new Date(fechaHoraISO);
  return d.toLocaleString(locale, {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SolicitarCitaForm() {
  const t = useTranslations("patient-portal");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? "pt-BR" : "es-ES";
  const router = useRouter();
  const [lunesISO, setLunesISO] = useState<string>(() =>
    toYYYYMMDD(lunesDeSemana(new Date())),
  );
  const [data, setData] = useState<DisponibilidadSemanal | null>(null);
  const [loading, setLoading] = useState(true);
  const [slotSeleccionado, setSlotSeleccionado] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [submitting, startSubmit] = useTransition();

  const cargar = useCallback(async (lunes: string) => {
    setLoading(true);
    try {
      const res = await getDisponibilidadSemanaPaciente(lunes);
      setData(res);
    } catch {
      setData(null);
      toast.error(t("nuevaCita.toast.errorCargarDisponibilidad"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar(lunesISO);
  }, [lunesISO, cargar]);

  useEffect(() => {
    setSlotSeleccionado(null);
  }, [lunesISO]);

  function semanaAnterior() {
    const [y, m, d] = lunesISO.split("-").map(Number);
    const prev = new Date(y, m - 1, d);
    prev.setDate(prev.getDate() - 7);
    setLunesISO(toYYYYMMDD(prev));
  }
  function semanaSiguiente() {
    const [y, m, d] = lunesISO.split("-").map(Number);
    const next = new Date(y, m - 1, d);
    next.setDate(next.getDate() + 7);
    setLunesISO(toYYYYMMDD(next));
  }
  function semanaActual() {
    setLunesISO(toYYYYMMDD(lunesDeSemana(new Date())));
  }

  const lunesActualISO = toYYYYMMDD(lunesDeSemana(new Date()));
  const puedeAtras = lunesISO > lunesActualISO;

  function handleSubmit() {
    if (!slotSeleccionado) return;
    startSubmit(async () => {
      try {
        await withTimeout(solicitarCitaPaciente(slotSeleccionado, motivo.trim() || undefined));
        toast.success(t("nuevaCita.toast.solicitudEnviada"));
        router.push("/paciente/portal/citas");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("nuevaCita.toast.errorSolicitar"));
      }
    });
  }

  const totalHuecos = useMemo(() => {
    if (!data) return 0;
    return data.dias.reduce((sum, d) => sum + d.libres.length, 0);
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Barra de navegación semanal + leyenda */}
      <div className="flex flex-wrap items-center justify-between gap-2 lg:rounded-xl lg:border lg:border-border lg:bg-card px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={semanaAnterior}
            disabled={!puedeAtras}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label={t("nuevaCita.grid.semanaAnterior" as never)}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={semanaActual}
            className="px-3 h-8 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium transition-colors"
          >
            {t("nuevaCita.estaSemana")}
          </button>
          <button
            type="button"
            onClick={semanaSiguiente}
            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
            aria-label={t("nuevaCita.grid.semanaSiguiente" as never)}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="ml-2 text-sm font-semibold capitalize">
            {labelSemana(lunesISO, tCommon)}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {data && (
            <span className="font-medium text-foreground">
              {t("nuevaCita.minPorCita", { duracion: data.duracion })}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-500/40" />
            {t("nuevaCita.leyenda.disponible")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300 dark:bg-rose-500/20 dark:border-rose-500/40" />
            {t("nuevaCita.leyenda.ocupado")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-muted border border-border" />
            {t("nuevaCita.leyenda.fueraHorario")}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="lg:rounded-xl lg:border lg:border-border overflow-hidden lg:bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !data ? (
          <div className="p-10 text-center">
            <Clock className="w-8 h-8 mx-auto text-muted-foreground/60 mb-3" />
            <h3 className="font-semibold text-sm mb-1">{t("nuevaCita.sinHorario.title")}</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {t("nuevaCita.sinHorario.description")}
            </p>
          </div>
        ) : (
          <>
            <GridSemanal
              data={data}
              slotSeleccionado={slotSeleccionado}
              onSelect={setSlotSeleccionado}
              hoyISO={hoyMadridStr()}
            />
            {totalHuecos === 0 && (
              <div className="border-t border-border bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground">
                {t("nuevaCita.sinHuecosSemana")}
              </div>
            )}
          </>
        )}
      </div>

      {/* Panel de confirmación */}
      <div className="lg:rounded-xl lg:border lg:border-border lg:bg-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            {slotSeleccionado ? (
              <>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {t("nuevaCita.citaSeleccionada")}
                  </p>
                  <p className="text-sm font-semibold capitalize truncate">
                    {labelFechaCita(slotSeleccionado, dateLocale)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground shrink-0">
                  <Info className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{t("nuevaCita.seleccionaHueco")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("nuevaCita.seleccionaHuecoDesc")}
                  </p>
                </div>
              </>
            )}
          </div>

          {slotSeleccionado && (
            <div className="lg:flex-1 lg:max-w-md">
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={200}
                placeholder={t("nuevaCita.motivoPlaceholder")}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          <div className="flex items-center gap-2 lg:shrink-0">
            <button
              type="button"
              onClick={() => router.push("/paciente/portal/citas")}
              className="h-10 px-4 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium transition-colors"
            >
              {t("nuevaCita.cancelar")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!slotSeleccionado || submitting}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarCheck2 className="w-4 h-4" />
              )}
              {t("nuevaCita.solicitarCita")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GridSemanal({
  data,
  slotSeleccionado,
  onSelect,
  hoyISO,
}: {
  data: DisponibilidadSemanal;
  slotSeleccionado: string | null;
  onSelect: (slot: string) => void;
  hoyISO: string;
}) {
  const t = useTranslations("patient-portal");
  const diasLabel = t.raw("nuevaCita.grid.dias") as string[];
  const { rangoHoras, dias } = data;
  const inicioH = rangoHoras.inicio;
  const finH = rangoHoras.fin;
  const totalHoras = finH - inicioH;
  const altura = totalHoras * PX_PER_HOUR;

  const horas: number[] = [];
  for (let h = inicioH; h <= finH; h++) horas.push(h);

  return (
    <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
      <div className="min-w-[720px]">
        {/* Header días — sticky en el top del scroll */}
        <div
          className="grid bg-muted/30 border-b border-border sticky top-0 z-20 backdrop-blur"
          style={{ gridTemplateColumns: "60px repeat(7, minmax(0, 1fr))" }}
        >
          <div className="bg-muted/30" />
          {dias.map((d, i) => {
            const [y, m, dd] = d.fechaLocal.split("-").map(Number);
            const fecha = new Date(y, m - 1, dd);
            const esHoy = d.fechaLocal === hoyISO;
            return (
              <div
                key={d.fechaLocal}
                className={`text-center py-2 border-r border-border last:border-r-0 ${
                  esHoy ? "bg-primary/5" : "bg-muted/30"
                }`}
              >
                <div
                  className={`text-[10px] uppercase tracking-wider ${
                    esHoy ? "text-primary font-bold" : "text-muted-foreground font-medium"
                  }`}
                >
                  {diasLabel[i]}
                </div>
                <div
                  className={`text-lg font-bold tabular-nums leading-tight ${
                    esHoy ? "text-primary" : ""
                  }`}
                >
                  {fecha.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cuerpo */}
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: "60px repeat(7, minmax(0, 1fr))",
            height: `${altura}px`,
          }}
        >
          {/* Columna de horas */}
          <div className="border-r border-border bg-muted/10 relative">
            {horas.slice(0, -1).map((h) => (
              <div
                key={h}
                className="absolute left-0 right-0 text-[10px] text-muted-foreground font-mono text-center pt-0.5"
                style={{ top: `${(h - inicioH) * PX_PER_HOUR}px` }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {dias.map((d) => (
            <DiaColumna
              key={d.fechaLocal}
              dia={d}
              inicioH={inicioH}
              finH={finH}
              duracion={data.duracion}
              slotSeleccionado={slotSeleccionado}
              onSelect={onSelect}
            />
          ))}

          {/* Líneas horarias horizontales */}
          <div
            className="absolute left-0 right-0 top-0 pointer-events-none"
            style={{ height: `${altura}px` }}
          >
            {horas.map((h) => (
              <div
                key={h}
                className="absolute left-[60px] right-0 border-t border-border/40"
                style={{ top: `${(h - inicioH) * PX_PER_HOUR}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiaColumna({
  dia,
  inicioH,
  finH,
  duracion,
  slotSeleccionado,
  onSelect,
}: {
  dia: DiaDisponibilidad;
  inicioH: number;
  finH: number;
  duracion: number;
  slotSeleccionado: string | null;
  onSelect: (slot: string) => void;
}) {
  const t = useTranslations("patient-portal");
  const pxPerMin = PX_PER_HOUR / 60;
  const startMin = inicioH * 60;
  const endMin = finH * 60;

  return (
    <div className="relative border-r border-border last:border-r-0">
      {/* Fondo rayado "fuera de horario" */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,0.025)_6px,rgba(0,0,0,0.025)_12px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(255,255,255,0.03)_6px,rgba(255,255,255,0.03)_12px)]" />

      {/* Horario laboral: fondo limpio encima del rayado */}
      {dia.intervalos.map((iv, idx) => {
        const ini = Math.max(hhmmToMinutes(iv.inicio), startMin);
        const fin = Math.min(hhmmToMinutes(iv.fin), endMin);
        if (fin <= ini) return null;
        const top = (ini - startMin) * pxPerMin;
        const height = (fin - ini) * pxPerMin;
        return (
          <div
            key={idx}
            className="absolute left-0 right-0 bg-card"
            style={{ top: `${top}px`, height: `${height}px` }}
          />
        );
      })}

      {/* Ocupados */}
      {dia.ocupados.map((o, idx) => {
        const ini = Math.max(hhmmToMinutes(o.horaInicio), startMin);
        const fin = Math.min(hhmmToMinutes(o.horaFin), endMin);
        if (fin <= ini) return null;
        const top = (ini - startMin) * pxPerMin;
        const height = (fin - ini) * pxPerMin;
        return (
          <div
            key={idx}
            className="absolute left-0.5 right-0.5 bg-rose-100/80 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 rounded-md overflow-hidden"
            style={{ top: `${top + 1}px`, height: `${height - 2}px` }}
            title={t("nuevaCita.grid.ocupado")}
          >
            <div className="flex items-center justify-center h-full gap-1 text-[10px] font-medium text-rose-700 dark:text-rose-300">
              <Lock className="w-3 h-3" strokeWidth={2} />
              <span className="hidden sm:inline">{t("nuevaCita.grid.ocupado")}</span>
            </div>
          </div>
        );
      })}

      {/* Huecos libres */}
      {dia.libres.map((s) => {
        const ini = Math.max(hhmmToMinutes(s.horaLocal), startMin);
        const fin = Math.min(ini + duracion, endMin);
        if (fin <= ini) return null;
        const top = (ini - startMin) * pxPerMin;
        const height = (fin - ini) * pxPerMin;
        const seleccionado = slotSeleccionado === s.fechaHora;
        return (
          <button
            key={s.fechaHora}
            type="button"
            onClick={() => onSelect(s.fechaHora)}
            className={`absolute left-0.5 right-0.5 rounded-md border text-[11px] font-semibold transition-all overflow-hidden flex items-center justify-center gap-1 ${
              seleccionado
                ? "bg-primary text-primary-foreground border-primary shadow-lg ring-2 ring-primary/30 ring-offset-1 ring-offset-card z-10 scale-[1.02]"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 dark:hover:bg-emerald-500/25 cursor-pointer"
            }`}
            style={{ top: `${top + 1}px`, height: `${height - 2}px` }}
            aria-label={t("nuevaCita.grid.solicitarALas" as never, { hora: s.horaLocal } as never)}
          >
            <Clock className="w-3 h-3" strokeWidth={2} />
            {s.horaLocal}
          </button>
        );
      })}
    </div>
  );
}
