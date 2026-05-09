"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CitaDetalleModal, type CitaDetalle } from "./cita-detalle-modal";
import { toMadridDateStr, toMadridTimeStr } from "@/lib/tz";

const START_HOUR = 6;
const END_HOUR = 22;

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
  PENDIENTE: "bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-500/30",
  CONFIRMADA: "bg-sky-100 dark:bg-sky-500/15 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-500/30",
  COMPLETADA: "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-500/30",
  CANCELADA: "bg-muted text-muted-foreground border-border",
  CONTRAPROPUESTA: "bg-indigo-100 dark:bg-indigo-500/15 text-indigo-900 dark:text-indigo-200 border-indigo-200 dark:border-indigo-500/30",
};

interface Cita {
  id: string;
  fechaHora: string;
  duracion: number;
  motivo: string | null;
  estado: string;
  notas?: string | null;
  origen?: string;
  propuestoPor?: string;
  isOnline?: boolean;
  googleMeetLink?: string | null;
  paciente: { id: string; nombre: string; apellidos: string; fotoUrl?: string | null };
}

interface Props {
  fecha: string;
  citas: Cita[];
}

const formatLocalDate = toMadridDateStr;

export function AgendaVistaDia({ fecha, citas }: Props) {
  const isMobile = useIsMobile();
  const pxPerHour = isMobile ? 56 : 52;
  const [ahora, setAhora] = useState(() => new Date());
  const [citaAbierta, setCitaAbierta] = useState<CitaDetalle | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const now = new Date();
    const esHoyInit =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}` === fecha;

    let targetPx: number;
    if (esHoyInit) {
      const minutosDesde = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60;
      const clamped = Math.max(0, Math.min(minutosDesde, (END_HOUR - START_HOUR + 1) * 60));
      targetPx = (clamped / 60) * pxPerHour;
    } else if (citas.length > 0) {
      const primera = new Date(
        citas.reduce((min, c) => (c.fechaHora < min ? c.fechaHora : min), citas[0].fechaHora),
      );
      const min = primera.getHours() * 60 + primera.getMinutes() - START_HOUR * 60;
      targetPx = Math.max(0, (min / 60) * pxPerHour);
    } else {
      targetPx = (8 - START_HOUR) * pxPerHour;
    }

    const viewportH = el.clientHeight;
    const maxScroll = Math.max(0, el.scrollHeight - viewportH);
    const scrollTop = Math.max(0, Math.min(maxScroll, targetPx - viewportH / 2));
    el.scrollTop = scrollTop;
  }, [fecha, citas, pxPerHour]);

  const esHoy = formatLocalDate(ahora) === fecha;

  const horas = useMemo(
    () =>
      Array.from(
        { length: END_HOUR - START_HOUR + 1 },
        (_, i) => START_HOUR + i
      ),
    []
  );

  const totalHeight = (END_HOUR - START_HOUR + 1) * pxPerHour;

  const minutosDesdeInicio = (d: Date) =>
    d.getHours() * 60 + d.getMinutes() - START_HOUR * 60;

  const lineaActualPct = useMemo(() => {
    if (!esHoy) return null;
    const m = minutosDesdeInicio(ahora);
    const max = (END_HOUR - START_HOUR + 1) * 60;
    if (m < 0 || m > max) return null;
    return (m / max) * 100;
  }, [ahora, esHoy]);

  function posicionCita(cita: Cita) {
    const inicio = new Date(cita.fechaHora);
    const startMin = minutosDesdeInicio(inicio);
    const durMin = cita.duracion;
    let topMin = startMin;
    let visibleMin = durMin;
    if (startMin + durMin < 0) return null;
    if (startMin > (END_HOUR - START_HOUR + 1) * 60) return null;
    if (startMin < 0) {
      visibleMin += startMin;
      topMin = 0;
    }
    if (visibleMin <= 0) return null;
    const maxMin = (END_HOUR - START_HOUR + 1) * 60;
    if (topMin + visibleMin > maxMin) {
      visibleMin = maxMin - topMin;
    }
    const topPx = (topMin / 60) * pxPerHour;
    const heightPx = Math.max((visibleMin / 60) * pxPerHour, 28);
    return { topPx, heightPx };
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col" style={{ maxHeight: isMobile ? 'calc(100dvh - 280px)' : 'calc(100vh - 220px)' }}>
      <div ref={scrollRef} className="relative flex overflow-y-auto flex-1 min-h-0">
        <div
          className="w-12 sm:w-16 shrink-0 border-r border-border bg-muted/30"
          style={{ height: totalHeight }}
        >
          {horas.map((h, i) => (
            <div
              key={h}
              className="relative"
              style={{ height: pxPerHour }}
            >
              {i > 0 && (
                <span className="absolute -top-2 right-1 sm:right-2 text-[11px] sm:text-xs text-muted-foreground font-medium tabular-nums">
                  {String(h).padStart(2, "0")}:00
                </span>
              )}
            </div>
          ))}
        </div>

        <div
          className="relative flex-1 min-w-0"
          style={{ height: totalHeight }}
        >
          {horas.map((h) => (
            <div
              key={h}
              className="border-b border-border/70 last:border-b-0"
              style={{ height: pxPerHour }}
            />
          ))}

          {lineaActualPct !== null && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${lineaActualPct}%` }}
            >
              <div className="flex items-center gap-1 -translate-y-1/2">
                <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 shadow-sm" />
                <div className="h-0.5 flex-1 bg-rose-500/90" />
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 tabular-nums pr-2 shrink-0 bg-card/90 px-1 rounded">
                  {ahora.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          )}

          {citas.map((cita) => {
            const pos = posicionCita(cita);
            if (!pos) return null;
            const hora = toMadridTimeStr(new Date(cita.fechaHora));
            return (
              <button
                key={cita.id}
                type="button"
                onClick={() => setCitaAbierta(cita as CitaDetalle)}
                className={cn(
                  "absolute left-1 right-2 z-10 rounded-lg border px-2 py-1.5 shadow-sm overflow-hidden text-left hover:ring-2 hover:ring-primary/30 transition-all",
                  ESTADO_STYLES[cita.estado] || ESTADO_STYLES.PENDIENTE
                )}
                style={{
                  top: pos.topPx,
                  height: pos.heightPx,
                  minHeight: 28,
                }}
                title={`${hora} · ${cita.paciente.nombre} ${cita.paciente.apellidos}${cita.motivo ? ` — ${cita.motivo}` : ""}`}
              >
                <div className="text-[12px] font-semibold truncate leading-tight">
                  {cita.paciente.nombre} {cita.paciente.apellidos}
                </div>
                {pos.heightPx > 34 && cita.motivo && (
                  <p className="text-[10px] opacity-75 truncate mt-0.5">
                    {cita.motivo}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {citas.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6 px-4 border-t border-border">
          Sin citas este día.{" "}
          <Link href="/agenda/nueva" className="text-primary font-medium hover:underline">
            Crear cita
          </Link>
        </p>
      )}

      {citaAbierta && (
        <CitaDetalleModal cita={citaAbierta} onClose={() => setCitaAbierta(null)} />
      )}
    </div>
  );
}
