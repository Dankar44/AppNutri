"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, Calendar, Plus } from "lucide-react";
import { AgendaSemanal } from "./agenda-semanal";
import { AgendaMensual } from "./agenda-mensual";
import { AgendaDiaDetalle } from "./agenda-dia-detalle";
import { AgendaVistaDia } from "./agenda-vista-dia";

interface Cita {
  id: string;
  fechaHora: string;
  duracion: number;
  motivo: string | null;
  estado: string;
  notas: string | null;
  paciente: { id: string; nombre: string; apellidos: string };
}

interface Props {
  vista: "dia" | "semana" | "mes";
  fechaInicio: string;
  citas: Cita[];
  diaResaltado?: string;
}

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getLunesDeSemana(d: Date): Date {
  const lunes = new Date(d);
  const day = lunes.getDay();
  lunes.setDate(lunes.getDate() - day + (day === 0 ? -6 : 1));
  return lunes;
}

export function AgendaClient({ vista, fechaInicio, citas, diaResaltado }: Props) {
  const router = useRouter();
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(() => {
    if (diaResaltado) return diaResaltado; // viene de ?cita=xxx
    if (vista === "semana") return formatLocalDate(new Date());
    return null;
  });
  const fecha = new Date(fechaInicio + "T12:00:00");

  function navegar(dir: "anterior" | "hoy" | "siguiente") {
    let nuevaFecha: Date;

    if (dir === "hoy") {
      nuevaFecha = new Date();
    } else if (vista === "dia") {
      nuevaFecha = new Date(fecha);
      nuevaFecha.setDate(
        nuevaFecha.getDate() + (dir === "siguiente" ? 1 : -1)
      );
    } else if (vista === "semana") {
      nuevaFecha = new Date(fecha);
      nuevaFecha.setDate(nuevaFecha.getDate() + (dir === "siguiente" ? 7 : -7));
    } else {
      nuevaFecha = new Date(fecha);
      nuevaFecha.setMonth(
        nuevaFecha.getMonth() + (dir === "siguiente" ? 1 : -1)
      );
    }

    setDiaSeleccionado(null);
    let fPush = nuevaFecha;
    if (vista === "semana") {
      fPush = getLunesDeSemana(nuevaFecha);
    } else if (vista === "mes") {
      fPush = new Date(nuevaFecha.getFullYear(), nuevaFecha.getMonth(), 1);
    }
    router.push(`/agenda?vista=${vista}&fecha=${formatLocalDate(fPush)}`);
  }

  function cambiarVista(v: "dia" | "semana" | "mes") {
    setDiaSeleccionado(null);
    const base = new Date(fechaInicio + "T12:00:00");
    let f: Date;
    if (v === "semana") {
      f = getLunesDeSemana(base);
    } else if (v === "mes") {
      f = new Date(base.getFullYear(), base.getMonth(), 1);
    } else {
      f = base;
    }
    router.push(`/agenda?vista=${v}&fecha=${formatLocalDate(f)}`);
  }

  let titulo: string;
  if (vista === "dia") {
    titulo = fecha.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);
  } else if (vista === "semana") {
    const lunes = getLunesDeSemana(fecha);
    const domingo = new Date(lunes);
    domingo.setDate(domingo.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    titulo = `${fmt(lunes)} – ${fmt(domingo)}`;
  } else {
    titulo = fecha.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
    titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);
  }

  const citasDia = diaSeleccionado
    ? citas.filter((c) => {
        const d = new Date(c.fechaHora);
        return formatLocalDate(d) === diaSeleccionado;
      })
    : [];

  const hoy = new Date();
  let mostrandoHoy = false;
  if (vista === "dia") {
    mostrandoHoy = formatLocalDate(fecha) === formatLocalDate(hoy);
  } else if (vista === "semana") {
    mostrandoHoy =
      formatLocalDate(getLunesDeSemana(fecha)) ===
      formatLocalDate(getLunesDeSemana(hoy));
  } else {
    mostrandoHoy =
      fecha.getFullYear() === hoy.getFullYear() &&
      fecha.getMonth() === hoy.getMonth();
  }

  return (
    <div className="min-w-0">
      {/* === MÓVIL (solo < sm) === */}
      <div className="sm:hidden flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-1">
          <Link
            href="/agenda/nueva"
            data-tour="agenda-nueva-cita"
            className="w-9 h-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center shrink-0"
            aria-label="Nueva cita"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
          </Link>
          <div className="flex items-center flex-1 min-w-0 rounded-lg border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => navegar("anterior")}
              className="px-2 py-2 hover:bg-muted transition-colors text-muted-foreground shrink-0"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <p className="text-[13px] font-medium text-foreground text-center flex-1 min-w-0 truncate">
              {titulo}
            </p>
            <button
              type="button"
              onClick={() => navegar("siguiente")}
              className="px-2 py-2 hover:bg-muted transition-colors text-muted-foreground shrink-0"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {!mostrandoHoy && (
            <button
              type="button"
              onClick={() => navegar("hoy")}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors shrink-0 px-1"
            >
              Hoy
            </button>
          )}
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["dia", "semana", "mes"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => cambiarVista(v)}
              className={`flex-1 flex items-center justify-center py-2 text-[13px] font-medium transition-colors ${
                vista === v ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              {v === "dia" ? "Día" : v === "semana" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      {/* === DESKTOP: layout original (sm+) === */}
      <div className="hidden sm:flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
        <p className="text-sm font-semibold text-foreground lg:min-w-[12rem] lg:shrink-0">
          {titulo}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-center lg:flex-1">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navegar("anterior")}
              className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navegar("hoy")}
              disabled={mostrandoHoy}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                mostrandoHoy
                  ? "border-primary/30 bg-primary/10 text-primary cursor-default"
                  : "border-border hover:bg-muted"
              }`}
            >
              {mostrandoHoy
                ? vista === "dia" ? "Hoy" : vista === "semana" ? "Esta semana" : "Este mes"
                : vista === "dia" ? "Ir a este día" : vista === "semana" ? "Ir a esta semana" : "Ir a este mes"}
            </button>
            <button
              type="button"
              onClick={() => navegar("siguiente")}
              className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors flex items-center justify-center"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden w-auto lg:shrink-0">
          <button
            type="button"
            onClick={() => cambiarVista("dia")}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
              vista === "dia" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            Día
          </button>
          <button
            type="button"
            onClick={() => cambiarVista("semana")}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
              vista === "semana" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Semana
          </button>
          <button
            type="button"
            onClick={() => cambiarVista("mes")}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
              vista === "mes" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Mes
          </button>
        </div>
      </div>

      {vista === "dia" && (
        <AgendaVistaDia fecha={fechaInicio} citas={citas} />
      )}
      {vista === "semana" && (
        <AgendaSemanal
          citas={citas}
          lunes={fechaInicio}
          diaSeleccionado={diaSeleccionado}
          onSelectDia={setDiaSeleccionado}
        />
      )}
      {vista === "mes" && (
        <AgendaMensual
          citas={citas}
          anio={fecha.getFullYear()}
          mes={fecha.getMonth()}
          diaSeleccionado={diaSeleccionado}
          onSelectDia={setDiaSeleccionado}
        />
      )}

      {/* Panel día seleccionado: solo en vista MES (en semana ya se navega a vista día) */}
      {diaSeleccionado && vista === "mes" && (
        <AgendaDiaDetalle
          fecha={diaSeleccionado}
          citas={citasDia}
          onClose={() => setDiaSeleccionado(null)}
        />
      )}
    </div>
  );
}
