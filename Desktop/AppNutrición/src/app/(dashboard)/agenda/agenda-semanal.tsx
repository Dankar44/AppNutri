"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CitaDetalleModal, type CitaDetalle } from "./cita-detalle-modal";
import { toMadridDateStr, toMadridTimeStr } from "@/lib/tz";

const START_HOUR = 6;
const END_HOUR = 22;

const DIA_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function useIsMobile(bp = 640) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${bp - 1}px)`);
    setM(mq.matches);
    const h = (e: MediaQueryListEvent) => setM(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [bp]);
  return m;
}

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: "bg-amber-100/80 text-amber-900 dark:text-amber-200 border-l-4 border-amber-500",
  CONFIRMADA: "bg-sky-100/80 text-sky-900 dark:text-sky-200 border-l-4 border-sky-500",
  COMPLETADA: "bg-emerald-100/80 text-emerald-900 dark:text-emerald-200 border-l-4 border-emerald-500",
  CANCELADA: "bg-muted text-muted-foreground border-l-4 border-border",
  CONTRAPROPUESTA: "bg-indigo-100/80 text-indigo-900 dark:text-indigo-200 border-l-4 border-indigo-500",
};

interface Cita {
  id: string;
  fechaHora: string;
  duracion: number;
  motivo: string | null;
  estado: string;
  notas: string | null;
  origen?: string;
  propuestoPor?: string;
  isOnline?: boolean;
  googleMeetLink?: string | null;
  paciente: { id: string; nombre: string; apellidos: string; fotoUrl?: string | null };
}

interface Props {
  citas: Cita[];
  lunes: string;
  diaSeleccionado: string | null;
  onSelectDia: (dia: string | null) => void;
}

const formatLocalDate = toMadridDateStr;

function minutosDesdeInicio(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() - START_HOUR * 60;
}

type PosicionCita = { topPx: number; heightPx: number } | null;

function posicionCita(cita: Cita, pxPerHour: number): PosicionCita {
  const inicio = new Date(cita.fechaHora);
  const startMin = minutosDesdeInicio(inicio);
  const durMin = cita.duracion;
  let topMin = startMin;
  let visibleMin = durMin;
  const maxMin = (END_HOUR - START_HOUR + 1) * 60;
  if (startMin + durMin < 0) return null;
  if (startMin > maxMin) return null;
  if (startMin < 0) {
    visibleMin += startMin;
    topMin = 0;
  }
  if (visibleMin <= 0) return null;
  if (topMin + visibleMin > maxMin) {
    visibleMin = maxMin - topMin;
  }
  const topPx = (topMin / 60) * pxPerHour;
  const heightPx = Math.max((visibleMin / 60) * pxPerHour, 20);
  return { topPx, heightPx };
}

// Algoritmo simple para solapamiento: agrupa citas en columnas dentro del día.
type CitaLayout = Cita & { _col: number; _nCols: number; _pos: { topPx: number; heightPx: number } };

function layoutCitasDia(citas: Cita[], pxPerHour: number): CitaLayout[] {
  const conPos = citas
    .map((c) => ({ cita: c, pos: posicionCita(c, pxPerHour) }))
    .filter((x): x is { cita: Cita; pos: { topPx: number; heightPx: number } } => x.pos !== null)
    .sort((a, b) => a.pos.topPx - b.pos.topPx || b.pos.heightPx - a.pos.heightPx);

  // Agrupar en clusters por solapamiento
  const clusters: { cita: Cita; pos: { topPx: number; heightPx: number } }[][] = [];
  for (const item of conPos) {
    const last = clusters[clusters.length - 1];
    if (!last) {
      clusters.push([item]);
      continue;
    }
    const maxEnd = Math.max(...last.map((x) => x.pos.topPx + x.pos.heightPx));
    if (item.pos.topPx < maxEnd) {
      last.push(item);
    } else {
      clusters.push([item]);
    }
  }

  const result: CitaLayout[] = [];
  for (const cluster of clusters) {
    // Asignar columnas greedy
    const cols: { end: number }[] = [];
    const assignments: number[] = [];
    for (const item of cluster) {
      let placed = false;
      for (let i = 0; i < cols.length; i++) {
        if (cols[i].end <= item.pos.topPx) {
          cols[i].end = item.pos.topPx + item.pos.heightPx;
          assignments.push(i);
          placed = true;
          break;
        }
      }
      if (!placed) {
        assignments.push(cols.length);
        cols.push({ end: item.pos.topPx + item.pos.heightPx });
      }
    }
    const nCols = cols.length;
    cluster.forEach((item, idx) => {
      result.push({ ...item.cita, _col: assignments[idx], _nCols: nCols, _pos: item.pos });
    });
  }
  return result;
}

export function AgendaSemanal({ citas, lunes, onSelectDia }: Props) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const pxPerHour = isMobile ? 48 : 52;
  const totalHeight = (END_HOUR - START_HOUR + 1) * pxPerHour;
  const [citaAbierta, setCitaAbierta] = useState<CitaDetalle | null>(null);
  const [ahora, setAhora] = useState(() => new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const lunesDate = useMemo(() => new Date(lunes + "T12:00:00"), [lunes]);
  const diasSemana = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(lunesDate);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [lunesDate],
  );

  const hoyStr = formatLocalDate(ahora);
  const semanaIncluyeHoy = diasSemana.some((d) => formatLocalDate(d) === hoyStr);

  const citasPorDia = useMemo(
    () =>
      diasSemana.map((dia) => {
        const diaStr = formatLocalDate(dia);
        const delDia = citas.filter((c) => formatLocalDate(new Date(c.fechaHora)) === diaStr);
        return layoutCitasDia(delDia, pxPerHour);
      }),
    [diasSemana, citas, pxPerHour],
  );

  const horas = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    [],
  );

  const lineaAhoraTopPx = useMemo(() => {
    if (!semanaIncluyeHoy) return null;
    const m = minutosDesdeInicio(ahora);
    if (m < 0 || m > (END_HOUR - START_HOUR + 1) * 60) return null;
    return (m / 60) * pxPerHour;
  }, [ahora, semanaIncluyeHoy, pxPerHour]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const targetPx = semanaIncluyeHoy && lineaAhoraTopPx !== null ? lineaAhoraTopPx : (8 - START_HOUR) * pxPerHour;
    const viewportH = el.clientHeight;
    const maxScroll = Math.max(0, el.scrollHeight - viewportH);
    el.scrollTop = Math.max(0, Math.min(maxScroll, targetPx - viewportH / 3));
    // Solo en el mount inicial; evitamos depender de lineaAhoraTopPx para no re-scrollear cada minuto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lunes]);

  function irAVistaDia(diaStr: string) {
    onSelectDia(null);
    router.push(`/agenda?vista=dia&fecha=${diaStr}`);
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col" style={{ maxHeight: isMobile ? 'calc(100dvh - 280px)' : 'calc(100vh - 220px)' }}>
        {/* Header sticky con los días */}
        <div className="flex border-b border-border bg-card z-20">
          <div className="w-10 sm:w-16 shrink-0" />
          <div className="flex-1 grid grid-cols-7">
            {diasSemana.map((dia, i) => {
              const diaStr = formatLocalDate(dia);
              const isHoy = diaStr === hoyStr;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => irAVistaDia(diaStr)}
                  className="group flex flex-col items-center justify-center gap-0.5 sm:gap-1.5 py-2 sm:py-3 text-center hover:bg-muted/30 transition-colors"
                  title="Ir a vista día"
                >
                  <span
                    className={cn(
                      "text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider",
                      isHoy ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {DIA_LABELS[i]}
                  </span>
                  <span
                    className={cn(
                      "flex items-center justify-center text-sm sm:text-2xl font-normal w-7 h-7 sm:w-11 sm:h-11 rounded-full tabular-nums transition-colors",
                      isHoy
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-foreground group-hover:bg-muted",
                    )}
                  >
                    {dia.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid scrollable */}
        <div ref={scrollRef} className="relative flex overflow-y-auto flex-1 min-h-0">
          <div
            className="w-10 sm:w-16 shrink-0 border-r border-border bg-muted/20 relative"
            style={{ height: totalHeight }}
          >
            {horas.map((h, i) => (
              <div
                key={h}
                className="relative"
                style={{ height: pxPerHour }}
              >
                {i > 0 && (
                  <span className="absolute -top-2 right-1 sm:right-2 text-[10px] sm:text-xs text-muted-foreground font-medium tabular-nums">
                    {String(h).padStart(2, "0")}:00
                  </span>
                )}
              </div>
            ))}
          </div>

          <div
            className="flex-1 grid grid-cols-7 relative min-w-0"
            style={{ height: totalHeight }}
          >
            {diasSemana.map((dia, idx) => {
              const diaStr = formatLocalDate(dia);
              const isHoy = diaStr === hoyStr;
              const citasDia = citasPorDia[idx];

              return (
                <div
                  key={idx}
                  className={cn(
                    "relative border-r border-border last:border-r-0",
                    isHoy && "bg-primary/[0.03]",
                  )}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("[data-cita]")) return;
                    irAVistaDia(diaStr);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") irAVistaDia(diaStr);
                  }}
                >
                  {horas.map((h) => (
                    <div
                      key={h}
                      className="border-b border-border/60 last:border-b-0"
                      style={{ height: pxPerHour }}
                    />
                  ))}

                  {/* Citas */}
                  {citasDia.map((cita) => {
                    const hora = toMadridTimeStr(new Date(cita.fechaHora));
                    const widthPct = 100 / cita._nCols;
                    const leftPct = widthPct * cita._col;
                    return (
                      <button
                        key={cita.id}
                        type="button"
                        data-cita
                        onClick={(e) => {
                          e.stopPropagation();
                          setCitaAbierta(cita as CitaDetalle);
                        }}
                        className={cn(
                          "absolute rounded-md px-1.5 py-1 shadow-sm overflow-hidden text-left hover:ring-2 hover:ring-primary/40 hover:z-10 transition-all",
                          ESTADO_STYLES[cita.estado] || ESTADO_STYLES.PENDIENTE,
                        )}
                        style={{
                          top: cita._pos.topPx,
                          height: cita._pos.heightPx,
                          left: `calc(${leftPct}% + 2px)`,
                          width: `calc(${widthPct}% - 4px)`,
                          minHeight: 20,
                        }}
                        title={`${hora} · ${cita.paciente.nombre} ${cita.paciente.apellidos}${cita.motivo ? ` — ${cita.motivo}` : ""}`}
                      >
                        <div className="text-[12px] font-semibold truncate leading-tight">
                          {cita.paciente.nombre} {cita.paciente.apellidos}
                        </div>
                        {cita._pos.heightPx > 34 && cita.motivo && (
                          <div className="text-[10px] opacity-75 truncate mt-0.5">
                            {cita.motivo}
                          </div>
                        )}
                      </button>
                    );
                  })}

                </div>
              );
            })}

            {/* Línea "ahora" cruzando todos los días */}
            {lineaAhoraTopPx !== null && (
              <div
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: lineaAhoraTopPx }}
              >
                <div className="relative">
                  <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
                  <div className="h-0.5 bg-rose-500/90" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {citaAbierta && (
        <CitaDetalleModal cita={citaAbierta} onClose={() => setCitaAbierta(null)} />
      )}
    </>
  );
}
