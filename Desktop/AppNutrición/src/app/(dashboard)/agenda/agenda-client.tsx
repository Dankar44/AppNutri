"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays, Calendar } from "lucide-react";
import { AgendaSemanal } from "./agenda-semanal";
import { AgendaMensual } from "./agenda-mensual";
import { AgendaDiaDetalle } from "./agenda-dia-detalle";

interface Cita {
  id: string;
  fechaHora: string;
  duracion: number;
  motivo: string | null;
  estado: string;
  notas: string | null;
  paciente: { nombre: string; apellidos: string };
}

interface Props {
  vista: "semana" | "mes";
  fechaInicio: string;
  citas: Cita[];
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

export function AgendaClient({ vista, fechaInicio, citas }: Props) {
  const router = useRouter();
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(
    vista === "semana" ? formatLocalDate(new Date()) : null
  );
  const fecha = new Date(fechaInicio + "T12:00:00");

  function navegar(dir: "anterior" | "hoy" | "siguiente") {
    let nuevaFecha: Date;

    if (dir === "hoy") {
      nuevaFecha = new Date();
    } else if (vista === "semana") {
      nuevaFecha = new Date(fecha);
      nuevaFecha.setDate(nuevaFecha.getDate() + (dir === "siguiente" ? 7 : -7));
    } else {
      nuevaFecha = new Date(fecha);
      nuevaFecha.setMonth(nuevaFecha.getMonth() + (dir === "siguiente" ? 1 : -1));
    }

    setDiaSeleccionado(null);
    router.push(`/agenda?vista=${vista}&fecha=${formatLocalDate(nuevaFecha)}`);
  }

  function cambiarVista(v: "semana" | "mes") {
    setDiaSeleccionado(null);
    router.push(`/agenda?vista=${v}&fecha=${formatLocalDate(fecha)}`);
  }

  // Título según vista
  let titulo: string;
  if (vista === "semana") {
    const lunes = getLunesDeSemana(fecha);
    const domingo = new Date(lunes);
    domingo.setDate(domingo.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    titulo = `${fmt(lunes)} - ${fmt(domingo)}`;
  } else {
    titulo = fecha.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
    titulo = titulo.charAt(0).toUpperCase() + titulo.slice(1);
  }

  // Citas del día seleccionado
  const citasDia = diaSeleccionado
    ? citas.filter((c) => {
        const d = new Date(c.fechaHora);
        return formatLocalDate(d) === diaSeleccionado;
      })
    : [];

  return (
    <>
      {/* Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navegar("anterior")}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navegar("hoy")}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            Hoy
          </button>
          <button
            onClick={() => navegar("siguiente")}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium ml-2">{titulo}</span>
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => cambiarVista("semana")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
              vista === "semana" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Semana
          </button>
          <button
            onClick={() => cambiarVista("mes")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
              vista === "mes" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Mes
          </button>
        </div>
      </div>

      {/* Vista */}
      {vista === "semana" ? (
        <AgendaSemanal
          citas={citas}
          lunes={fechaInicio}
          diaSeleccionado={diaSeleccionado}
          onSelectDia={setDiaSeleccionado}
        />
      ) : (
        <AgendaMensual
          citas={citas}
          anio={fecha.getFullYear()}
          mes={fecha.getMonth()}
          diaSeleccionado={diaSeleccionado}
          onSelectDia={setDiaSeleccionado}
        />
      )}

      {/* Detalle del día */}
      {diaSeleccionado && (
        <AgendaDiaDetalle
          fecha={diaSeleccionado}
          citas={citasDia}
          onClose={() => setDiaSeleccionado(null)}
        />
      )}
    </>
  );
}
