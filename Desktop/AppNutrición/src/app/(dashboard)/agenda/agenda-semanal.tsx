"use client";

import { Clock, User } from "lucide-react";

const DIA_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMADA: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETADA: "bg-green-50 text-green-700 border-green-200",
  CANCELADA: "bg-gray-100 text-gray-500 border-gray-200",
};

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
  citas: Cita[];
  lunes: string;
  diaSeleccionado: string | null;
  onSelectDia: (dia: string | null) => void;
}

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AgendaSemanal({ citas, lunes, diaSeleccionado, onSelectDia }: Props) {
  const lunesDate = new Date(lunes + "T12:00:00");
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunesDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const hoyStr = formatLocalDate(new Date());

  const citasPorDia = diasSemana.map((dia) => {
    const diaStr = formatLocalDate(dia);
    return citas.filter((c) => formatLocalDate(new Date(c.fechaHora)) === diaStr);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {diasSemana.map((dia, i) => {
        const diaStr = formatLocalDate(dia);
        const isHoy = diaStr === hoyStr;
        const isSeleccionado = diaStr === diaSeleccionado;

        return (
          <div key={i} className="min-w-0">
            <button
              type="button"
              onClick={() => onSelectDia(isSeleccionado ? null : diaStr)}
              className={`w-full text-center text-sm font-semibold py-2 rounded-t-lg border-b border-border transition-colors cursor-pointer ${
                isSeleccionado
                  ? "bg-primary text-primary-foreground"
                  : isHoy
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <p>{DIA_LABELS[i]}</p>
              <p className={`text-xs font-normal ${isSeleccionado ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {dia.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </p>
            </button>
            <div className="border-x border-b border-border rounded-b-lg p-2 min-h-[120px] space-y-2">
              {citasPorDia[i].length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">-</p>
              ) : (
                citasPorDia[i].map((cita) => {
                  const hora = new Date(cita.fechaHora).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={cita.id}
                      className={`rounded-lg border p-2 text-xs ${ESTADO_STYLES[cita.estado] || ESTADO_STYLES.PENDIENTE}`}
                    >
                      <div className="flex items-center gap-1 font-semibold mb-0.5">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {hora} ({cita.duracion}min)
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {cita.paciente.nombre} {cita.paciente.apellidos}
                        </span>
                      </div>
                      {cita.motivo && (
                        <p className="text-[10px] opacity-80 truncate mt-0.5">{cita.motivo}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
