"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CitaDetalleModal, type CitaDetalle } from "./cita-detalle-modal";
import { toMadridDateStr, toMadridTimeStr } from "@/lib/tz";

const START_HOUR = 6;
const END_HOUR = 22;
const PX_PER_HOUR = 52;

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-900 border-amber-200",
  CONFIRMADA: "bg-sky-100 text-sky-900 border-sky-200",
  COMPLETADA: "bg-emerald-100 text-emerald-900 border-emerald-200",
  CANCELADA: "bg-muted text-muted-foreground border-border",
  CONTRAPROPUESTA: "bg-indigo-100 text-indigo-900 border-indigo-200",
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
      targetPx = (clamped / 60) * PX_PER_HOUR;
    } else if (citas.length > 0) {
      const primera = new Date(
        citas.reduce((min, c) => (c.fechaHora < min ? c.fechaHora : min), citas[0].fechaHora),
      );
      const min = primera.getHours() * 60 + primera.getMinutes() - START_HOUR * 60;
      targetPx = Math.max(0, (min / 60) * PX_PER_HOUR);
    } else {
      targetPx = (8 - START_HOUR) * PX_PER_HOUR;
    }

    const viewportH = el.clientHeight;
    const maxScroll = Math.max(0, el.scrollHeight - viewportH);
    const scrollTop = Math.max(0, Math.min(maxScroll, targetPx - viewportH / 2));
    el.scrollTop = scrollTop;
  }, [fecha, citas]);

  const esHoy = formatLocalDate(ahora) === fecha;

  const horas = useMemo(
    () =>
      Array.from(
        { length: END_HOUR - START_HOUR + 1 },
        (_, i) => START_HOUR + i
      ),
    []
  );

  const totalHeight = (END_HOUR - START_HOUR + 1) * PX_PER_HOUR;

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
    const topPx = (topMin / 60) * PX_PER_HOUR;
    const heightPx = Math.max((visibleMin / 60) * PX_PER_HOUR, 28);
    return { topPx, heightPx };
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col max-h-[calc(100vh-220px)]">
      <div ref={scrollRef} className="relative flex overflow-y-auto flex-1 min-h-0">
        <div
          className="w-10 sm:w-14 shrink-0 border-r border-border bg-muted/30"
          style={{ height: totalHeight }}
        >
          {horas.map((h) => (
            <div
              key={h}
              className="text-[10px] sm:text-[11px] text-muted-foreground text-right pr-1 sm:pr-2 pt-0 font-medium tabular-nums"
              style={{ height: PX_PER_HOUR }}
            >
              {String(h).padStart(2, "0")}:00
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
              style={{ height: PX_PER_HOUR }}
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
                <span className="text-[10px] font-semibold text-rose-600 tabular-nums pr-2 shrink-0 bg-card/90 px-1 rounded">
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
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold leading-tight">
                  <Clock className="w-3 h-3 shrink-0 opacity-70" />
                  <span className="tabular-nums">{hora}</span>
                  <span className="truncate font-medium">
                    {cita.paciente.nombre} {cita.paciente.apellidos}
                  </span>
                </div>
                {pos.heightPx > 36 && cita.motivo && (
                  <p className="text-[10px] opacity-80 truncate mt-0.5">
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
